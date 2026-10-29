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
  // Texto del resultado interino más reciente desde el último "final" (ver onend).
  private ultimoParcial = '';
  // Guardado en iniciar() para poder rearrancar el motor al desilenciar (ver silenciar()).
  private ctor: NonNullable<typeof window.SpeechRecognition> | null = null;

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
    this.ctor = Ctor;
    this.activo = true;
    this.arrancar(Ctor);
  }

  private arrancar(Ctor: NonNullable<typeof window.SpeechRecognition>): void {
    const r = new Ctor();
    r.lang = this.idioma;
    r.continuous = true;
    r.interimResults = true;

    this.ultimoParcial = '';

    r.onresult = (ev) => {
      if (this.silenciado) return;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const resultado = ev.results[i];
        const transcript = resultado[0]?.transcript ?? '';
        if (resultado.isFinal) {
          this.ultimoParcial = '';
          this.emisor.emit('final', transcript);
        } else {
          this.ultimoParcial = transcript;
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
      // El navegador puede cortar la sesión a mitad de una frase sin que llegue a
      // marcarse "final" (p. ej. tras su propio límite interno de duración). Sin esto
      // ese trozo se perdía para siempre al reiniciar — bug real visto en producción
      // ("a veces pierde información" al hablar un rato en el ordenador). Se trata
      // como final antes de reiniciar la sesión.
      if (this.ultimoParcial.trim()) {
        const texto = this.ultimoParcial;
        this.ultimoParcial = '';
        this.emisor.emit('final', texto);
      }
      if (this.activo) this.arrancar(Ctor); // el navegador cortó la sesión: reiniciamos
    };

    this.reconocimiento = r;
    try {
      r.start();
    } catch {
      // r.start() puede lanzar de forma síncrona si el micrófono de la sesión
      // anterior todavía no se ha liberado (visto en iOS Safari y, más raro, en
      // Chrome de escritorio). Sin este reintento, el fallo se queda mudo: no
      // dispara onerror ni onend, así que no se recupera solo y el alumno deja de
      // ser escuchado hasta recargar. Un pequeño margen antes de reintentar basta.
      if (this.activo) setTimeout(() => this.activo && this.arrancar(Ctor), 250);
    }
  }

  detener(): void {
    this.activo = false;
    // abort() en vez de stop(): no esperamos a que procese el audio pendiente ni nos
    // interesa su resultado final (la llamada ha terminado), así que corta de forma
    // inmediata — libera antes el micrófono (el indicador de grabación del navegador).
    this.reconocimiento?.abort();
    this.reconocimiento = null;
  }

  silenciar(silenciado: boolean): void {
    if (this.silenciado === silenciado) return;
    this.silenciado = silenciado;

    if (silenciado) {
      // Antes solo se ignoraban los resultados (this.silenciado en onresult): el motor
      // de reconocimiento seguía corriendo por detrás, así que el indicador de
      // "micrófono en uso" del navegador seguía encendido aunque el alumno hubiera
      // silenciado — bug real reportado ("se queda encendido"). Ahora se para del
      // todo y se arranca de nuevo al desilenciar.
      this.activo = false;
      this.ultimoParcial = ''; // no dar por "final" una frase a medias solo por silenciar
      this.reconocimiento?.abort();
      this.reconocimiento = null;
    } else if (this.ctor) {
      this.activo = true;
      this.arrancar(this.ctor);
    }
  }
}
