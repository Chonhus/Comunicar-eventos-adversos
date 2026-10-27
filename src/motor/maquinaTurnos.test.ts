import { describe, expect, it } from 'vitest';
import { MaquinaTurnos } from './maquinaTurnos';

describe('MaquinaTurnos', () => {
  it('empieza en escuchando', () => {
    expect(new MaquinaTurnos().estadoActual).toBe('escuchando');
  });

  it('sigue el camino feliz ESCUCHANDO -> PENSANDO -> HABLANDO -> ESCUCHANDO', () => {
    const cambios: string[] = [];
    const m = new MaquinaTurnos((e) => cambios.push(e));
    expect(m.turnoFinalDetectado()).toBe(true);
    expect(m.estadoActual).toBe('pensando');
    expect(m.primerAudioListo()).toBe(true);
    expect(m.estadoActual).toBe('hablando');
    expect(m.streamTerminadoYColaVacia()).toBe(true);
    expect(m.estadoActual).toBe('escuchando');
    expect(cambios).toEqual(['pensando', 'hablando', 'escuchando']);
  });

  it('ignora una transición que no corresponde al estado actual', () => {
    const m = new MaquinaTurnos();
    expect(m.primerAudioListo()).toBe(false); // no se puede desde "escuchando"
    expect(m.estadoActual).toBe('escuchando');
  });

  it('interrumpir() solo funciona durante HABLANDO (barge-in)', () => {
    const m = new MaquinaTurnos();
    expect(m.interrumpir()).toBe(false);
    m.turnoFinalDetectado();
    m.primerAudioListo();
    expect(m.estadoActual).toBe('hablando');
    expect(m.interrumpir()).toBe(true);
    expect(m.estadoActual).toBe('escuchando');
  });

  it('reset() vuelve siempre a escuchando', () => {
    const m = new MaquinaTurnos();
    m.turnoFinalDetectado();
    m.reset();
    expect(m.estadoActual).toBe('escuchando');
  });
});
