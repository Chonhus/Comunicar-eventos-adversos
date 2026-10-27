// F2: sin avatar 3D todavía (eso es F3 con TalkingHead). Imagen de respaldo del
// personaje sobre su fondo, con un indicador de estado (docs/AVATARES.md §5).
import type { Caso } from '@/lib/config/schemas';
import type { EstadoMotor } from '@/motor';
import { rutaPublica } from '@/lib/rutaPublica';

const ETIQUETA_ESTADO: Record<EstadoMotor, string> = {
  conectando: 'Conectando…',
  escuchando: 'Escuchando…',
  pensando: `Pensando…`,
  hablando: 'Hablando…',
  error: 'Ha habido un problema',
};

export default function AvatarEstatico({ caso, estado }: { caso: Caso; estado: EstadoMotor }) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${rutaPublica(caso.avatar.fondo)})` }}
    >
      <img
        src={rutaPublica(caso.avatar.imagenRespaldo)}
        alt={caso.avatar.nombre}
        className={`h-64 w-64 rounded-full border-4 object-cover shadow-lg transition-all md:h-80 md:w-80 ${
          estado === 'hablando' ? 'border-green-400' : 'border-white/70'
        }`}
      />
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
        {estado === 'hablando' && <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />}
        {ETIQUETA_ESTADO[estado]}
      </div>
    </div>
  );
}
