import { useParams } from 'react-router-dom';
import { obtenerCaso } from '@/lib/config';

export default function BriefingPage() {
  const { casoId } = useParams<{ casoId: string }>();
  const caso = obtenerCaso(casoId ?? '');

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-xl font-semibold">{caso.titulo}</h1>
      <p className="mt-2 text-slate-600">
        Vas a hablar con {caso.avatar.nombre} ({caso.avatar.rol}). Pantalla
        completa en la fase F2.
      </p>
    </main>
  );
}
