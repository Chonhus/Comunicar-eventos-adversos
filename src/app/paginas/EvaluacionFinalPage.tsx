// docs/SPEC.md §3.7 — resumen de los 4 intentos (2 niveles x 2 intentos), nota de
// formación y descarga en PDF.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { casosConfig } from '@/lib/config';
import { obtenerNotaFormacion, obtenerTodosLosResultados } from '@/lib/progreso';
import { generarPdfEvaluacionFinal } from '@/lib/exportarPdf';
import { obtenerAlumnoLocal } from '@/lib/accesoAlumno';
import { guardarEncuesta } from '@/lib/persistencia';

const PREGUNTAS_LIKERT = [
  { clave: 'utilidad', texto: '¿Qué tan útil te ha resultado esta práctica?' },
  { clave: 'realismo', texto: '¿Qué tan realista te ha parecido la conversación con el avatar?' },
  { clave: 'confianza', texto: '¿Te sientes más preparado/a para comunicar un evento adverso?' },
];

function EncuestaSatisfaccion({ alumnoId }: { alumnoId: string }) {
  const [likert, setLikert] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState('');
  const [enviada, setEnviada] = useState(false);

  async function enviar() {
    await guardarEncuesta(alumnoId, { ...likert, comentario });
    setEnviada(true);
  }

  if (enviada) {
    return <p className="mt-8 text-sm text-slate-500">Gracias por tu opinión.</p>;
  }

  const completa = PREGUNTAS_LIKERT.every((p) => likert[p.clave] !== undefined);

  return (
    <section className="mt-8 rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold">Encuesta de satisfacción (opcional)</h2>
      <div className="mt-3 flex flex-col gap-4">
        {PREGUNTAS_LIKERT.map((p) => (
          <div key={p.clave}>
            <p className="text-sm text-slate-700">{p.texto}</p>
            <div className="mt-1 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLikert((prev) => ({ ...prev, [p.clave]: n }))}
                  className={`h-8 w-8 rounded-full text-sm ${
                    likert[p.clave] === n ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="text-sm text-slate-700">¿Algo más que quieras comentar?</p>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={!completa}
          onClick={() => void enviar()}
          className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </section>
  );
}

export default function EvaluacionFinalPage() {
  const resultados = obtenerTodosLosResultados();
  const notaFormacion = obtenerNotaFormacion();
  const alumno = obtenerAlumnoLocal();

  if (resultados.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Todavía no hay intentos</h1>
        <p className="mt-2 text-slate-600">Completa al menos un caso para ver tu evaluación final.</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 underline">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-xl font-semibold">Evaluación final</h1>

      {notaFormacion !== null && (
        <p className="mt-2 text-slate-600">Nota del módulo formativo: <strong>{notaFormacion}/10</strong></p>
      )}

      {[...casosConfig.casos]
        .sort((a, b) => a.nivel - b.nivel)
        .map((caso) => {
          const resultadosCaso = resultados
            .filter((r) => r.casoId === caso.id)
            .sort((a, b) => a.intento - b.intento);
          if (resultadosCaso.length === 0) return null;

          return (
            <section key={caso.id} className="mt-6">
              <h2 className="font-semibold">Nivel {caso.nivel} — {caso.titulo}</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {resultadosCaso.map((r) => (
                  <li key={r.intento} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between font-medium">
                      <span>Intento {r.intento}</span>
                      <span>{r.puntuacion}/100</span>
                    </div>
                    <p className="mt-1 text-slate-600">{r.evaluacion.resumen}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            generarPdfEvaluacionFinal({ casos: casosConfig.casos, resultados, notaFormacion })
          }
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Descargar PDF
        </button>
        <Link
          to="/"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Volver al inicio
        </Link>
      </div>

      {alumno && <EncuestaSatisfaccion alumnoId={alumno.id} />}
    </main>
  );
}
