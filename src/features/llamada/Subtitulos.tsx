export default function Subtitulos({
  textoAvatar,
  transcripcionParcial,
}: {
  textoAvatar: string;
  transcripcionParcial: string;
}) {
  if (!textoAvatar && !transcripcionParcial) return null;
  return (
    <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-1.5 text-center">
      {textoAvatar && (
        <p className="max-w-xl rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white">{textoAvatar}</p>
      )}
      {transcripcionParcial && (
        <p className="max-w-xl rounded-lg bg-black/30 px-3 py-1 text-xs italic text-white/80">
          {transcripcionParcial}
        </p>
      )}
    </div>
  );
}
