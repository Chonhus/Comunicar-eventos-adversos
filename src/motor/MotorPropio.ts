// Implementación principal: STT + conversar + TTS + máquina de turnos (docs/MOTOR.md §2).
// El avatar 3D (TalkingHead) se conecta en F3; en F2 la UI muestra imagen estática.
import type { Caso } from '@/lib/config/schemas';
import { MotorBase } from './MotorBase';
import { WebSpeechSTT, hayWebSpeechDisponible } from './stt/WebSpeechSTT';
import type { ProveedorSTT } from './stt/tipos';

export class MotorPropio extends MotorBase {
  private stt: ProveedorSTT | null = null;
  // El SpeechRecognition del navegador marca "final" un fragmento (a veces solo una
  // frase suelta) tras una pausa breve propia suya, no cuando el alumno termina de
  // verdad su turno. Bug real encontrado probando con voz: antes se mandaba cada
  // fragmento "final" a la IA al momento, así que una pausa natural para pensar se
  // interpretaba como "ya ha terminado" y el avatar interrumpía. Ahora se acumulan
  // los fragmentos y solo se da el turno por terminado tras silencioFinTurnoMs sin
  // ningún evento nuevo (ni "final" ni "parcial").
  private bufferTurno = '';
  private timeoutFinTurno: ReturnType<typeof setTimeout> | null = null;
  // bargeInMinMs existía en config/motor.json pero, igual que silencioFinTurnoMs antes,
  // no se usaba en ningún sitio: se interrumpía al avatar en el instante en que un
  // parcial llegaba a bargeInMinPalabras, aunque fuera una palabra suelta mal
  // reconocida (ruido de fondo, eco) que un instante después el propio reconocedor
  // corregía. Bug real reportado ("a veces me interrumpe"). Ahora se espera
  // bargeInMinMs con la condición sostenida antes de interrumpir de verdad.
  private timeoutInterrupcion: ReturnType<typeof setTimeout> | null = null;
  private ultimoConteoPalabrasParcial = 0;

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
    this.cancelarFinTurno();
    this.cancelarInterrupcionProgramada();
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
      this.ultimoConteoPalabrasParcial = palabras;
      if (this.maquina.estadoActual === 'hablando' && palabras >= this.config.turnos.bargeInMinPalabras) {
        this.programarInterrupcion();
      }
      this.reprogramarFinTurno();
    });
    stt.on('final', (texto) => {
      this.bufferTurno = this.bufferTurno ? `${this.bufferTurno} ${texto}` : texto;
      this.ultimoConteoPalabrasParcial = 0;
      this.reprogramarFinTurno();
    });
    stt.on('error', () => this.emisor.emit('estado', 'error'));
  }

  private reprogramarFinTurno(): void {
    this.cancelarFinTurno();
    this.timeoutFinTurno = setTimeout(() => {
      this.timeoutFinTurno = null;
      const texto = this.bufferTurno.trim();
      this.bufferTurno = '';
      if (texto) this.procesarTurnoAlumno(texto);
    }, this.config.turnos.silencioFinTurnoMs);
  }

  private cancelarFinTurno(): void {
    if (this.timeoutFinTurno) {
      clearTimeout(this.timeoutFinTurno);
      this.timeoutFinTurno = null;
    }
  }

  private programarInterrupcion(): void {
    if (this.timeoutInterrupcion) return; // ya programada: no reiniciar el contador en cada parcial
    this.timeoutInterrupcion = setTimeout(() => {
      this.timeoutInterrupcion = null;
      // Se comprueba el conteo más reciente (no el que disparó el timer): si en estos
      // bargeInMinMs el reconocedor corrigió el parcial a menos palabras (o el avatar
      // ya terminó de hablar por su cuenta), no se interrumpe por algo que ya no es así.
      if (this.maquina.estadoActual === 'hablando' && this.ultimoConteoPalabrasParcial >= this.config.turnos.bargeInMinPalabras) {
        this.interrumpir();
      }
    }, this.config.turnos.bargeInMinMs);
  }

  private cancelarInterrupcionProgramada(): void {
    if (this.timeoutInterrupcion) {
      clearTimeout(this.timeoutInterrupcion);
      this.timeoutInterrupcion = null;
    }
  }
}
