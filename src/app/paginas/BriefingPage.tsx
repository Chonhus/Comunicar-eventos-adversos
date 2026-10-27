import { Link, useParams, useSearchParams } from 'react-router-dom';
import { obtenerCaso } from '@/lib/config';

export default function BriefingPage() {
  const { casoId } = useParams<{ casoId: string }>();
  const [params] = useSearchParams();
  const debug = params.get('debug') === '1';
  const caso = obtenerCaso(casoId ?? '');

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-16">
      <p className="text-sm font-medium text-slate-500">Nivel {caso.nivel} · {caso.dificultad}</p>
      <h1 className="text-xl font-semibold">{caso.titulo}</h1>
      <p className="text-slate-700">
        Vas a hablar con <strong>{caso.avatar.nombre}</strong> ({caso.avatar.rol}, {caso.avatar.edad} años).
      </p>
      <p className="text-slate-700">Objetivo: comunica el evento adverso con claridad y empatía.</p>
      <Link
        to={`/llamada/${caso.id}/1${debug ? '?debug=1' : ''}`}
        className="mt-4 w-fit rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Iniciar llamada
      </Link>
    </main>
  );
}
