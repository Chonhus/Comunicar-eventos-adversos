// Contenido adaptado de docs/FORMACION.md (borrador a revisar por el equipo docente).
import type { BloqueFormacion, PreguntaTest } from './tipos';

export const bloques: BloqueFormacion[] = [
  {
    id: 1,
    titulo: '¿Qué es un evento adverso?',
    contenido: [
      'Un **evento adverso** es un daño al paciente relacionado con la atención sanitaria y no con su enfermedad de base.',
      'Un **incidente sin daño** es aquel que llegó al paciente pero no le causó daño (p. ej. una dosis extra sin consecuencias). También se comunica.',
      'Los eventos adversos son frecuentes: en los estudios en hospitales afectan aproximadamente a 1 de cada 10 pacientes ingresados, y una parte importante son evitables.',
      'La mayoría se deben a **fallos del sistema** (procesos, comunicación, organización), no a la mala fe de una persona.',
    ],
    puntosClave: [
      'Daño ligado a la atención',
      'Los incidentes sin daño también cuentan',
      'Enfoque de sistema, no de culpa',
    ],
  },
  {
    id: 2,
    titulo: '¿Por qué comunicar?',
    contenido: [
      'El paciente tiene **derecho a la información** sobre su proceso (Ley 41/2002 de autonomía del paciente).',
      'Comunicar de forma honesta **mantiene la confianza**, facilita la toma de decisiones y reduce el conflicto.',
      'No comunicar o hacerlo mal aumenta la sensación de engaño y las reclamaciones.',
      'Pedir disculpas **no es reconocer culpa jurídica**: es expresar pesar por lo que ha vivido el paciente.',
      'La comunicación también ayuda al profesional implicado (segunda víctima).',
    ],
    puntosClave: ['Derecho del paciente', 'Confianza', 'Disculparse ≠ declararse culpable'],
  },
  {
    id: 3,
    titulo: 'Antes de la conversación',
    contenido: [
      'Recoge los **hechos confirmados** (qué, cuándo, consecuencias, plan). No especules.',
      'Decide **quién** comunica (idealmente el responsable del paciente, acompañado si es posible) y **a quién** (paciente y/o familia, con su consentimiento).',
      'Busca un **lugar tranquilo**, sin interrupciones, sentado, con tiempo.',
      'Asegúrate de que el evento está **notificado** en el sistema de notificación del hospital.',
    ],
  },
  {
    id: 4,
    titulo: 'La estructura de la conversación',
    contenido: [
      '1. **Preséntate**: nombre y rol.',
      '2. **Explica qué ha pasado**: hechos claros, lenguaje sencillo, sin tecnicismos ni suposiciones.',
      '3. **Lamenta lo sucedido**: "Siento mucho lo que ha ocurrido". Pedir disculpas es adecuado.',
      '4. **Explica cómo se va a tratar**: consecuencias, pruebas, tratamiento y signos de alarma.',
      '5. **Ofrece un interlocutor**: una persona concreta de referencia para dudas y seguimiento.',
      '6. **Escucha y resuelve dudas**: deja silencios, valida emociones ("entiendo que esté enfadada").',
      '7. **Explica qué se hará para que no se repita**: notificación, análisis, medidas.',
    ],
  },
  {
    id: 5,
    titulo: 'Qué evitar y situaciones difíciles',
    contenido: [
      '❌ **Culpabilizar** a compañeros, a otros servicios o al propio paciente.',
      '❌ **Especular** o prometer resultados.',
      '❌ **Minimizar** ("no ha sido nada").',
      '❌ **Ponerse a la defensiva** o desanimar una reclamación (es un derecho; informa del Servicio de Atención al Paciente).',
      'Ante el **enfado**: no lo tomes como algo personal, valida la emoción, no discutas, vuelve a los hechos y al plan.',
      'Ante "**¿de quién es la culpa?**": "Ahora mismo estamos analizando qué falló para que no vuelva a pasar; le mantendremos informada".',
      'Si no sabes algo: "No lo sé todavía, lo voy a averiguar y se lo diré".',
    ],
  },
];

export const preguntasTest: PreguntaTest[] = [
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
    enunciado: '¿Cuál NO forma parte de la estructura recomendada?',
    opciones: [
      { texto: 'Ofrecer un interlocutor de referencia', correcta: false },
      { texto: 'Asegurar que no volverá a pasar nunca', correcta: true },
      { texto: 'Explicar el plan de atención', correcta: false },
    ],
  },
  {
    id: 5,
    enunciado: 'Si la familia quiere poner una reclamación…',
    opciones: [
      { texto: 'Intentar disuadirla', correcta: false },
      { texto: 'Informar de que es su derecho y cómo hacerlo', correcta: true },
      { texto: 'Cambiar de tema', correcta: false },
    ],
  },
];
