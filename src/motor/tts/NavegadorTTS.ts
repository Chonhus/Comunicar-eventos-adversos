// docs/MOTOR.md §8 — respaldo con `speechSynthesis` del navegador (sin visemas).
// El parámetro `voz` identifica una voz de Azure (config/casos.json) y no tiene
// equivalente directo en las voces del navegador: aquí solo se usa el idioma.
import type { ProveedorTTS, ReproducirOpts } from './tipos';
import { heuristicaVisemasEs } from '../avatar/heuristicaVisemasEs';
import { obtenerAvatarActivo } from '../avatar/reproductorAvatar';

// Velocidad media de habla en español a rate=1 (~160 palabras/min). Solo para repartir
// los visemas del heurístico en el tiempo: no se sincroniza con el audio real (lo
// reproduce el propio navegador, fuera de nuestro control), así que es aproximado a
// propósito — mejor un movimiento de boca algo desajustado que ninguno.
const PALABRAS_POR_SEGUNDO = 2.7;

function estimarDuracionMs(frase: string): number {
  const palabras = frase.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(300, (palabras / PALABRAS_POR_SEGUNDO) * 1000);
}

/**
 * Safari en iOS exige que `speechSynthesis.speak()` se llame dentro de un toque
 * directo del usuario; si se llama más tarde de forma asíncrona (como hace el motor,
 * tras la respuesta de la IA), Safari la ignora en silencio: sin sonido y sin error.
 * Llamar a esto una vez dentro de un `onClick` real (p. ej. "Iniciar llamada")
 * "despierta" la API para el resto de la sesión. Es un no-op inofensivo en el resto
 * de navegadores.
 */
export function desbloquearVozNavegador(): void {
  if (!('speechSynthesis' in window)) return;
  try {
    // Antes se cancelaba al momento (cancel() justo después de speak()), en el mismo
    // tick síncrono. speak() es asíncrono por dentro: cancelar así de rápido corta la
    // locución antes de que el motor llegue a usarla de verdad, así que en iOS Safari
    // el "desbloqueo" no llegaba a producirse — bug real visto en producción (seguía
    // sin sonar tras un segundo intento). Con texto no vacío y sin cancelar, se deja
    // que la locución (silenciosa, casi instantánea) se reproduzca entera.
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    // Mejor esfuerzo: si falla, el resto del flujo sigue igual (y puede que
    // funcione igualmente en navegadores menos estrictos que Safari).
  }
}

/** Las voces se cargan de forma asíncrona: en la primera llamada en algunos
 * navegadores, getVoices() todavía devuelve una lista vacía. */
function obtenerVoces(): Promise<SpeechSynthesisVoice[]> {
  const voces = speechSynthesis.getVoices();
  if (voces.length > 0) return Promise.resolve(voces);
  return new Promise((resolve) => {
    const limite = setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
    speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(limite);
        resolve(speechSynthesis.getVoices());
      },
      { once: true },
    );
  });
}

export class NavegadorTTS implements ProveedorTTS {
  private audioCtx: AudioContext | null = null;

  private obtenerAudioCtx(): AudioContext {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

  /**
   * Sin Azure no hay visemas reales (los da el Speech SDK junto al audio): el avatar
   * 3D se quedaba con la boca estática mientras hablaba speechSynthesis — bug real
   * reportado por un alumno. Se usa el heurístico texto→visema de docs/AVATARES.md §4
   * (el mismo pensado para esto, antes sin conectar a nada) con una duración estimada,
   * y se reproduce como un audio silencioso a través del avatar: la voz real la sigue
   * poniendo el navegador aparte, esto solo mueve la boca en paralelo.
   */
  private animarAvatar(frase: string, señal?: AbortSignal): void {
    const avatar = obtenerAvatarActivo();
    if (!avatar) return;
    const duracionMs = estimarDuracionMs(frase);
    const visemas = heuristicaVisemasEs(frase, duracionMs);
    if (visemas.length === 0) return;
    const audioCtx = this.obtenerAudioCtx();
    const bufferSilencioso = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * (duracionMs / 1000)), audioCtx.sampleRate);
    void avatar.hablar(bufferSilencioso, visemas, [], { señal });
  }

  async hablar(frase: string, _voz: string, opts: ReproducirOpts = {}): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Este navegador no soporta speechSynthesis.');
    }
    if (opts.señal?.aborted) return;

    const voces = await obtenerVoces();
    if (opts.señal?.aborted) return;

    return new Promise((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(frase);
      u.lang = 'es-ES';
      const vozEs = voces.find((v) => v.lang === 'es-ES') ?? voces.find((v) => v.lang.startsWith('es'));
      if (vozEs) u.voice = vozEs;

      u.onstart = () => {
        opts.onInicio?.();
        this.animarAvatar(frase, opts.señal);
      };
      u.onend = () => resolve();
      u.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') resolve();
        else reject(new Error(`speechSynthesis: ${e.error}`));
      };

      opts.señal?.addEventListener('abort', () => this.detener(), { once: true });

      speechSynthesis.speak(u);
    });
  }

  detener(): void {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    obtenerAvatarActivo()?.detener();
  }
}
