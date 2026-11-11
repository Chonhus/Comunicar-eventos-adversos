import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pasos, preguntasPrePost } from '@/features/formacion/contenido';
import VideoFormacion from '@/features/formacion/VideoFormacion';
import MiniTest from '@/features/formacion/MiniTest';
import { obtenerCasoPorNivel } from '@/lib/config';
import { guardarNotaFormacion, guardarPretest } from '@/lib/progreso';
import { obtenerAlumnoLocal } from '@/lib/accesoAlumno';
import { guardarProgresoBloque } from '@/lib/persistencia';

const TOTAL_PREGUNTAS = pasos
  .filter((p) => p.tipo === 'preguntas')
  .reduce((acc, p) => acc + p.preguntas.length, 0);

type Fase =
  | { tipo: 'pretest' }
  | { tipo: 'paso'; indice: number }
  | { tipo: 'resultado'; aciertos: number; total: number };

export default function FormacionPage() {
  const [fase, setFase] = useState<Fase>({ tipo: 'pretest' });
  const navigate = useNavigate();
  // Aciertos de los dos bloques de preguntas intercalados entre los vídeos: se suman
  // en una única puntuación final. Con useRef (no un estado) porque se lee en el
  // mismo instante en que se actualiza, antes de que un re-render lo reflejara.
  const aciertosRef = useRef(0);

  // +1 por el pretest, que cuenta como un paso más a efectos de la barra de progreso.
  const pasosTotales = pasos.length + 1;
  const pasoActual = fase.tipo === 'pretest' ? 1 : fase.tipo === 'paso' ? fase.indice + 2 : pasosTotales;
  const progresoPct = Math.round((pasoActual / pasosTotales) * 100);
  // Un único const (no volver a indexar pasos[...] más abajo): así TS estrecha el
  // tipo de PasoFormacion a PasoVideo/PasoPreguntas según paso.tipo.
  const paso = fase.tipo === 'paso' ? pasos[fase.indice] : null;

  function continuarAlNivel1() {
    const caso = obtenerCasoPorNivel(1);
    navigate(`/briefing/${caso.id}`);
  }

  function marcarPasoCompletado(indice: number, notaTest?: number) {
    const alumno = obtenerAlumnoLocal();
    if (alumno) void guardarProgresoBloque(alumno.id, indice, notaTest);
  }

  function avanzarDesde(indice: number) {
    if (indice === pasos.length - 1) {
      const resultado = { aciertos: aciertosRef.current, total: TOTAL_PREGUNTAS };
      guardarNotaFormacion(resultado);
      setFase({ tipo: 'resultado', ...resultado });
    } else {
      setFase({ tipo: 'paso', indice: indice + 1 });
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-xl font-semibold">Módulo formativo</h1>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-slate-900 transition-all"
          style={{ width: `${progresoPct}%` }}
        />
      </div>

      <div className="mt-6">
        {fase.tipo === 'pretest' && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Antes de empezar, responde estas preguntas — es solo para medir lo que aprendes, no cuenta en tu contra.
            </p>
            <MiniTest
              preguntas={preguntasPrePost}
              onFinalizar={(aciertos) => {
                guardarPretest({ aciertos, total: preguntasPrePost.length });
                setFase({ tipo: 'paso', indice: 0 });
              }}
            />
          </>
        )}

        {fase.tipo === 'paso' && paso?.tipo === 'video' && (
          <>
            <VideoFormacion paso={paso} />
            <div className="mt-5 flex justify-between">
              <button
                type="button"
                onClick={() => setFase({ tipo: 'paso', indice: fase.indice - 1 })}
                disabled={fase.indice === 0}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-0"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => {
                  marcarPasoCompletado(fase.indice);
                  avanzarDesde(fase.indice);
                }}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                {fase.indice === pasos.length - 1 ? 'Finalizar' : 'Siguiente'}
              </button>
            </div>
          </>
        )}

        {fase.tipo === 'paso' && paso?.tipo === 'preguntas' && (
          <MiniTest
            preguntas={paso.preguntas}
            onFinalizar={(aciertos) => {
              aciertosRef.current += aciertos;
              marcarPasoCompletado(fase.indice, Math.round((aciertos / paso.preguntas.length) * 10));
              avanzarDesde(fase.indice);
            }}
          />
        )}

        {fase.tipo === 'resultado' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-500">Preguntas completadas</p>
            <p className="mt-1 text-3xl font-semibold">{fase.aciertos} / {fase.total}</p>
            <p className="mt-2 text-sm text-slate-600">
              La nota queda registrada; no bloquea el acceso al Nivel 1.
            </p>
            <button
              type="button"
              onClick={continuarAlNivel1}
              className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Continuar al Nivel 1
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
