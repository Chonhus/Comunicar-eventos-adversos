import { describe, expect, it } from 'vitest';
import { pasos, preguntasPrePost } from './contenido';

describe('contenido formativo', () => {
  it('tiene 4 vídeos y 2 bloques de preguntas', () => {
    expect(pasos.filter((p) => p.tipo === 'video')).toHaveLength(4);
    expect(pasos.filter((p) => p.tipo === 'preguntas')).toHaveLength(2);
  });

  it('cada vídeo tiene título e id de YouTube', () => {
    for (const paso of pasos) {
      if (paso.tipo !== 'video') continue;
      expect(paso.titulo.length).toBeGreaterThan(0);
      expect(paso.youtubeId.length).toBeGreaterThan(0);
    }
  });

  it('cada bloque de preguntas tiene 2 preguntas con exactamente una opción correcta', () => {
    for (const paso of pasos) {
      if (paso.tipo !== 'preguntas') continue;
      expect(paso.preguntas).toHaveLength(2);
      for (const pregunta of paso.preguntas) {
        const correctas = pregunta.opciones.filter((o) => o.correcta);
        expect(correctas).toHaveLength(1);
      }
    }
  });
});

describe('preguntasPrePost', () => {
  it('tiene 5 preguntas, cada una con exactamente una opción correcta', () => {
    expect(preguntasPrePost).toHaveLength(5);
    for (const pregunta of preguntasPrePost) {
      const correctas = pregunta.opciones.filter((o) => o.correcta);
      expect(correctas).toHaveLength(1);
    }
  });
});
