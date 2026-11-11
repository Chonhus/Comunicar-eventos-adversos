import type { PasoVideo } from './tipos';

// youtube-nocookie.com: modo de privacidad ampliada de YouTube, no pone cookies de
// seguimiento hasta que el alumno interactúa con el reproductor.
export default function VideoFormacion({ paso }: { paso: PasoVideo }) {
  if (paso.youtubeId === 'PENDIENTE') {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500">
        <p className="font-medium">{paso.titulo}</p>
        <p className="text-sm">Vídeo pendiente de subir.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">{paso.titulo}</h2>
      {paso.descripcion && <p className="mt-1 text-sm text-slate-600">{paso.descripcion}</p>}
      <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${paso.youtubeId}`}
          title={paso.titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
