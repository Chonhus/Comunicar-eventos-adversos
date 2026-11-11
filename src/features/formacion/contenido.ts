// Módulo formativo en vídeo (clase grabada, subida como "no listado" en YouTube).
// Mientras no estén subidos todos, los pendientes llevan youtubeId: 'PENDIENTE' —
// VideoFormacion.tsx muestra un aviso en vez de intentar incrustar un id inválido.
import type { PasoFormacion } from './tipos';

export const pasos: PasoFormacion[] = [
  {
    tipo: 'video',
    titulo: 'Presentación',
    youtubeId: 'UKM724xH71g',
  },
  {
    tipo: 'video',
    titulo: 'Introducción',
    youtubeId: 'iM-87h6ZZ3I',
  },
  {
    tipo: 'preguntas',
    preguntas: [
      {
        id: 1,
        enunciado: 'Un paciente recibe una dosis extra de un fármaco sin sufrir daño. ¿Hay que comunicárselo?',
        opciones: [
          { texto: 'No, porque no hubo daño', correcta: false },
          { texto: 'Sí, también se comunica', correcta: true },
          { texto: 'Solo si pregunta', correcta: false },
        ],
      },
      {
        id: 2,
        enunciado: 'Pedir disculpas al paciente…',
        opciones: [
          { texto: 'Equivale a reconocer responsabilidad legal', correcta: false },
          { texto: 'Es expresar pesar y es recomendable', correcta: true },
          { texto: 'Debe evitarse', correcta: false },
        ],
      },
    ],
  },
  {
    tipo: 'video',
    titulo: 'Cómo notificar un evento adverso',
    youtubeId: 'PV76wigbwoY',
  },
  {
    tipo: 'preguntas',
    preguntas: [
      {
        id: 3,
        enunciado: 'Ante "¿de quién es la culpa?", lo más adecuado es…',
        opciones: [
          { texto: 'Indicar qué profesional estaba de turno', correcta: false },
          { texto: 'Decir que fue culpa del paciente', correcta: false },
          { texto: 'Explicar que se está analizando qué falló en el sistema', correcta: true },
        ],
      },
      {
        id: 4,
        enunciado: 'Si la familia quiere poner una reclamación…',
        opciones: [
          { texto: 'Intentar disuadirla', correcta: false },
          { texto: 'Informar de que es su derecho y cómo hacerlo', correcta: true },
          { texto: 'Cambiar de tema', correcta: false },
        ],
      },
    ],
  },
  {
    tipo: 'video',
    titulo: 'Conclusiones',
    youtubeId: 'PENDIENTE',
  },
];
