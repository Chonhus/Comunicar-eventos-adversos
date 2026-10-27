import { describe, expect, it } from 'vitest';
import { heuristicaVisemasEs } from './heuristicaVisemasEs';

describe('heuristicaVisemasEs', () => {
  it('devuelve vacío si no hay letras', () => {
    expect(heuristicaVisemasEs('', 1000)).toEqual([]);
    expect(heuristicaVisemasEs('... ,', 1000)).toEqual([]);
  });

  it('mapea vocales simples', () => {
    const r = heuristicaVisemasEs('a', 100);
    expect(r).toEqual([{ visema: 'aa', inicioMs: 0, durMs: 100 }]);
  });

  it('reparte la duración total entre todos los visemas detectados', () => {
    const r = heuristicaVisemasEs('hola', 400); // h(muda) o-l-a => 3 unidades
    expect(r).toHaveLength(3);
    expect(r.map((s) => s.visema)).toEqual(['O', 'nn', 'aa']);
    expect(r.every((s) => Math.abs(s.durMs - 400 / 3) < 1)).toBe(true);
    expect(r[1].inicioMs).toBeCloseTo(400 / 3, 0);
  });

  it('reconoce los dígrafos ch, ll, rr, qu', () => {
    expect(heuristicaVisemasEs('chico', 100).map((s) => s.visema)).toEqual(['CH', 'I', 'kk', 'O']);
    expect(heuristicaVisemasEs('llamo', 100).map((s) => s.visema)).toEqual(['nn', 'aa', 'PP', 'O']);
    expect(heuristicaVisemasEs('carro', 100).map((s) => s.visema)).toEqual(['kk', 'aa', 'RR', 'O']);
    expect(heuristicaVisemasEs('queso', 100).map((s) => s.visema)).toEqual(['kk', 'E', 'SS', 'O']);
  });

  it('la h es muda', () => {
    expect(heuristicaVisemasEs('hola', 100).map((s) => s.visema)).not.toContain('kk');
  });

  it('c suena SS antes de e/i y kk en el resto', () => {
    expect(heuristicaVisemasEs('cena', 100).map((s) => s.visema)[0]).toBe('SS');
    expect(heuristicaVisemasEs('casa', 100).map((s) => s.visema)[0]).toBe('kk');
  });

  it('no mezcla dígrafos entre dos palabras distintas', () => {
    // "sal" + "luego" no debe leerse como si tuviera "ll" en el espacio.
    const r = heuristicaVisemasEs('sal luego', 100).map((s) => s.visema);
    expect(r[0]).toBe('SS');
    expect(r[1]).toBe('aa');
    expect(r[2]).toBe('nn'); // "l" final de "sal"
    expect(r[3]).toBe('nn'); // "l" inicial de "luego" (no "ll")
  });
});
