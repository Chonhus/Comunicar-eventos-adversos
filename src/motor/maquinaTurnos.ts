// docs/MOTOR.md §4 — máquina de estados del turno, sin dependencias del navegador
// (testeable en Node/Vitest).
export type EstadoTurno = 'escuchando' | 'pensando' | 'hablando';

export class MaquinaTurnos {
  private estado: EstadoTurno = 'escuchando';

  constructor(private readonly onCambio?: (estado: EstadoTurno) => void) {}

  get estadoActual(): EstadoTurno {
    return this.estado;
  }

  /** ESCUCHANDO -> PENSANDO (fin de turno del alumno detectado). */
  turnoFinalDetectado(): boolean {
    return this.transicionar('escuchando', 'pensando');
  }

  /** PENSANDO -> HABLANDO (primer audio del avatar listo). */
  primerAudioListo(): boolean {
    return this.transicionar('pensando', 'hablando');
  }

  /** HABLANDO -> ESCUCHANDO (cola de audio vacía y stream terminado). */
  streamTerminadoYColaVacia(): boolean {
    return this.transicionar('hablando', 'escuchando');
  }

  /** HABLANDO -> ESCUCHANDO vía INTERRUMPIDO (barge-in del alumno). */
  interrumpir(): boolean {
    return this.transicionar('hablando', 'escuchando');
  }

  reset(): void {
    this.estado = 'escuchando';
  }

  private transicionar(desde: EstadoTurno, hasta: EstadoTurno): boolean {
    if (this.estado !== desde) return false;
    this.estado = hasta;
    this.onCambio?.(hasta);
    return true;
  }
}
