// Motor de depuración (docente): mismo pipeline que MotorPropio (conversar + TTS +
// checklist) pero sin micrófono — el turno del alumno llega por enviarTexto().
// Activo tras `?debug=1` (docs/CLAUDE.md: "siempre debe existir un modo texto").
import type { Caso } from '@/lib/config/schemas';
import { MotorBase } from './MotorBase';

export class MotorTexto extends MotorBase {
  async iniciar(caso: Caso): Promise<void> {
    this.reiniciarParaNuevaLlamada(caso);
    this.emisor.emit('estado', 'escuchando');
    this.programarAperturaSiSilencio();
  }

  async detener(): Promise<void> {
    this.pararTodo();
  }

  silenciarMicro(): void {
    // No hay micrófono en el motor de texto: no-op.
  }
}
