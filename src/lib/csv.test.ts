import { describe, expect, it } from 'vitest';
import { construirCsv } from './csv';

describe('construirCsv', () => {
  it('une cabecera y filas con comas y saltos de línea', () => {
    const csv = construirCsv(['nombre', 'puntuacion'], [['Ana', 80], ['Luis', 60]]);
    expect(csv).toBe('nombre,puntuacion\nAna,80\nLuis,60');
  });

  it('entrecomilla campos con comas, comillas o saltos de línea', () => {
    const csv = construirCsv(['texto'], [['Hola, "mundo"'], ['línea1\nlínea2']]);
    expect(csv).toBe('texto\n"Hola, ""mundo"""\n"línea1\nlínea2"');
  });

  it('trata null/undefined como campo vacío', () => {
    const csv = construirCsv(['a'], [[null], [undefined]]);
    expect(csv).toBe('a\n\n');
  });
});
