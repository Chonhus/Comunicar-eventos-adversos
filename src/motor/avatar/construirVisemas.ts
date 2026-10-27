// docs/MOTOR.md §8: cada evento `visemeReceived` de Azure trae `visemeId` y
// `audioOffset` (en ticks de 100ns) pero SIN duración: la duración de cada visema
// es la diferencia con el audioOffset del siguiente evento; el último se extiende
// hasta el final del audio.
import { visemaIdAzureAOculus, type VisemaOculus } from './mapaVisemas';

export interface EventoVisemaAzure {
  visemeId: number;
  /** En ticks de 100ns, tal como lo da el SDK (audioOffset). */
  audioOffsetTicks: number;
}

export interface SegmentoVisema {
  visema: VisemaOculus;
  inicioMs: number;
  durMs: number;
}

const TICKS_POR_MS = 10_000;

export function construirSegmentosDesdeEventosAzure(
  eventos: EventoVisemaAzure[],
  duracionTotalMs: number,
): SegmentoVisema[] {
  return eventos.map((ev, i) => {
    const inicioMs = ev.audioOffsetTicks / TICKS_POR_MS;
    const finMs = i + 1 < eventos.length ? eventos[i + 1].audioOffsetTicks / TICKS_POR_MS : duracionTotalMs;
    return {
      visema: visemaIdAzureAOculus(ev.visemeId),
      inicioMs,
      durMs: Math.max(0, finMs - inicioMs),
    };
  });
}
