// docs/MOTOR.md §9: TalkingHead 1.8 solo trae estos moods (verificado en
// node_modules/@met4citizen/talkinghead, this.animMoods): neutral, happy, angry,
// sad, fear, disgust, love, sleep. No hay "preocupado" ni "aliviado" nativos.
// Decisión (ver PROGRESS.md): preocupado→fear (más cercano a la ansiedad/preocupación
// que "sad"), aliviado→happy (alivio es una emoción positiva).
import type { Emocion } from '@/lib/config/schemas';

export type MoodTalkingHead = 'neutral' | 'happy' | 'angry' | 'sad' | 'fear' | 'disgust' | 'love' | 'sleep';

const MAPA: Record<Emocion, MoodTalkingHead> = {
  neutral: 'neutral',
  preocupado: 'fear',
  enfadado: 'angry',
  triste: 'sad',
  aliviado: 'happy',
};

export function emocionAMood(emocion: Emocion): MoodTalkingHead {
  return MAPA[emocion];
}
