import type { ProveedorTTS, ReproducirOpts } from './tipos';

/** Intenta el proveedor principal; si falla (p. ej. Azure sin clave), cae al respaldo. */
export class TTSConRespaldo implements ProveedorTTS {
  constructor(
    private readonly principal: ProveedorTTS,
    private readonly respaldo: ProveedorTTS,
  ) {}

  async hablar(frase: string, voz: string, opts?: ReproducirOpts): Promise<void> {
    try {
      await this.principal.hablar(frase, voz, opts);
    } catch (e) {
      if (opts?.señal?.aborted) return;
      console.warn('[tts] proveedor principal falló, usando speechSynthesis del navegador:', e);
      await this.respaldo.hablar(frase, voz, opts);
    }
  }

  detener(): void {
    this.principal.detener();
    this.respaldo.detener();
  }
}
