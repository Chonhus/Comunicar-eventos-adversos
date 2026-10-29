// Edge Function `evaluar-intento` — docs/RUBRICA.md §5 / docs/SPEC.md §4.2.
// Entrada: { casoId, turnos, checklistDetector, duracionSeg, intentoAnterior? }
// Salida: JSON según el esquema de docs/RUBRICA.md §5. La puntuación numérica final
// NO se calcula aquí: la calcula el código del cliente a partir de `items`/`alertas`
// (docs/RUBRICA.md §3), que ya tiene cargados los pesos de config/checklist.json.
import { corsHeaders, respuestaError, respuestaOpciones } from '../_shared/cors.ts';
import { cargarCaso } from '../_shared/casos.ts';
import { cargarChecklist } from '../_shared/checklist.ts';
import { cargarHechosReferencia } from '../_shared/hechosReferencia.ts';
import { llamarClaude } from '../_shared/anthropic.ts';
import { extraerJson } from '../_shared/extraerJson.ts';

const MODELO_EVALUADOR = Deno.env.get('CLAUDE_MODELO_EVALUADOR') ?? 'claude-sonnet-5-5';
// docs/RUBRICA.md sugería 2000, pero con una conversación real (muchos más turnos
// que la transcripción corta usada para probarlo) el JSON completo — 7 ítems +
// alertas + fortalezas + mejoras + comparación + resumen, todo con texto — puede
// superarlo y cortarse a mitad, lo que rompe el parseo (bug real visto en
// producción: "El evaluador no devolvió JSON válido" / HTTP 502). Con más margen.
const MAX_TOKENS = 4000;

const SYSTEM_PROMPT = `Eres un docente experto en seguridad del paciente y en comunicación abierta de eventos adversos (open disclosure), con experiencia en formación de residentes en España.
Evalúas la transcripción de una simulación en la que un ALUMNO comunica un evento adverso a un AVATAR (paciente o familiar).

Evalúa con la rúbrica proporcionada. Para cada ítem asigna 0, 1 o 2 y justifica con evidencia literal breve. Puedes corregir el resultado del detector en tiempo real si, con la conversación completa, el juicio cambia.
Identifica las alertas (conductas a evitar) con su evidencia.
Da feedback formativo, concreto y amable, en segunda persona (tú), en español de España:
- 3 fortalezas.
- 3 mejoras, cada una con una FRASE ALTERNATIVA que el alumno podría haber dicho en ese momento.
- Valoración global 1–5 de empatía, claridad y honestidad.
Si hay un intento anterior, compara y señala qué ha mejorado y qué sigue pendiente.
No inventes contenido que no esté en la transcripción. Ten en cuenta que procede de reconocimiento de voz.

Contexto legal español: no existe una "ley de disculpa" que proteja estas declaraciones ante un tribunal. Nunca sugieras, en comentarios, mejoras o frases alternativas, que el alumno debería haber admitido culpa, negligencia o responsabilidad legal (propia, de un compañero o de la institución). Para los ítems `explica_evento` y `lamenta` basta con que explique los hechos conocidos con honestidad (qué ha pasado, qué ha fallado a nivel de proceso) y exprese pesar o disculpa sincera; eso los cumple sin ninguna admisión de responsabilidad jurídica. Las frases alternativas que propongas deben limitarse a eso, nunca a declaraciones de culpa.

Responde SOLO con JSON válido según este esquema:
{"items":[{"id":"string","puntuacion":0,"evidencia":"string","comentario":"string"}],"alertas":[{"id":"string","evidencia":"string","comentario":"string"}],"fortalezas":["string","string","string"],"mejoras":[{"aspecto":"string","frase_alternativa":"string"}],"global":{"empatia":1,"claridad":1,"honestidad":1},"comparacion_intento_anterior":"string o null","resumen":"string"}`;

interface TurnoEntrada {
  rol: 'alumno' | 'avatar';
  texto: string;
}

interface ItemDetectorEntrada {
  id: string;
  calidad: 'parcial' | 'completo';
  evidencia?: string;
}

interface AlertaDetectorEntrada {
  id: string;
  evidencia: string;
  veces: number;
}

interface PeticionEvaluar {
  casoId: string;
  turnos: TurnoEntrada[];
  checklistDetector: { cumplidos: ItemDetectorEntrada[]; alertas: AlertaDetectorEntrada[] };
  duracionSeg: number;
  intentoAnterior?: { resumen: string } | null;
}

interface ItemEvaluado {
  id: string;
  puntuacion: 0 | 1 | 2;
  evidencia: string;
  comentario: string;
}

interface AlertaEvaluada {
  id: string;
  evidencia: string;
  comentario: string;
}

interface Mejora {
  aspecto: string;
  frase_alternativa: string;
}

function esPeticionValida(v: unknown): v is PeticionEvaluar {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.casoId === 'string' &&
    Array.isArray(o.turnos) &&
    o.turnos.length > 0 &&
    typeof o.checklistDetector === 'object' &&
    o.checklistDetector !== null &&
    typeof o.duracionSeg === 'number'
  );
}

function formatearDuracion(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m} min ${s} s`;
}

function construirUserPrompt(body: PeticionEvaluar): string {
  const caso = cargarCaso(body.casoId);
  const checklist = cargarChecklist();
  const hechos = cargarHechosReferencia(body.casoId);

  const estadoChecklist = [
    'Ítems cumplidos:',
    ...body.checklistDetector.cumplidos.map((c) => `- ${c.id} (${c.calidad}): "${c.evidencia ?? ''}"`),
    'Alertas detectadas:',
    ...body.checklistDetector.alertas.map((a) => `- ${a.id} (x${a.veces}): "${a.evidencia}"`),
  ].join('\n');

  const transcripcion = body.turnos
    .map((t) => `${t.rol === 'alumno' ? 'ALUMNO' : 'AVATAR'}: ${t.texto}`)
    .join('\n');

  return `CASO: ${caso.titulo}
HECHOS DE REFERENCIA: ${hechos}

RÚBRICA:
${checklist.items.map((i) => `- ${i.id}: ${i.definicion}`).join('\n')}

ALERTAS:
${checklist.alertas.map((a) => `- ${a.id}: ${a.definicion}`).join('\n')}

RESULTADO DEL DETECTOR EN TIEMPO REAL:
${estadoChecklist}

DURACIÓN: ${formatearDuracion(body.duracionSeg)}

INTENTO ANTERIOR: ${body.intentoAnterior?.resumen ?? 'Ninguno (primer intento)'}

TRANSCRIPCIÓN:
${transcripcion}`;
}

function enteroEntre(v: unknown, min: number, max: number, porDefecto: number): number {
  const n = typeof v === 'number' ? Math.round(v) : porDefecto;
  return Math.min(max, Math.max(min, n));
}

function validarYFiltrar(crudo: unknown, body: PeticionEvaluar): Record<string, unknown> {
  const o = (crudo ?? {}) as Record<string, unknown>;
  const checklist = cargarChecklist();
  const idsItems = new Set(checklist.items.map((i) => i.id));
  const idsAlertas = new Set(checklist.alertas.map((a) => a.id));

  const items: ItemEvaluado[] = Array.isArray(o.items)
    ? (o.items as Record<string, unknown>[])
        .filter((i) => typeof i.id === 'string' && idsItems.has(i.id as string))
        .map((i) => ({
          id: i.id as string,
          puntuacion: enteroEntre(i.puntuacion, 0, 2, 0) as 0 | 1 | 2,
          evidencia: typeof i.evidencia === 'string' ? i.evidencia : '',
          comentario: typeof i.comentario === 'string' ? i.comentario : '',
        }))
    : [];

  const alertas: AlertaEvaluada[] = Array.isArray(o.alertas)
    ? (o.alertas as Record<string, unknown>[])
        .filter((a) => typeof a.id === 'string' && idsAlertas.has(a.id as string))
        .map((a) => ({
          id: a.id as string,
          evidencia: typeof a.evidencia === 'string' ? a.evidencia : '',
          comentario: typeof a.comentario === 'string' ? a.comentario : '',
        }))
    : [];

  const fortalezas: string[] = Array.isArray(o.fortalezas)
    ? (o.fortalezas as unknown[]).filter((f): f is string => typeof f === 'string').slice(0, 3)
    : [];

  const mejoras: Mejora[] = Array.isArray(o.mejoras)
    ? (o.mejoras as Record<string, unknown>[])
        .filter((m) => typeof m.aspecto === 'string' && typeof m.frase_alternativa === 'string')
        .map((m) => ({ aspecto: m.aspecto as string, frase_alternativa: m.frase_alternativa as string }))
        .slice(0, 3)
    : [];

  const globalCrudo = (o.global ?? {}) as Record<string, unknown>;
  const global = {
    empatia: enteroEntre(globalCrudo.empatia, 1, 5, 3),
    claridad: enteroEntre(globalCrudo.claridad, 1, 5, 3),
    honestidad: enteroEntre(globalCrudo.honestidad, 1, 5, 3),
  };

  return {
    items,
    alertas,
    fortalezas,
    mejoras,
    global,
    comparacion_intento_anterior: body.intentoAnterior
      ? typeof o.comparacion_intento_anterior === 'string'
        ? o.comparacion_intento_anterior
        : null
      : null,
    resumen: typeof o.resumen === 'string' ? o.resumen : '',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return respuestaOpciones();
  if (req.method !== 'POST') return respuestaError('Método no permitido', 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respuestaError('JSON inválido');
  }
  if (!esPeticionValida(body)) {
    return respuestaError('Cuerpo esperado: { casoId, turnos, checklistDetector, duracionSeg }');
  }

  let userPrompt: string;
  try {
    userPrompt = construirUserPrompt(body);
  } catch (e) {
    return respuestaError(e instanceof Error ? e.message : 'Caso no encontrado', 404);
  }

  // No se pasa `temperature`: verificado contra la API real que este modelo la rechaza
  // ("temperature is deprecated for this model") salvo el valor por defecto (1).
  let crudo: string;
  try {
    crudo = await llamarClaude({
      modelo: MODELO_EVALUADOR,
      systemPrompt: SYSTEM_PROMPT,
      mensajes: [{ role: 'user', content: userPrompt }],
      maxTokens: MAX_TOKENS,
      signal: req.signal,
    });
  } catch (e) {
    return respuestaError(e instanceof Error ? e.message : 'Error llamando al evaluador', 502);
  }

  let resultado: Record<string, unknown>;
  try {
    resultado = validarYFiltrar(extraerJson(crudo), body);
  } catch {
    // Un reintento basta para el caso típico de un JSON truncado o con texto extra.
    try {
      crudo = await llamarClaude({
        modelo: MODELO_EVALUADOR,
        systemPrompt: SYSTEM_PROMPT,
        mensajes: [{ role: 'user', content: userPrompt }],
        maxTokens: MAX_TOKENS,
      });
      resultado = validarYFiltrar(extraerJson(crudo), body);
    } catch {
      // Se incluye el final de la respuesta cruda (no todo, por si es muy larga):
      // si vuelve a pasar, dice si se cortó a mitad (JSON incompleto) o el modelo
      // devolvió otra cosa — mucho más útil para depurar que un mensaje genérico.
      const final = crudo.length > 300 ? `…${crudo.slice(-300)}` : crudo;
      return respuestaError(`El evaluador no devolvió JSON válido. Final de la respuesta: ${final}`, 502);
    }
  }

  return new Response(JSON.stringify(resultado), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
