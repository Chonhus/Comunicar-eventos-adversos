import { describe, expect, it } from 'vitest';
import { calcularPuntuacion } from './calcularPuntuacion';
import type { ChecklistConfig } from '@/lib/config/schemas';

const CHECKLIST: ChecklistConfig = {
  items: [
    { id: 'a', etiqueta: 'A', tipo: 'nucleo', peso: 1, activo: true, definicion: '' },
    { id: 'b', etiqueta: 'B', tipo: 'nucleo', peso: 1, activo: true, definicion: '' },
    { id: 'c', etiqueta: 'C', tipo: 'recomendado', peso: 0.5, activo: true, definicion: '' },
    { id: 'desactivado', etiqueta: 'D', tipo: 'recomendado', peso: 1, activo: false, definicion: '' },
  ],
  alertas: [{ id: 'culpabiliza', etiqueta: 'Culpabiliza', penalizacion: 5, definicion: '' }],
};

describe('calcularPuntuacion', () => {
  it('100 cuando todos los ítems activos están completos y no hay alertas', () => {
    const evaluacion = {
      items: [
        { id: 'a', puntuacion: 2 as const, evidencia: '', comentario: '' },
        { id: 'b', puntuacion: 2 as const, evidencia: '', comentario: '' },
        { id: 'c', puntuacion: 2 as const, evidencia: '', comentario: '' },
      ],
      alertas: [],
    };
    expect(calcularPuntuacion(evaluacion, CHECKLIST)).toBe(100);
  });

  it('calcula el promedio ponderado cuando los ítems están parciales o sin cumplir', () => {
    // a=2*1 + b=0*1 + c=1*0.5 = 2.5 ; máximo = 2*1 + 2*1 + 2*0.5 = 5 -> 50%
    const evaluacion = {
      items: [
        { id: 'a', puntuacion: 2 as const, evidencia: '', comentario: '' },
        { id: 'b', puntuacion: 0 as const, evidencia: '', comentario: '' },
        { id: 'c', puntuacion: 1 as const, evidencia: '', comentario: '' },
      ],
      alertas: [],
    };
    expect(calcularPuntuacion(evaluacion, CHECKLIST)).toBe(50);
  });

  it('resta la penalización de cada alerta, sin bajar de 0', () => {
    const evaluacion = {
      items: [{ id: 'a', puntuacion: 2 as const, evidencia: '', comentario: '' }],
      alertas: [{ id: 'culpabiliza', evidencia: '', comentario: '' }],
    };
    // a=2*1 / máximo=2*1 = 100% - 5 = 95
    expect(calcularPuntuacion(evaluacion, CHECKLIST)).toBe(95);

    const muchasAlertas = {
      items: [{ id: 'a', puntuacion: 0 as const, evidencia: '', comentario: '' }],
      alertas: Array.from({ length: 10 }, () => ({ id: 'culpabiliza', evidencia: '', comentario: '' })),
    };
    expect(calcularPuntuacion(muchasAlertas, CHECKLIST)).toBe(0);
  });

  it('ignora ítems con id desconocido o desactivados', () => {
    const evaluacion = {
      items: [
        { id: 'a', puntuacion: 2 as const, evidencia: '', comentario: '' },
        { id: 'inexistente', puntuacion: 2 as const, evidencia: '', comentario: '' },
        { id: 'desactivado', puntuacion: 2 as const, evidencia: '', comentario: '' },
      ],
      alertas: [],
    };
    expect(calcularPuntuacion(evaluacion, CHECKLIST)).toBe(100);
  });

  it('devuelve 0 si no hay ítems activos puntuables', () => {
    const vacio: ChecklistConfig = { items: [], alertas: [] };
    expect(calcularPuntuacion({ items: [], alertas: [] }, vacio)).toBe(0);
  });
});
