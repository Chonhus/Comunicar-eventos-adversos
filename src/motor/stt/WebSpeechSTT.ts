// docs/MOTOR.md §3 — `webspeech` (MVP): SpeechRecognition, es-ES, continuous+interimResults.
// Soporte real limitado fuera de Chrome/Edge (ver docs/CLAUDE.md); se reinicia solo si el
// navegador corta la sesión inesperadamente.
import { EmisorEventos } from '../EmisorEventos';
import type { EventosSTT, ProveedorSTT } from './tipos';

export function hayWebSpeechDisponible(): boolean {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class WebSpeechSTT implements ProveedorSTT {
  private reconocimiento: SpeechRecognition | null = null;
  private emisor = new EmisorEventos<EventosSTT>();
  private activo = false;
  private silenciado = false;

  constructor(private readonly idioma = 'es-ES') {}

  on<K extends keyof EventosSTT>(evento: K, cb: EventosSTT[K]): void {
    this.emisor.on(evento, cb);
  }

  iniciar(): void {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      this.emisor.emit('error', 'Este navegador no soporta reconocimiento de voz (usa Chrome o Edge).');
      return;
    }
    this.activo = true;
    this.arrancar(Ctor);
  }

  private arrancar(Ctor: NonNullable<typeof window.SpeechRecognition>): void {
    const r = new Ctor();
    r.lang = this.idioma;
    r.continuous = true;
    r.interimResults = true;

    r.onresult = (ev) => {
      if (this.silenciado) return;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const resultado = ev.results[i];
        const transcript = resultado[0]?.transcript ?? '';
        if (resultado.isFinal) {
          this.emisor.emit('final', transcript);
        } else {
          this.emisor.emit('parcial', transcript);
        }
      }
    };

    r.onerror = (ev) => {
      if (ev.error === 'no-speech' || ev.error === 'aborted') return; // onend se encarga de reiniciar
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        this.activo = false;
        this.emisor.emit('error', 'Permiso de micrófono denegado.');
        return;
      }
      this.emisor.emit('error', `Error de reconocimiento de voz: ${ev.error}`);
    };

    r.onend = () => {
      if (this.activo) this.arrancar(Ctor); // el navegador cortó la sesión: reiniciamos
    };

    this.reconocimiento = r;
    r.start();
  }

  detener(): void {
    this.activo = false;
    this.reconocimiento?.stop();
    this.reconocimiento = null;
  }

  silenciar(silenciado: boolean): void {
    this.silenciado = silenciado;
  }
}
