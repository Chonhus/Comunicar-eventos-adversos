import { describe, expect, it } from 'vitest';
import { FraseBuffer } from './FraseBuffer';

function trocear(texto: string, tamanoChunk = 7) {
  const frases: string[] = [];
  const fb = new FraseBuffer((f) => frases.push(f));
  for (let i = 0; i < texto.length; i += tamanoChunk) {
    fb.agregar(texto.slice(i, i + tamanoChunk));
  }
  fb.finalizar();
  return frases;
}

describe('FraseBuffer', () => {
  it('emite una frase al llegar a un punto seguido de espacio', () => {
    const frases: string[] = [];
    const fb = new FraseBuffer((f) => frases.push(f));
    fb.agregar('Hola, buenas. ');
    expect(frases).toEqual(['Hola, buenas.']);
  });

  it('divide varias frases en un mismo chunk', () => {
    const frases: string[] = [];
    const fb = new FraseBuffer((f) => frases.push(f));
    fb.agregar('Hola. ¿Cómo está? Muy bien.');
    fb.finalizar();
    expect(frases).toEqual(['Hola.', '¿Cómo está?', 'Muy bien.']);
  });

  it('no corta tras abreviaturas habituales (Dr., Sra., p. ej.)', () => {
    const frases: string[] = [];
    const fb = new FraseBuffer((f) => frases.push(f));
    fb.agregar('Soy el Dr. García, y la Sra. López, p. ej. es la enfermera. Ya está.');
    fb.finalizar();
    expect(frases).toEqual([
      'Soy el Dr. García, y la Sra. López, p. ej. es la enfermera.',
      'Ya está.',
    ]);
  });

  it('funciona igual si el texto llega troceado en fragmentos pequeños (streaming)', () => {
    const frases = trocear('Hola, buenas. ¿Cómo está usted hoy? Espero que mejor.');
    expect(frases).toEqual(['Hola, buenas.', '¿Cómo está usted hoy?', 'Espero que mejor.']);
  });

  it('corta por coma si una frase supera el límite sin puntuación fuerte', () => {
    const frases: string[] = [];
    const fb = new FraseBuffer((f) => frases.push(f), 20);
    fb.agregar('Esto es una frase muy larga, que sigue y sigue sin parar nunca');
    fb.finalizar();
    expect(frases[0]).toMatch(/,$/);
    expect(frases.join(' ')).toContain('sin parar nunca');
  });

  it('finalizar() vacía el resto del buffer aunque no termine en puntuación', () => {
    const frases: string[] = [];
    const fb = new FraseBuffer((f) => frases.push(f));
    fb.agregar('Un final sin punto');
    fb.finalizar();
    expect(frases).toEqual(['Un final sin punto']);
  });

  it('finalizar() no emite nada si el buffer está vacío', () => {
    const frases: string[] = [];
    const fb = new FraseBuffer((f) => frases.push(f));
    fb.agregar('Todo completo. ');
    fb.finalizar();
    expect(frases).toEqual(['Todo completo.']);
  });
});
