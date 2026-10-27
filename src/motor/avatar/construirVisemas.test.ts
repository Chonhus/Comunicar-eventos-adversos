import { describe, expect, it } from 'vitest';
import { construirSegmentosDesdeEventosAzure } from './construirVisemas';

describe('construirSegmentosDesdeEventosAzure', () => {
  it('calcula la duración de cada visema como la diferencia con el siguiente audioOffset', () => {
    const eventos = [
      { visemeId: 0, audioOffsetTicks: 0 }, // sil, 0ms
      { visemeId: 21, audioOffsetTicks: 1_000_000 }, // PP, 100ms
      { visemeId: 1, audioOffsetTicks: 2_500_000 }, // aa, 250ms
    ];
    const r = construirSegmentosDesdeEventosAzure(eventos, 500);
    expect(r).toEqual([
      { visema: 'sil', inicioMs: 0, durMs: 100 },
      { visema: 'PP', inicioMs: 100, durMs: 150 },
      { visema: 'aa', inicioMs: 250, durMs: 250 },
    ]);
  });

  it('el último visema se extiende hasta el final del audio', () => {
    const eventos = [{ visemeId: 0, audioOffsetTicks: 0 }];
    const r = construirSegmentosDesdeEventosAzure(eventos, 800);
    expect(r).toEqual([{ visema: 'sil', inicioMs: 0, durMs: 800 }]);
  });

  it('sin eventos devuelve una lista vacía', () => {
    expect(construirSegmentosDesdeEventosAzure([], 500)).toEqual([]);
  });
});
