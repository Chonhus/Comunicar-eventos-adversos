import { describe, expect, it } from 'vitest';
import { bloques, preguntasTest } from './contenido';

describe('contenido formativo', () => {
  it('tiene 5 bloques', () => {
    expect(bloques).toHaveLength(5);
  });

  it('cada bloque tiene título y contenido', () => {
    for (const bloque of bloques) {
      expect(bloque.titulo.length).toBeGreaterThan(0);
      expect(bloque.contenido.length).toBeGreaterThan(0);
    }
  });

  it('el mini-test tiene 5 preguntas', () => {
    expect(preguntasTest).toHaveLength(5);
  });

  it('cada pregunta tiene exactamente una opción correcta', () => {
    for (const pregunta of preguntasTest) {
      const correctas = pregunta.opciones.filter((o) => o.correcta);
      expect(correctas).toHaveLength(1);
    }
  });
});
