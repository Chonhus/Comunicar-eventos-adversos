import { describe, expect, it } from 'vitest';
import { ExtractorEmocion } from './ExtractorEmocion';

describe('ExtractorEmocion', () => {
  it('extrae la emoción cuando llega en un único chunk', () => {
    const ex = new ExtractorEmocion();
    const r = ex.procesar('[preocupado] ¿Y eso es malo?');
    expect(r.emocion).toBe('preocupado');
    expect(r.texto).toBe('¿Y eso es malo?');
  });

  it('extrae la emoción cuando la etiqueta llega partida entre varios chunks', () => {
    const ex = new ExtractorEmocion();
    expect(ex.procesar('[neu').emocion).toBeNull();
    const r = ex.procesar('tral] Hol');
    expect(r.emocion).toBe('neutral');
    expect(r.texto).toBe('Hol');
    expect(ex.procesar('a').texto).toBe('a');
  });

  it('a partir del segundo chunk ya no vuelve a extraer nada (solo pasa texto)', () => {
    const ex = new ExtractorEmocion();
    ex.procesar('[aliviado] Bueno, ');
    const r = ex.procesar('pues me alegro.');
    expect(r.emocion).toBeNull();
    expect(r.texto).toBe('pues me alegro.');
  });

  it('si el texto no empieza con "[", no hay etiqueta que extraer', () => {
    const ex = new ExtractorEmocion();
    const r = ex.procesar('Hola, buenas tardes');
    expect(r.emocion).toBeNull();
    expect(r.texto).toBe('Hola, buenas tardes');
  });

  it('una emoción desconocida dentro de corchetes se descarta pero el texto sigue', () => {
    const ex = new ExtractorEmocion();
    const r = ex.procesar('[furioso] Esto no es una emoción válida');
    expect(r.emocion).toBeNull();
    expect(r.texto).toBe('Esto no es una emoción válida');
  });

  it('si el corchete nunca se cierra, se trata como texto normal pasado ese margen', () => {
    const ex = new ExtractorEmocion();
    const r = ex.procesar('[esto no cierra nunca el corchete y sigue');
    expect(r.emocion).toBeNull();
    expect(r.texto).toContain('esto no cierra nunca');
  });
});
