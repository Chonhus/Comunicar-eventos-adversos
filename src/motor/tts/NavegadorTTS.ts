// docs/MOTOR.md §8 — respaldo con `speechSynthesis` del navegador (sin visemas).
// El parámetro `voz` identifica una voz de Azure (config/casos.json) y no tiene
// equivalente directo en las voces del navegador: aquí solo se usa el idioma.
import type { ProveedorTTS, ReproducirOpts } from './tipos';

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
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    speechSynthesis.cancel();
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

      u.onstart = () => opts.onInicio?.();
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
  }
}
