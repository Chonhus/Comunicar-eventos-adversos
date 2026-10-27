// Puente entre el TTS (que sintetiza audio+visemas) y el avatar 3D (que lo reproduce
// con lip sync vía TalkingHead.speakAudio). AvatarTalkingHead se registra aquí al
// montarse; si no hay avatar activo (p.ej. cayó al fallback de imagen, o WebGL no
// está disponible), el TTS reproduce el audio él mismo sin lip sync.
import type { PalabraTiempo } from '../tts/tipos';
import type { SegmentoVisema } from './construirVisemas';

export interface ReproductorAvatar {
  hablar(
    audio: AudioBuffer,
    visemas: SegmentoVisema[],
    palabras: PalabraTiempo[],
    opts?: { señal?: AbortSignal },
  ): Promise<void>;
  detener(): void;
}

let avatarActivo: ReproductorAvatar | null = null;

export function registrarAvatarActivo(r: ReproductorAvatar | null): void {
  avatarActivo = r;
}

export function obtenerAvatarActivo(): ReproductorAvatar | null {
  return avatarActivo;
}
