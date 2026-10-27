// La fuente única de verdad es config/personajes/*.json (ver docs/CASOS.md), pero el
// runtime de Edge Functions (local y en la nube) solo empaqueta lo que forma parte del
// grafo de módulos estático: un Deno.readTextFile en tiempo de ejecución NO garantiza
// que el archivo viaje con la función desplegada. `npm run sync:config` copia esos JSON
// a ./data/ antes de servir/desplegar, y aquí se importan de forma estática.
import n1Paracetamol from './data/personajes/n1_paracetamol.json' with { type: 'json' };
import n2CaidaFractura from './data/personajes/n2_caida_fractura.json' with { type: 'json' };

export interface Personaje {
  id: string;
  nombre: string;
  descripcionBreve: string;
  backstory: string;
  conocimiento: string;
  comportamiento: string;
  emocionInicial: string;
  fraseApertura: string;
  silencioIncomodoMs: number;
}

const PERSONAJES: Record<string, Personaje> = {
  n1_paracetamol: n1Paracetamol as Personaje,
  n2_caida_fractura: n2CaidaFractura as Personaje,
};

export function cargarPersonaje(casoId: string): Personaje {
  const personaje = PERSONAJES[casoId];
  if (!personaje) throw new Error(`casoId desconocido: ${casoId}`);
  return personaje;
}

export function construirSystemPrompt(p: Personaje): string {
  return `Eres ${p.nombre}, ${p.descripcionBreve}. Estás en una conversación con un profesional sanitario del hospital, en un ejercicio de simulación formativa. Hablas SIEMPRE en español de España, de forma natural y coloquial, como hablaría esta persona en la vida real.

QUIÉN ERES:
${p.backstory}

LO QUE SABES Y LO QUE NO:
${p.conocimiento}

CÓMO TE COMPORTAS:
${p.comportamiento}

REGLAS:
- Responde en 1–3 frases cortas, como en una conversación oral. Nada de listas ni de formato.
- No eres un asistente: nunca ayudes al profesional, no le des pistas sobre cómo comunicar, no evalúes ni menciones que esto es una simulación.
- Reacciona a lo que el profesional dice realmente: si es claro y empático, te vas calmando; si es vago, técnico, defensivo o culpabiliza, tu reacción empeora según tu perfil.
- No inventes datos clínicos que no te hayan dicho.
- Empieza cada respuesta con una etiqueta de emoción entre corchetes: [neutral], [preocupado], [enfadado], [triste] o [aliviado]. La etiqueta no se pronuncia.`;
}
