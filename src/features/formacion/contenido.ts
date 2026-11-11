// Módulo formativo en vídeo (clase grabada, subida como "no listado" en YouTube).
// Mientras no estén subidos todos, los pendientes llevan youtubeId: 'PENDIENTE' —
// VideoFormacion.tsx muestra un aviso en vez de intentar incrustar un id inválido.
import type { PasoFormacion, PreguntaTest } from './tipos';

// Mismas 5 preguntas antes (pretest, nada más pasar el consentimiento) y después
// (postest, al llegar a la evaluación final del Nivel 2) — diseño pre/post clásico
// para medir la mejora real, no solo si se acertó al final.
export const preguntasPrePost: PreguntaTest[] = [
  {
    id: 1,
    enunciado: '¿Qué es un evento adverso?',
    opciones: [
      { texto: 'Un daño al paciente relacionado con la atención sanitaria, no con su enfermedad de base', correcta: true },
      { texto: 'Cualquier empeoramiento del paciente, sea cual sea la causa', correcta: false },
      { texto: 'Solo el daño causado de forma intencionada', correcta: false },
    ],
  },
  {
    id: 2,
    enunciado: 'El paciente tiene derecho a ser informado de un evento adverso que le afecte porque…',
    opciones: [
      { texto: 'Es solo buena voluntad del profesional, no una obligación', correcta: false },
      { texto: 'Es un derecho reconocido legalmente (Ley 41/2002, autonomía del paciente)', correcta: true },
      { texto: 'Solo si el paciente lo pide por escrito', correcta: false },
    ],
  },
  {
    id: 3,
    enunciado: 'Al comunicar un evento adverso, lo recomendable es…',
    opciones: [
      { texto: 'Usar lenguaje técnico para ser preciso', correcta: false },
      { texto: 'Explicar los hechos con claridad y ofrecer un interlocutor de referencia', correcta: true },
      { texto: 'Dar los mínimos detalles posibles para no alarmar', correcta: false },
    ],
  },
  {
    id: 4,
    enunciado: 'Si te preguntan "¿de quién es la culpa?", lo adecuado es…',
    opciones: [
      { texto: 'Dar un nombre concreto si lo sabes', correcta: false },
      { texto: 'Decir que ha sido mala suerte', correcta: false },
      { texto: 'Explicar que se va a analizar qué falló en el sistema, sin señalar a una persona', correcta: true },
    ],
  },
  {
    id: 5,
    enunciado: 'Pedir disculpas por un evento adverso…',
    opciones: [
      { texto: 'Es expresar pesar por lo ocurrido, no una admisión de culpa legal', correcta: true },
      { texto: 'Equivale a reconocer responsabilidad jurídica', correcta: false },
      { texto: 'Debe evitarse por motivos legales', correcta: false },
    ],
  },
];

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
        enunciado: 'El método CANDOR (Communication and Optimal Resolution)…',
        opciones: [
          { texto: 'Es una estrategia de "negar y defender" ante el paciente', correcta: false },
          {
            texto: 'Es un proceso estructurado de comunicación abierta y resolución tras un evento adverso, que incluye también el apoyo al profesional implicado',
            correcta: true,
          },
          { texto: 'Solo se aplica a incidentes sin ningún tipo de daño', correcta: false },
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
    youtubeId: 'GsUYuhxVwz4',
  },
];
