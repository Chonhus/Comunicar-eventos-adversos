// Respaldo palabra→visema para español (docs/AVATARES.md §4), usado cuando no hay
// visemas reales (sin AZURE_SPEECH_KEY, o con NavegadorTTS/speechSynthesis). Reglas
// grafema→fonema sencillas, a propósito aproximadas — no es un transcriptor fonético
// completo. Agrupación de consonantes alineada con los grupos de Azure (mapaVisemas.ts)
// para que suene igual de "correcto" tanto si el visema viene de Azure como de aquí.
import type { VisemaOculus } from './mapaVisemas';

export interface SegmentoVisema {
  visema: VisemaOculus;
  inicioMs: number;
  durMs: number;
}

const VOCAL_SIN_ACENTO: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u',
};

function normalizarVocal(c: string): string {
  return VOCAL_SIN_ACENTO[c] ?? c;
}

const VOCAL_A_VISEMA: Record<string, VisemaOculus> = { a: 'aa', e: 'E', i: 'I', o: 'O', u: 'U' };

// true = vocal "cerrada" relevante para decidir c/g suave (e, i)
function esVocalFrontal(c: string): boolean {
  return c === 'e' || c === 'i';
}

function unidadesDePalabra(palabra: string): VisemaOculus[] {
  const letras = Array.from(palabra.toLowerCase()).map(normalizarVocal);
  const unidades: VisemaOculus[] = [];
  let i = 0;
  while (i < letras.length) {
    const c = letras[i];
    const c2 = letras[i + 1];

    // Dígrafos de dos letras.
    if (c === 'c' && c2 === 'h') { unidades.push('CH'); i += 2; continue; }
    if (c === 'l' && c2 === 'l') { unidades.push('nn'); i += 2; continue; }
    if (c === 'r' && c2 === 'r') { unidades.push('RR'); i += 2; continue; }
    // "qu"/"gu" + vocal: la u es muda, pero la vocal que sigue sí suena (se procesa
    // en la siguiente vuelta del bucle, por eso aquí solo se salta "qu"/"gu").
    if (c === 'q' && c2 === 'u') { unidades.push('kk'); i += 2; continue; }
    if (c === 'g' && c2 === 'u' && esVocalFrontal(letras[i + 2] ?? '')) { unidades.push('kk'); i += 2; continue; }

    if (c === 'h') { i += 1; continue; } // la h española es muda

    if (VOCAL_A_VISEMA[c]) { unidades.push(VOCAL_A_VISEMA[c]); i += 1; continue; }

    switch (c) {
      case 'p': case 'b': case 'v': case 'm':
        unidades.push('PP'); break;
      case 'f':
        unidades.push('FF'); break;
      case 's': case 'z':
        unidades.push('SS'); break;
      case 'c':
        unidades.push(esVocalFrontal(c2 ?? '') ? 'SS' : 'kk'); break;
      case 'x':
        unidades.push('SS'); break;
      case 't': case 'd':
        unidades.push('DD'); break;
      case 'n': case 'ñ': case 'l':
        unidades.push('nn'); break;
      case 'r':
        unidades.push('RR'); break;
      case 'k': case 'g': case 'j':
        unidades.push('kk'); break;
      case 'y': case 'w':
        unidades.push('I'); break;
      default:
        // consonante no contemplada (p.ej. dígitos colados): se ignora.
        break;
    }
    i += 1;
  }
  return unidades;
}

/** Trocea `texto` en palabras y reparte `duracionTotalMs` por igual entre los visemas detectados. */
export function heuristicaVisemasEs(texto: string, duracionTotalMs: number): SegmentoVisema[] {
  const palabras = texto.split(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ]+/).filter(Boolean);
  const unidades = palabras.flatMap(unidadesDePalabra);
  if (unidades.length === 0) return [];

  const durMs = duracionTotalMs / unidades.length;
  return unidades.map((visema, idx) => ({
    visema,
    inicioMs: Math.round(idx * durMs),
    durMs: Math.round(durMs),
  }));
}
