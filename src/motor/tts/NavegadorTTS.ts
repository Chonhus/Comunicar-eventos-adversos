// docs/MOTOR.md §8 — respaldo con `speechSynthesis` del navegador (sin visemas).
// El parámetro `voz` identifica una voz de Azure (config/casos.json) y no tiene
// equivalente directo en las voces del navegador: aquí solo se usa el idioma.
import type { ProveedorTTS, ReproducirOpts } from './tipos';

export class NavegadorTTS implements ProveedorTTS {
  async hablar(frase: string, _voz: string, opts: ReproducirOpts = {}): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw new Error('Este navegador no soporta speechSynthesis.');
    }
    if (opts.señal?.aborted) return;

    return new Promise((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(frase);
      u.lang = 'es-ES';
      const voces = speechSynthesis.getVoices();
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
