import { describe, expect, it } from 'vitest';
import { emocionAMood } from './mapaEmociones';

describe('emocionAMood', () => {
  it('mapea las 5 emociones del personaje a un mood válido de TalkingHead', () => {
    expect(emocionAMood('neutral')).toBe('neutral');
    expect(emocionAMood('preocupado')).toBe('fear');
    expect(emocionAMood('enfadado')).toBe('angry');
    expect(emocionAMood('triste')).toBe('sad');
    expect(emocionAMood('aliviado')).toBe('happy');
  });
});
