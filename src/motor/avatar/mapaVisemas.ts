// Mapeo de Viseme ID de Azure Speech (0-21, evento `visemeReceived` del
// `SpeechSynthesizer`) a los 15 visemas Oculus que usa TalkingHead
// (docs/AVATARES.md §4, docs/MOTOR.md §8).
//
// ⚠️ PENDIENTE DE VERIFICAR: esta tabla se ha reconstruido de memoria (entrenamiento),
// no se ha podido consultar la documentación oficial de Microsoft en vivo desde esta
// red (learn.microsoft.com y docs.azure.cn no son alcanzables desde este entorno).
// Antes de confiar en ella en producción, verificar contra:
// https://learn.microsoft.com/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
// o, mejor, con audio real de Azure TTS y observación visual del lip sync (página
// /debug/avatar, una vez haya AZURE_SPEECH_KEY configurada).
//
// Fonemas (IPA) que agrupa cada Viseme ID de Azure, según la tabla oficial:
const FONEMAS_POR_ID: Record<number, string> = {
  0: 'silencio',
  1: 'æ, ə, ʌ',
  2: 'ɑ',
  3: 'ɔ',
  4: 'ɛ, ʊ',
  5: 'ɝ',
  6: 'j, i, ɪ',
  7: 'w, u',
  8: 'o',
  9: 'aʊ',
  10: 'ɔɪ',
  11: 'aɪ',
  12: 'h',
  13: 'ɹ',
  14: 'l',
  15: 's, z',
  16: 'ʃ, tʃ, dʒ, ʒ',
  17: 'ð',
  18: 'f, v',
  19: 'd, t, n, θ',
  20: 'k, g, ŋ',
  21: 'p, b, m',
};

export type VisemaOculus =
  | 'sil'
  | 'PP'
  | 'FF'
  | 'TH'
  | 'DD'
  | 'kk'
  | 'CH'
  | 'SS'
  | 'nn'
  | 'RR'
  | 'aa'
  | 'E'
  | 'I'
  | 'O'
  | 'U';

const MAPA_AZURE_A_OCULUS: Record<number, VisemaOculus> = {
  0: 'sil',
  1: 'aa',
  2: 'aa',
  3: 'O',
  4: 'E',
  5: 'RR',
  6: 'I',
  7: 'U',
  8: 'O',
  9: 'O',
  10: 'O',
  11: 'aa',
  12: 'kk',
  13: 'RR',
  14: 'nn',
  15: 'SS',
  16: 'CH',
  17: 'TH',
  18: 'FF',
  19: 'DD',
  20: 'kk',
  21: 'PP',
};

export function visemaIdAzureAOculus(visemeId: number): VisemaOculus {
  const visema = MAPA_AZURE_A_OCULUS[visemeId];
  if (!visema) {
    throw new Error(`Viseme ID de Azure desconocido: ${visemeId} (${FONEMAS_POR_ID[visemeId] ?? 'sin descripción'})`);
  }
  return visema;
}
