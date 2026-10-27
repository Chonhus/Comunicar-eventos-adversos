// docs/SPEC.md §3.8 — panel del docente: tabla de alumnos del grupo (estado,
// puntuaciones, nº intentos), ver transcripción+evaluación de un intento, exportar CSV.
// Las consultas no filtran por grupo explícitamente: las políticas RLS de
// supabase/migrations/ ya limitan lo que un docente puede leer a su propio grupo.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casosConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { cerrarSesionDocente, obtenerDocenteActual, type DocenteActual } from '@/lib/accesoDocente';
import { construirCsv, descargarCsv } from '@/lib/csv';
import type { EvaluacionIntento } from '@/motor/evaluacion/tipos';

interface FilaAlumno {
  id: string;
  alias: string;
}

interface FilaIntento {
  id: string;
  alumno_id: string;
  caso_id: string;
  numero: number;
  estado: string;
  duracion_s: number | null;
  inicio: string;
  evaluaciones: { puntuacion: number; detalle: EvaluacionIntento; modelo: string } | null;
}

interface FilaTurno {
  rol: 'alumno' | 'avatar';
  texto: string;
  ts: string;
}

type Carga = { tipo: 'cargando' } | { tipo: 'sin_sesion' } | { tipo: 'listo' };

function tituloDeCaso(casoId: string): string {
  return casosConfig.casos.find((c) => c.id === casoId)?.titulo ?? casoId;
}

export default function DocentePanelPage() {
  const navigate = useNavigate();
  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' });
  const [docente, setDocente] = useState<DocenteActual | null>(null);
  const [alumnos, setAlumnos] = useState<FilaAlumno[]>([]);
  const [intentos, setIntentos] = useState<FilaIntento[]>([]);
  const [intentoSeleccionado, setIntentoSeleccionado] = useState<FilaIntento | null>(null);
  const [turnos, setTurnos] = useState<FilaTurno[] | null>(null);

  useEffect(() => {
    obtenerDocenteActual().then(async (d) => {
      if (!d) {
        setCarga({ tipo: 'sin_sesion' });
        return;
      }
      setDocente(d);

      const [{ data: alumnosData }, { data: intentosData }] = await Promise.all([
        supabase.from('alumnos').select('id, alias').eq('grupo_id', d.grupoId).eq('rol', 'alumno').order('alias'),
        supabase
          .from('intentos')
          .select('id, alumno_id, caso_id, numero, estado, duracion_s, inicio, evaluaciones(puntuacion, detalle, modelo)')
          .order('inicio', { ascending: false }),
      ]);
      setAlumnos((alumnosData as FilaAlumno[] | null) ?? []);
      setIntentos((intentosData as unknown as FilaIntento[] | null) ?? []);
      setCarga({ tipo: 'listo' });
    });
  }, []);

  useEffect(() => {
    if (!intentoSeleccionado) {
      setTurnos(null);
      return;
    }
    supabase
      .from('turnos')
      .select('rol, texto, ts')
      .eq('intento_id', intentoSeleccionado.id)
      .order('ts')
      .then(({ data }) => setTurnos((data as FilaTurno[] | null) ?? []));
  }, [intentoSeleccionado]);

  if (carga.tipo === 'cargando') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </main>
    );
  }

  if (carga.tipo === 'sin_sesion') {
    navigate('/docente/login');
    return null;
  }

  function exportarCsv() {
    const filas = intentos.map((i) => {
      const alumno = alumnos.find((a) => a.id === i.alumno_id);
      return [
        alumno?.alias ?? i.alumno_id,
        tituloDeCaso(i.caso_id),
        i.numero,
        i.estado,
        i.evaluaciones?.puntuacion ?? '',
        i.duracion_s ?? '',
      ];
    });
    descargarCsv(
      'intentos.csv',
      construirCsv(['alumno', 'caso', 'intento', 'estado', 'puntuacion', 'duracion_s'], filas),
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Panel docente — {docente?.alias}</h1>
        <button
          type="button"
          onClick={() => void cerrarSesionDocente().then(() => navigate('/docente/login'))}
          className="text-sm text-slate-500 underline"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-semibold">Alumnos</h2>
        <button
          type="button"
          onClick={exportarCsv}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Exportar CSV
        </button>
      </div>

      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2">Alumno</th>
            <th className="py-2">Intentos</th>
            <th className="py-2">Última puntuación</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((a) => {
            const propios = intentos.filter((i) => i.alumno_id === a.id);
            const ultima = propios.find((i) => i.evaluaciones);
            return (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="py-2">{a.alias}</td>
                <td className="py-2">{propios.length}</td>
                <td className="py-2">{ultima?.evaluaciones ? `${ultima.evaluaciones.puntuacion}/100` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 className="mt-8 font-semibold">Intentos</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {intentos.map((i) => {
          const alumno = alumnos.find((a) => a.id === i.alumno_id);
          return (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => setIntentoSeleccionado(i)}
                className={`w-full rounded-lg p-3 text-left text-sm ${
                  intentoSeleccionado?.id === i.id ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {alumno?.alias ?? i.alumno_id} — {tituloDeCaso(i.caso_id)} (intento {i.numero}) —{' '}
                {i.evaluaciones ? `${i.evaluaciones.puntuacion}/100` : i.estado}
              </button>
            </li>
          );
        })}
      </ul>

      {intentoSeleccionado && (
        <section className="mt-6 rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold">Transcripción</h3>
          {turnos === null ? (
            <p className="mt-2 text-sm text-slate-500">Cargando…</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {turnos.map((t, i) => (
                <li key={i}>
                  <strong>{t.rol === 'alumno' ? 'Alumno' : 'Avatar'}:</strong> {t.texto}
                </li>
              ))}
            </ul>
          )}

          {intentoSeleccionado.evaluaciones && (
            <>
              <h3 className="mt-5 font-semibold">Evaluación</h3>
              <p className="mt-1 text-sm text-slate-700">{intentoSeleccionado.evaluaciones.detalle.resumen}</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
