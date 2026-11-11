// Módulo formativo en vídeo (clase grabada, subida como "no listado" en YouTube).
// Mientras no estén subidos todos, los pendientes llevan youtubeId: 'PENDIENTE' —
// VideoFormacion.tsx muestra un aviso en vez de intentar incrustar un id inválido.
import type { PasoFormacion, PreguntaTest } from './tipos';

// Mismas 5 preguntas antes (pretest, nada más pasar el consentimiento) y después
// (postest, al llegar a la evaluación final del Nivel 2) — diseño pre/post clásico
// para medir la mejora real, no solo si se acertó al final.
// Las opciones incorrectas están pensadas para sonar plausibles (no absurdas), de
// forma que acertar requiera haber visto los vídeos y no solo el sentido común
// (reportado por un alumno: "se contestan solo con sentido común").
export const preguntasPrePost: PreguntaTest[] = [
  {
    id: 1,
    enunciado: '¿Qué es un evento adverso?',
    opciones: [
      { texto: 'Un daño al paciente relacionado con la atención sanitaria, no con la evolución natural de su enfermedad', correcta: true },
      { texto: 'Cualquier empeoramiento clínico del paciente durante el ingreso, sea cual sea la causa', correcta: false },
      { texto: 'Un error de medicación, haya causado daño o no', correcta: false },
    ],
  },
  {
    id: 2,
    enunciado: 'El paciente tiene derecho a ser informado de un evento adverso que le afecte porque…',
    opciones: [
      { texto: 'Es una buena práctica recomendada, pero no existe obligación legal en España', correcta: false },
      { texto: 'Es un derecho reconocido legalmente (Ley 41/2002, de autonomía del paciente)', correcta: true },
      { texto: 'Solo es exigible si el evento ha causado un daño grave o permanente', correcta: false },
    ],
  },
  {
    id: 3,
    enunciado: 'Al comunicar un evento adverso, lo recomendable es…',
    opciones: [
      { texto: 'Esperar a que termine la investigación completa, para no dar información incompleta', correcta: false },
      { texto: 'Explicar los hechos con claridad y ofrecer un interlocutor de referencia', correcta: true },
      { texto: 'Dar el máximo detalle técnico posible, para demostrar transparencia', correcta: false },
    ],
  },
  {
    id: 4,
    enunciado: 'Si te preguntan "¿de quién es la culpa?", lo adecuado es…',
    opciones: [
      { texto: 'Explicar que hay un responsable, pero que su identidad es confidencial', correcta: false },
      { texto: 'Decir que probablemente nunca se sabrá qué pasó', correcta: false },
      { texto: 'Explicar que se va a analizar qué ha pasado a nivel de proceso, sin señalar a una persona', correcta: true },
    ],
  },
  {
    id: 5,
    enunciado: 'Pedir disculpas por un evento adverso…',
    opciones: [
      { texto: 'Es expresar pesar por lo ocurrido y no supone una admisión de responsabilidad legal', correcta: true },
      { texto: 'Debe reservarse para los casos en que esté confirmado que alguien cometió un error', correcta: false },
      { texto: 'Puede interpretarse como una admisión de culpa, así que es mejor evitarlo', correcta: false },
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
    youtubeId: 'Rairlh8uqxM',
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
        enunciado: 'El concepto de "segunda víctima" se refiere a…',
        opciones: [
          { texto: 'El profesional sanitario implicado en el evento adverso, que también necesita apoyo tras lo ocurrido', correcta: true },
          { texto: 'Un segundo paciente afectado por el mismo evento adverso', correcta: false },
          { texto: 'El familiar del paciente que presenta una reclamación', correcta: false },
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
        enunciado: 'Un incidente que no ha causado ningún daño al paciente (p. ej. una dosis extra sin consecuencias)…',
        opciones: [
          { texto: 'No es necesario notificarlo si finalmente no hubo ninguna consecuencia clínica', correcta: false },
          { texto: 'Debe notificarse siempre en el sistema de notificación del hospital, aunque no se comunique al paciente', correcta: true },
          { texto: 'Solo debe notificarse si el paciente se da cuenta y pregunta', correcta: false },
        ],
      },
      {
        id: 4,
        enunciado: 'Si la familia quiere poner una reclamación…',
        opciones: [
          { texto: 'Intentar convencerla de que no merece la pena, porque alargará un proceso que no va a cambiar nada', correcta: false },
          { texto: 'Informar de que es su derecho y de cómo hacerlo (p. ej. a través de Atención al Paciente)', correcta: true },
          { texto: 'Decirle que es mejor esperar al resultado de la investigación antes de reclamar', correcta: false },
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
