// docs/MOTOR.md §8 — voces neurales es-ES vía REST (token temporal de token-voz).
// En F2 no se capturan visemas todavía (eso es F3, con TalkingHead.speakAudio); aquí
// solo se sintetiza y reproduce el audio completo de la frase.
import type { ProveedorTTS, ReproducirOpts } from './tipos';
import { obtenerCredencialVoz } from './obtenerCredencialVoz';

function escaparSsml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class AzureTTS implements ProveedorTTS {
  private audioActual: HTMLAudioElement | null = null;

  async hablar(frase: string, voz: string, opts: ReproducirOpts = {}): Promise<void> {
    const cred = await obtenerCredencialVoz();
    if (!cred) throw new Error('Azure TTS no disponible (sin token: AZURE_SPEECH_KEY no configurada).');
    if (opts.señal?.aborted) return;

    const ssml = `<speak version="1.0" xml:lang="es-ES"><voice name="${voz}">${escaparSsml(frase)}</voice></speak>`;
    const res = await fetch(`https://${cred.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      signal: opts.señal,
      headers: {
        Authorization: `Bearer ${cred.token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3',
      },
      body: ssml,
    });
    if (!res.ok) throw new Error(`Azure TTS: HTTP ${res.status}`);

    const url = URL.createObjectURL(await res.blob());
    const audio = new Audio(url);
    this.audioActual = audio;

    return new Promise((resolve, reject) => {
      audio.onplay = () => opts.onInicio?.();
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error reproduciendo audio de Azure TTS'));
      };
      opts.señal?.addEventListener('abort', () => this.detener(), { once: true });
      audio.play().catch(reject);
    });
  }

  detener(): void {
    this.audioActual?.pause();
    this.audioActual = null;
  }
}
