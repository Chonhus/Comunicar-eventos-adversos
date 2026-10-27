import { describe, expect, it } from 'vitest';
import { ChecklistEngine } from './ChecklistEngine';

describe('ChecklistEngine', () => {
  it('empieza con todos los ítems pendientes', () => {
    const c = new ChecklistEngine(['presentacion', 'lamenta']);
    expect(c.obtenerPendientes()).toEqual(['presentacion', 'lamenta']);
    expect(c.contarCompletos()).toBe(0);
  });

  it('marca un ítem como completo', () => {
    const c = new ChecklistEngine(['presentacion']);
    c.aplicarDeteccion({
      cumplidos: [{ id: 'presentacion', calidad: 'completo', evidencia: 'Soy la Dra. X' }],
      alertas: [],
    });
    expect(c.contarCompletos()).toBe(1);
    expect(c.obtenerPendientes()).toEqual([]);
  });

  it('un ítem completo nunca se desmarca aunque llegue "parcial" después', () => {
    const c = new ChecklistEngine(['presentacion']);
    c.aplicarDeteccion({
      cumplidos: [{ id: 'presentacion', calidad: 'completo', evidencia: 'ev1' }],
      alertas: [],
    });
    c.aplicarDeteccion({
      cumplidos: [{ id: 'presentacion', calidad: 'parcial', evidencia: 'ev2' }],
      alertas: [],
    });
    expect(c.obtenerItems().find((i) => i.id === 'presentacion')?.calidad).toBe('completo');
  });

  it('un ítem parcial puede subir a completo', () => {
    const c = new ChecklistEngine(['lamenta']);
    c.aplicarDeteccion({ cumplidos: [{ id: 'lamenta', calidad: 'parcial', evidencia: 'ev1' }], alertas: [] });
    expect(c.obtenerItems()[0].calidad).toBe('parcial');
    c.aplicarDeteccion({ cumplidos: [{ id: 'lamenta', calidad: 'completo', evidencia: 'ev2' }], alertas: [] });
    expect(c.obtenerItems()[0].calidad).toBe('completo');
  });

  it('ignora ids de ítems desconocidos', () => {
    const c = new ChecklistEngine(['presentacion']);
    c.aplicarDeteccion({
      cumplidos: [{ id: 'no_existe', calidad: 'completo', evidencia: 'x' }],
      alertas: [],
    });
    expect(c.contarCompletos()).toBe(0);
  });

  it('acumula alertas repetidas contando las veces que se detectan', () => {
    const c = new ChecklistEngine([]);
    c.aplicarDeteccion({ cumplidos: [], alertas: [{ id: 'culpabiliza', evidencia: 'fue la enfermera' }] });
    c.aplicarDeteccion({ cumplidos: [], alertas: [{ id: 'culpabiliza', evidencia: 'otra vez culpa' }] });
    const alerta = c.obtenerAlertas().find((a) => a.id === 'culpabiliza');
    expect(alerta?.veces).toBe(2);
    expect(alerta?.evidencia).toBe('otra vez culpa');
  });

  it('obtenerPendientes incluye los "parcial" (pueden subir a completo)', () => {
    const c = new ChecklistEngine(['a', 'b']);
    c.aplicarDeteccion({ cumplidos: [{ id: 'a', calidad: 'parcial', evidencia: 'x' }], alertas: [] });
    expect(c.obtenerPendientes()).toEqual(['a', 'b']);
  });
});
