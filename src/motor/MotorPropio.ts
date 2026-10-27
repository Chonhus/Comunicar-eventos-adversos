// Implementación principal: STT + conversar + TTS + máquina de turnos (docs/MOTOR.md §2).
// El avatar 3D (TalkingHead) se conecta en F3; en F2 la UI muestra imagen estática.
import type { Caso } from '@/lib/config/schemas';
import { MotorBase } from './MotorBase';
import { WebSpeechSTT, hayWebSpeechDisponible } from './stt/WebSpeechSTT';
import type { ProveedorSTT } from './stt/tipos';

export class MotorPropio extends MotorBase {
  private stt: ProveedorSTT | null = null;

  async iniciar(caso: Caso): Promise<void> {
    this.reiniciarParaNuevaLlamada(caso);
    this.emisor.emit('estado', 'conectando');

    if (!hayWebSpeechDisponible()) {
      this.emisor.emit('estado', 'error');
      throw new Error('Este navegador no soporta reconocimiento de voz (usa Chrome o Edge), o usa el modo texto (?debug=1).');
    }

    this.stt = new WebSpeechSTT(this.config.stt.idioma);
    this.registrarEventosStt(this.stt);
    this.stt.iniciar();

    this.emisor.emit('estado', 'escuchando');
    this.programarAperturaSiSilencio();
  }

  async detener(): Promise<void> {
    this.stt?.detener();
    this.stt = null;
    this.pararTodo();
  }

  silenciarMicro(silenciado: boolean): void {
    this.stt?.silenciar(silenciado);
  }

  private registrarEventosStt(stt: ProveedorSTT): void {
    stt.on('parcial', (texto) => {
      this.emisor.emit('transcripcionParcial', texto);
      const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
      if (this.maquina.estadoActual === 'hablando' && palabras >= this.config.turnos.bargeInMinPalabras) {
        this.interrumpir();
      }
    });
    stt.on('final', (texto) => this.procesarTurnoAlumno(texto));
    stt.on('error', () => this.emisor.emit('estado', 'error'));
  }
}
