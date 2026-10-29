// docs/MOTOR.md §8 — voces neurales es-ES vía Azure Speech SDK (no el REST crudo: el
// SDK es el único camino documentado para suscribirse a `visemeReceived`/`wordBoundary`
// y así alimentar el lip sync real del avatar — docs/AVATARES.md §4). Token temporal
// desde `token-voz` (la clave nunca llega al cliente).
import {
  ResultReason,
  SpeechConfig,
  SpeechSynthesisBoundaryType,
  SpeechSynthesisOutputFormat,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk';
import type { ProveedorTTS, ReproducirOpts, PalabraTiempo } from './tipos';
import { obtenerCredencialVoz } from './obtenerCredencialVoz';
import { obtenerAvatarActivo } from '../avatar/reproductorAvatar';
import { construirSegmentosDesdeEventosAzure, type EventoVisemaAzure } from '../avatar/construirVisemas';

function escaparSsml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TICKS_POR_MS = 10_000;

export class AzureTTS implements ProveedorTTS {
  private audioCtx: AudioContext | null = null;
  private synthActual: SpeechSynthesizer | null = null;
  private fuenteActual: AudioBufferSourceNode | null = null;

  private obtenerAudioCtx(): AudioContext {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

  async hablar(frase: string, voz: string, opts: ReproducirOpts = {}): Promise<void> {
    if (opts.señal?.aborted) return;
    const cred = await obtenerCredencialVoz();
    if (!cred) throw new Error('Azure TTS no disponible (sin token: AZURE_SPEECH_KEY no configurada).');
    if (opts.señal?.aborted) return;

    try {
      await this.sintetizarYReproducir(frase, voz, cred, opts);
    } catch (e) {
      if (opts.señal?.aborted) return; // interrumpido (barge-in), no un fallo real
      // Un fallo puntual sintetizando (p.ej. el nivel gratuito de Azure rechazando una
      // petición bajo ráfagas de frases seguidas) se veía igual que "Azure no
      // funciona": a esa frase le tocaba la voz de respaldo del navegador aunque el
      // resto de la conversación sonara con Azure — bug real reportado ("a veces
      // también habla con la voz del sintetizador, aunque normalmente es la nueva").
      // Un reintento (con una síntesis nueva: el SpeechSynthesizer no es reutilizable
      // tras un error) basta para el caso típico antes de caer al respaldo de verdad.
      console.warn('[tts] Azure falló sintetizando, reintentando una vez:', e);
      await new Promise((r) => setTimeout(r, 300));
      if (opts.señal?.aborted) return;
      await this.sintetizarYReproducir(frase, voz, cred, opts);
    }
  }

  private async sintetizarYReproducir(
    frase: string,
    voz: string,
    cred: { token: string; region: string },
    opts: ReproducirOpts,
  ): Promise<void> {
    const speechConfig = SpeechConfig.fromAuthorizationToken(cred.token, cred.region);
    speechConfig.speechSynthesisVoiceName = voz;
    speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;

    // audioConfig null: no reproducir por los altavoces vía el SDK. El audio se
    // recupera de result.audioData y lo reproduce el avatar (lip sync) o, si no hay
    // avatar activo, esta misma clase (ver más abajo).
    const synth = new SpeechSynthesizer(speechConfig, null);
    this.synthActual = synth;

    const eventosVisema: EventoVisemaAzure[] = [];
    const palabras: PalabraTiempo[] = [];

    synth.visemeReceived = (_s, e) => {
      eventosVisema.push({ visemeId: e.visemeId, audioOffsetTicks: e.audioOffset });
    };
    synth.wordBoundary = (_s, e) => {
      if (e.boundaryType !== SpeechSynthesisBoundaryType.Word) return;
      palabras.push({
        palabra: e.text,
        inicioMs: e.audioOffset / TICKS_POR_MS,
        durMs: e.duration / TICKS_POR_MS,
      });
    };

    const ssml = `<speak version="1.0" xml:lang="es-ES"><voice name="${voz}">${escaparSsml(frase)}</voice></speak>`;

    try {
      const resultado = await new Promise<import('microsoft-cognitiveservices-speech-sdk').SpeechSynthesisResult>(
        (resolve, reject) => {
          synth.speakSsmlAsync(ssml, resolve, (err) => reject(new Error(err)));
        },
      );

      if (resultado.reason !== ResultReason.SynthesizingAudioCompleted) {
        throw new Error(`Azure Speech SDK: síntesis no completada (${resultado.reason})`);
      }
      if (opts.señal?.aborted) return;

      const audioCtx = this.obtenerAudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(resultado.audioData.slice(0));
      const duracionMs = audioBuffer.duration * 1000;
      const visemas = construirSegmentosDesdeEventosAzure(eventosVisema, duracionMs);

      opts.onInicio?.();

      const avatar = obtenerAvatarActivo();
      if (avatar) {
        await avatar.hablar(audioBuffer, visemas, palabras, { señal: opts.señal });
      } else {
        await this.reproducirSinAvatar(audioBuffer, opts);
      }
    } finally {
      synth.close();
      if (this.synthActual === synth) this.synthActual = null;
    }
  }

  private reproducirSinAvatar(audio: AudioBuffer, opts: ReproducirOpts): Promise<void> {
    const audioCtx = this.obtenerAudioCtx();
    const fuente = audioCtx.createBufferSource();
    fuente.buffer = audio;
    fuente.connect(audioCtx.destination);
    this.fuenteActual = fuente;

    return new Promise((resolve) => {
      let resuelto = false;
      const terminar = () => {
        if (resuelto) return;
        resuelto = true;
        if (this.fuenteActual === fuente) this.fuenteActual = null;
        resolve();
      };
      fuente.onended = terminar;
      opts.señal?.addEventListener('abort', () => { fuente.stop(); terminar(); }, { once: true });
      fuente.start();
    });
  }

  detener(): void {
    obtenerAvatarActivo()?.detener();
    this.fuenteActual?.stop();
    this.fuenteActual = null;
    this.synthActual?.close();
    this.synthActual = null;
  }
}
