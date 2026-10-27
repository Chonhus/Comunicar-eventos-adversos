import { describe, expect, it } from 'vitest';
import { visemaIdAzureAOculus, type VisemaOculus } from './mapaVisemas';

const VISEMAS_OCULUS_VALIDOS: VisemaOculus[] = [
  'sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U',
];

describe('visemaIdAzureAOculus', () => {
  it('mapea los 22 IDs de Azure (0-21) a un visema Oculus válido', () => {
    for (let id = 0; id <= 21; id++) {
      expect(VISEMAS_OCULUS_VALIDOS).toContain(visemaIdAzureAOculus(id));
    }
  });

  it('el silencio (ID 0) mapea a "sil"', () => {
    expect(visemaIdAzureAOculus(0)).toBe('sil');
  });

  it('lanza para un ID fuera de rango', () => {
    expect(() => visemaIdAzureAOculus(22)).toThrow();
    expect(() => visemaIdAzureAOculus(-1)).toThrow();
  });
});
