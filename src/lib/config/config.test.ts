import { describe, expect, it } from 'vitest';
import { casosConfig, checklistConfig, motorConfig, posesConfig, obtenerCaso, obtenerCasoPorNivel } from './index';

describe('config/*.json', () => {
  it('carga y valida casos.json', () => {
    expect(casosConfig.casos).toHaveLength(2);
    expect(casosConfig.maxIntentos).toBe(2);
  });

  it('carga y valida checklist.json', () => {
    expect(checklistConfig.items.length).toBeGreaterThanOrEqual(5);
    expect(checklistConfig.items.map((i) => i.id)).toContain('presentacion');
  });

  it('carga y valida motor.json', () => {
    expect(motorConfig.motor).toBe('propio');
    expect(motorConfig.turnos.silencioFinTurnoMs).toBe(800);
  });

  it('obtenerCaso devuelve el caso por id', () => {
    expect(obtenerCaso('n1_paracetamol').avatar.nombre).toBe('Antonio Ruiz');
  });

  it('obtenerCasoPorNivel devuelve el caso por nivel', () => {
    expect(obtenerCasoPorNivel(2).id).toBe('n2_caida_fractura');
  });

  it('obtenerCaso lanza si el id no existe', () => {
    expect(() => obtenerCaso('inexistente')).toThrow();
  });

  it('carga y valida poses.json con una plantilla por cada avatar.pose de casos.json', () => {
    for (const caso of casosConfig.casos) {
      expect(posesConfig[caso.avatar.pose]).toBeDefined();
    }
  });
});
