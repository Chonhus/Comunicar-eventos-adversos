// docs/SPEC.md §3.7 — resumen de los 4 intentos (2 niveles x 2 intentos), nota de
// formación y descarga en PDF.
import { Link } from 'react-router-dom';
import { casosConfig } from '@/lib/config';
import { obtenerNotaFormacion, obtenerTodosLosResultados } from '@/lib/progreso';
import { generarPdfEvaluacionFinal } from '@/lib/exportarPdf';

export default function EvaluacionFinalPage() {
  const resultados = obtenerTodosLosResultados();
  const notaFormacion = obtenerNotaFormacion();

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
    </main>
  );
}
