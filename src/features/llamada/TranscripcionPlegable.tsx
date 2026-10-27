import { useState } from 'react';
import type { TurnoVisible } from './useLlamada';

// docs/SPEC.md §3.5: "Transcripción completa plegable (oculta por defecto durante la llamada)".
export default function TranscripcionPlegable({ turnos }: { turnos: TurnoVisible[] }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="absolute right-4 top-4 max-w-xs">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="rounded-full bg-black/50 px-3 py-1 text-xs text-white hover:bg-black/70"
      >
        {abierta ? 'Ocultar transcripción ▲' : 'Ver transcripción ▼'}
      </button>
      {abierta && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg bg-black/70 p-3 text-xs text-white">
          {turnos.length === 0 && <p className="text-white/60">Todavía no hay nada que mostrar.</p>}
          <ul className="flex flex-col gap-1.5">
            {turnos.map((t, i) => (
              <li key={i}>
                <span className="font-semibold">{t.rol === 'alumno' ? 'Tú: ' : 'Él/Ella: '}</span>
                {t.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
