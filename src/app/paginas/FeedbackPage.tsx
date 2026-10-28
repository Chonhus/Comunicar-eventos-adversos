// docs/SPEC.md §3.6 / §4.2 — Edge Function evaluar-intento → puntuación + feedback.
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { casosConfig, checklistConfig, motorConfig, obtenerCaso } from '@/lib/config';
import { llamarEvaluarIntento } from '@/motor/evaluacion/llamarEvaluarIntento';
import { calcularPuntuacion } from '@/motor/evaluacion/calcularPuntuacion';
import type { DatosLlamadaParaFeedback, EvaluacionIntento } from '@/motor/evaluacion/tipos';
import { guardarResultadoIntento, obtenerUltimoResultado } from '@/lib/progreso';
import { guardarEvaluacion } from '@/lib/persistencia';
import { desbloquearVozNavegador } from '@/motor/tts/NavegadorTTS';

type Estado = { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'listo'; evaluacion: EvaluacionIntento; puntuacion: number };

function parsearIntentoId(intentoId: string): { casoId: string; intento: number } | null {
  const m = /^(.+)-(\d+)$/.exec(intentoId);
  if (!m) return null;
  return { casoId: m[1], intento: Number(m[2]) };
}

export default function FeedbackPage() {
  const { intentoId } = useParams<{ intentoId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const datos = location.state as DatosLlamadaParaFeedback | undefined;
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  // useMemo (no un cálculo directo): si no, `partes` sería un objeto nuevo en cada
  // render y el useEffect de abajo, que lo tiene como dependencia, se repetiría sin fin.
  const partes = useMemo(() => (intentoId ? parsearIntentoId(intentoId) : null), [intentoId]);

  useEffect(() => {
    if (!datos || !partes) return;
    let cancelado = false;
    setEstado({ tipo: 'cargando' });

    const anterior = partes.intento > 1 ? obtenerUltimoResultado(partes.casoId) : null;

    llamarEvaluarIntento({
      casoId: datos.casoId,
      turnos: datos.turnos,
      checklistDetector: datos.checklistDetector,
      duracionSeg: datos.duracionSeg,
      intentoAnterior: anterior
        ? { resumen: `Intento ${anterior.intento}: puntuación ${anterior.puntuacion}/100. ${anterior.evaluacion.resumen}` }
        : null,
    })
      .then((evaluacion) => {
        if (cancelado) return;
        const puntuacion = calcularPuntuacion(evaluacion, checklistConfig);
        guardarResultadoIntento({
          casoId: datos.casoId,
          intento: datos.intento,
          puntuacion,
          evaluacion,
          duracionSeg: datos.duracionSeg,
          fecha: Date.now(),
        });
        if (datos.intentoId) void guardarEvaluacion(datos.intentoId, puntuacion, evaluacion, motorConfig.llm.evaluador);
        setEstado({ tipo: 'listo', evaluacion, puntuacion });
      })
      .catch((e: Error) => {
        if (!cancelado) setEstado({ tipo: 'error', mensaje: e.message });
      });

    return () => {
      cancelado = true;
    };
    // Un único intento de evaluación por montaje (reintentar = botón explícito, no un efecto en bucle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos, partes]);

  if (!partes) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Intento no encontrado</h1>
        <Link to="/" className="mt-4 inline-block text-blue-600 underline">Volver al inicio</Link>
      </main>
    );
  }

  const caso = obtenerCaso(partes.casoId);

  if (!datos) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No hay datos de este intento</h1>
        <p className="mt-2 text-slate-600">
          Parece que has llegado aquí sin pasar por la llamada (p. ej. recargando la página). Vuelve a intentarlo.
        </p>
        <Link to={`/briefing/${caso.id}`} className="mt-4 inline-block text-blue-600 underline">
          Volver al briefing
        </Link>
      </main>
    );
  }

  if (estado.tipo === 'cargando') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <p className="mt-4 text-slate-600">Calculando tu feedback…</p>
      </main>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No se ha podido calcular el feedback</h1>
        <p className="mt-2 text-sm text-slate-500">{estado.mensaje}</p>
        <button
          type="button"
          onClick={() => setEstado({ tipo: 'cargando' })}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Reintentar
        </button>
      </main>
    );
  }

  const { evaluacion, puntuacion } = estado;
  const puedeRepetir = partes.intento < casosConfig.maxIntentos;
  const siguienteCaso = casosConfig.casos.find((c) => c.nivel === caso.nivel + 1);

  function continuar() {
    if (siguienteCaso) navigate(`/briefing/${siguienteCaso.id}`);
    else navigate('/evaluacion-final');
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-xl font-semibold">Feedback — Intento {partes.intento}</h1>
      <p className="text-slate-500">{caso.titulo}</p>

      <div className="mt-6 rounded-xl bg-slate-900 p-6 text-center text-white">
        <p className="text-sm text-white/70">Puntuación</p>
        <p className="text-4xl font-bold">{puntuacion}/100</p>
      </div>

      {evaluacion.comparacion_intento_anterior && (
        <section className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          <h2 className="font-semibold">Comparación con el intento anterior</h2>
          <p className="mt-1">{evaluacion.comparacion_intento_anterior}</p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">Resumen</h2>
        <p className="mt-1 text-slate-700">{evaluacion.resumen}</p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Por ítem</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {checklistConfig.items.map((item) => {
            const ev = evaluacion.items.find((i) => i.id === item.id);
            const puntos = ev?.puntuacion ?? 0;
            const color = puntos === 2 ? 'bg-green-50 text-green-800' : puntos === 1 ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600';
            return (
              <li key={item.id} className={`rounded-lg p-3 text-sm ${color}`}>
                <div className="flex items-center justify-between font-medium">
                  <span>{item.etiqueta}</span>
                  <span>{puntos}/2</span>
                </div>
                {ev?.comentario && <p className="mt-1">{ev.comentario}</p>}
              </li>
            );
          })}
        </ul>
      </section>

      {evaluacion.alertas.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Alertas</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {evaluacion.alertas.map((a) => {
              const def = checklistConfig.alertas.find((x) => x.id === a.id);
              return (
                <li key={a.id} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">⚠ {def?.etiqueta ?? a.id}</p>
                  {a.evidencia && <p className="mt-1 italic">"{a.evidencia}"</p>}
                  {a.comentario && <p className="mt-1">{a.comentario}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">Fortalezas</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {evaluacion.fortalezas.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Mejoras</h2>
        <ul className="mt-2 flex flex-col gap-3">
          {evaluacion.mejoras.map((m, i) => (
            <li key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">{m.aspecto}</p>
              <p className="mt-1 text-slate-600">Podrías decir: "{m.frase_alternativa}"</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Valoración global</h2>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-slate-500">Empatía</p>
            <p className="text-lg font-semibold">{evaluacion.global.empatia}/5</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-slate-500">Claridad</p>
            <p className="text-lg font-semibold">{evaluacion.global.claridad}/5</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-slate-500">Honestidad</p>
            <p className="text-lg font-semibold">{evaluacion.global.honestidad}/5</p>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {puedeRepetir && (
          <button
            type="button"
            onClick={() => {
              desbloquearVozNavegador();
              navigate(`/llamada/${caso.id}/${partes.intento + 1}`);
            }}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Repetir (intento {partes.intento + 1})
          </button>
        )}
        <button
          type="button"
          onClick={continuar}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {siguienteCaso ? 'Pasar al siguiente nivel' : 'Ver evaluación final'}
        </button>
      </div>
    </main>
  );
}
