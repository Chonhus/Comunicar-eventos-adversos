// Edge Function `detectar-items` — docs/RUBRICA.md §4 / docs/SPEC.md §4.1.
// Entrada: { casoId, pendientes: string[], contexto: {rol,texto}[], turno: string }
// Salida: { cumplidos: [{id,calidad,evidencia}], alertas: [{id,evidencia}] }
import { corsHeaders, respuestaError, respuestaOpciones } from '../_shared/cors.ts';
import { cargarCaso } from '../_shared/casos.ts';
import { cargarChecklist } from '../_shared/checklist.ts';
import { llamarClaude } from '../_shared/anthropic.ts';
import { extraerJson } from '../_shared/extraerJson.ts';

const MODELO_DETECTOR = Deno.env.get('CLAUDE_MODELO_DETECTOR') ?? 'claude-haiku-5-5';
const MAX_TOKENS = 300;

const SYSTEM_PROMPT = `Eres un evaluador experto en comunicación de eventos adversos en el ámbito sanitario español.
Analizas, turno a turno, lo que dice un profesional sanitario (ALUMNO) a un paciente o familiar (AVATAR) en una simulación formativa.

Tu tarea: decidir si el ÚLTIMO TURNO DEL ALUMNO cumple alguno de los ítems PENDIENTES o comete alguna de las conductas de ALERTA.
- Usa los turnos anteriores solo como contexto.
- Sé estricto pero justo: marca un ítem solo si hay evidencia textual clara en el último turno (o en la combinación del último turno con el inmediatamente anterior del alumno, si una frase quedó partida).
- "calidad": "completo" si cumple totalmente la definición; "parcial" si lo intenta pero le falta algo.
- "evidencia": cita literal breve (máx. 20 palabras) del alumno.
- Si no hay nada, devuelve listas vacías.
- La transcripción procede de reconocimiento de voz: tolera errores ortográficos y de puntuación.

Responde SOLO con JSON válido con este esquema:
{"cumplidos":[{"id":"string","calidad":"completo|parcial","evidencia":"string"}],"alertas":[{"id":"string","evidencia":"string"}]}`;

interface TurnoContexto {
  rol: 'alumno' | 'avatar';
  texto: string;
}

interface PeticionDetectar {
  casoId: string;
  pendientes: string[];
  contexto: TurnoContexto[];
  turno: string;
}

interface ItemCumplido {
  id: string;
  calidad: 'completo' | 'parcial';
  evidencia: string;
}

interface AlertaDetectada {
  id: string;
  evidencia: string;
}

function esPeticionValida(v: unknown): v is PeticionDetectar {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.casoId === 'string' &&
    typeof o.turno === 'string' &&
    o.turno.trim().length > 0 &&
    Array.isArray(o.pendientes) &&
    Array.isArray(o.contexto)
  );
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
    return respuestaError('Cuerpo esperado: { casoId, pendientes, contexto, turno }');
  }

  let caso;
  let checklist;
  try {
    caso = cargarCaso(body.casoId);
    checklist = cargarChecklist();
  } catch (e) {
    return respuestaError(e instanceof Error ? e.message : 'Caso no encontrado', 404);
  }

  const idsPendientesValidos = new Set(
    checklist.items.filter((i) => body.pendientes.includes(i.id)).map((i) => i.id),
  );
  const itemsPendientes = checklist.items.filter((i) => idsPendientesValidos.has(i.id));

  if (itemsPendientes.length === 0 && checklist.alertas.length === 0) {
    return new Response(JSON.stringify({ cumplidos: [], alertas: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userPrompt = `CASO: ${caso.titulo} — interlocutor: ${caso.avatar.nombre} (${caso.avatar.rol})

ÍTEMS PENDIENTES:
${itemsPendientes.map((i) => `- ${i.id}: ${i.definicion}`).join('\n') || '(ninguno)'}

ALERTAS POSIBLES:
${checklist.alertas.map((a) => `- ${a.id}: ${a.definicion}`).join('\n')}

CONTEXTO (turnos previos):
${body.contexto.map((t) => `${t.rol === 'alumno' ? 'ALUMNO' : 'AVATAR'}: ${t.texto}`).join('\n') || '(sin turnos previos)'}

ÚLTIMO TURNO DEL ALUMNO:
"${body.turno}"`;

  let crudo: string;
  try {
    crudo = await llamarClaude({
      modelo: MODELO_DETECTOR,
      systemPrompt: SYSTEM_PROMPT,
      mensajes: [{ role: 'user', content: userPrompt }],
      maxTokens: MAX_TOKENS,
      signal: req.signal,
    });
  } catch (e) {
    return respuestaError(e instanceof Error ? e.message : 'Error llamando al detector', 502);
  }

  let parseado: { cumplidos?: unknown; alertas?: unknown };
  try {
    parseado = extraerJson(crudo) as typeof parseado;
  } catch {
    // Un reintento basta para el caso típico de un JSON truncado o con texto extra.
    try {
      crudo = await llamarClaude({
        modelo: MODELO_DETECTOR,
        systemPrompt: SYSTEM_PROMPT,
        mensajes: [{ role: 'user', content: userPrompt }],
        maxTokens: MAX_TOKENS,
      });
      parseado = extraerJson(crudo) as typeof parseado;
    } catch {
      return respuestaError('El detector no devolvió JSON válido', 502);
    }
  }

  const idsItems = new Set(checklist.items.map((i) => i.id));
  const idsAlertas = new Set(checklist.alertas.map((a) => a.id));

  const cumplidos: ItemCumplido[] = Array.isArray(parseado.cumplidos)
    ? parseado.cumplidos.filter(
        (c): c is ItemCumplido =>
          !!c &&
          typeof c === 'object' &&
          idsItems.has((c as ItemCumplido).id) &&
          ['completo', 'parcial'].includes((c as ItemCumplido).calidad),
      )
    : [];

  const alertas: AlertaDetectada[] = Array.isArray(parseado.alertas)
    ? parseado.alertas.filter(
        (a): a is AlertaDetectada => !!a && typeof a === 'object' && idsAlertas.has((a as AlertaDetectada).id),
      )
    : [];

  return new Response(JSON.stringify({ cumplidos, alertas }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
