import { Link, useParams, useSearchParams } from 'react-router-dom';
import { casosConfig, checklistConfig, obtenerCaso, obtenerCasoPorNivel } from '@/lib/config';
import { obtenerResultadosDeCaso } from '@/lib/progreso';
import { desbloquearVozNavegador } from '@/motor/tts/NavegadorTTS';

export default function BriefingPage() {
  const { casoId } = useParams<{ casoId: string }>();
  const [params] = useSearchParams();
  const debug = params.get('debug') === '1';
  const caso = obtenerCaso(casoId ?? '');

  const { nivel: nivelRequisito, requiereNivel, puntuacionMinima } = casosConfig.requisitoDesbloqueo;
  if (caso.nivel === nivelRequisito) {
    const casoPrevio = obtenerCasoPorNivel(requiereNivel);
    const cumplido = obtenerResultadosDeCaso(casoPrevio.id).some((r) => r.puntuacion >= puntuacionMinima);
    if (!cumplido) {
      return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-xl font-semibold">Nivel {caso.nivel} bloqueado</h1>
          <p className="text-slate-600">
            Primero completa al menos un intento del Nivel {requiereNivel} ({casoPrevio.titulo}).
          </p>
          <Link
            to={`/briefing/${casoPrevio.id}${debug ? '?debug=1' : ''}`}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Ir al Nivel {requiereNivel}
          </Link>
        </main>
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-16">
      <p className="text-sm font-medium text-slate-500">Nivel {caso.nivel} · {caso.dificultad}</p>
      <h1 className="text-xl font-semibold">{caso.titulo}</h1>

      <section className="flex flex-col gap-2 rounded-lg bg-slate-50 p-4">
        {caso.briefing.contexto.map((parrafo, i) => (
          <p key={i} className="text-slate-700">{parrafo}</p>
        ))}
      </section>

      <p className="text-slate-700">
        Vas a hablar con <strong>{caso.avatar.nombre}</strong> ({caso.avatar.rol}, {caso.avatar.edad} años).
      </p>
      <p className="font-medium text-slate-900">Tu objetivo: {caso.briefing.objetivo}</p>

      {caso.mostrarItemsEnBriefing && (
        <section>
          <p className="text-sm font-medium text-slate-500">Recuerda, durante la llamada:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {checklistConfig.items.filter((i) => i.activo).map((i) => (
              <li key={i.id}>{i.etiqueta}</li>
            ))}
          </ul>
        </section>
      )}

      <Link
        to={`/llamada/${caso.id}/1${debug ? '?debug=1' : ''}`}
        onClick={desbloquearVozNavegador}
        className="mt-4 w-fit rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Iniciar llamada
      </Link>
    </main>
  );
}
