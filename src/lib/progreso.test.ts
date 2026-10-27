import { beforeEach, describe, expect, it } from 'vitest';
import {
  guardarNotaFormacion,
  guardarResultadoIntento,
  limpiarProgreso,
  obtenerNotaFormacion,
  obtenerResultadosDeCaso,
  obtenerTodosLosResultados,
  obtenerUltimoResultado,
  type ResultadoIntento,
} from './progreso';
import type { EvaluacionIntento } from '@/motor/evaluacion/tipos';

const EVALUACION_VACIA: EvaluacionIntento = {
  items: [],
  alertas: [],
  fortalezas: [],
  mejoras: [],
  global: { empatia: 3, claridad: 3, honestidad: 3 },
  comparacion_intento_anterior: null,
  resumen: '',
};

function fabricarResultado(casoId: string, intento: number, puntuacion: number, fecha = Date.now()): ResultadoIntento {
  return { casoId, intento, puntuacion, evaluacion: EVALUACION_VACIA, duracionSeg: 90, fecha };
}

describe('progreso', () => {
  beforeEach(() => {
    limpiarProgreso();
  });

  it('empieza vacío', () => {
    expect(obtenerTodosLosResultados()).toEqual([]);
    expect(obtenerNotaFormacion()).toBeNull();
  });

  it('guarda y recupera un resultado de intento', () => {
    guardarResultadoIntento(fabricarResultado('n1_paracetamol', 1, 80));
    const resultados = obtenerResultadosDeCaso('n1_paracetamol');
    expect(resultados).toHaveLength(1);
    expect(resultados[0].puntuacion).toBe(80);
  });

  it('un segundo guardado del mismo caso+intento reemplaza al anterior, no lo duplica', () => {
    guardarResultadoIntento(fabricarResultado('n1_paracetamol', 1, 50));
    guardarResultadoIntento(fabricarResultado('n1_paracetamol', 1, 90));
    const resultados = obtenerResultadosDeCaso('n1_paracetamol');
    expect(resultados).toHaveLength(1);
    expect(resultados[0].puntuacion).toBe(90);
  });

  it('obtenerUltimoResultado devuelve el intento más alto de ese caso', () => {
    guardarResultadoIntento(fabricarResultado('n1_paracetamol', 1, 50));
    guardarResultadoIntento(fabricarResultado('n1_paracetamol', 2, 70));
    expect(obtenerUltimoResultado('n1_paracetamol')?.intento).toBe(2);
    expect(obtenerUltimoResultado('n1_paracetamol')?.puntuacion).toBe(70);
  });

  it('obtenerUltimoResultado devuelve null si no hay intentos de ese caso', () => {
    expect(obtenerUltimoResultado('n2_caida_fractura')).toBeNull();
  });

  it('obtenerTodosLosResultados mezcla casos distintos', () => {
    guardarResultadoIntento(fabricarResultado('n1_paracetamol', 1, 50, 1000));
    guardarResultadoIntento(fabricarResultado('n2_caida_fractura', 1, 60, 2000));
    expect(obtenerTodosLosResultados().map((r) => r.casoId)).toEqual(['n1_paracetamol', 'n2_caida_fractura']);
  });

  it('guarda y recupera la nota de formación', () => {
    guardarNotaFormacion(8);
    expect(obtenerNotaFormacion()).toBe(8);
  });

  it('limpiarProgreso borra todo', () => {
    guardarResultadoIntento(fabricarResultado('n1_paracetamol', 1, 50));
    guardarNotaFormacion(10);
    limpiarProgreso();
    expect(obtenerTodosLosResultados()).toEqual([]);
    expect(obtenerNotaFormacion()).toBeNull();
  });
});
