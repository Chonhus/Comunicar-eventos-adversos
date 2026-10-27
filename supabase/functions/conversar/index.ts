// Edge Function `conversar` — docs/MOTOR.md §5.
// Entrada: { casoId, historial: [{rol, texto}], turnoAlumno }
// Salida: SSE propio (event: delta -> {texto}, event: fin -> {}, event: error -> {mensaje})
import { corsHeaders, respuestaError, respuestaOpciones } from '../_shared/cors.ts';
import { cargarPersonaje, construirSystemPrompt } from '../_shared/personajes.ts';
import { llamarClaudeStream, type MensajeClaude } from '../_shared/anthropic.ts';

interface TurnoEntrada {
  rol: 'alumno' | 'avatar';
  texto: string;
}

interface PeticionConversar {
  casoId: string;
  historial: TurnoEntrada[];
  turnoAlumno: string;
}

const MODELO_PERSONAJE = Deno.env.get('CLAUDE_MODELO_PERSONAJE') ?? 'claude-haiku-5-5';
const MAX_TOKENS_PERSONAJE = 200;

function esPeticionValida(v: unknown): v is PeticionConversar {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.casoId === 'string' &&
    typeof o.turnoAlumno === 'string' &&
    o.turnoAlumno.trim().length > 0 &&
    Array.isArray(o.historial)
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
    return respuestaError('Cuerpo esperado: { casoId, historial, turnoAlumno }');
  }

  let systemPrompt: string;
  try {
    systemPrompt = construirSystemPrompt(cargarPersonaje(body.casoId));
  } catch (e) {
    return respuestaError(e instanceof Error ? e.message : 'Caso no encontrado', 404);
  }

  const mensajes: MensajeClaude[] = [
    ...body.historial.map((t) => ({
      role: (t.rol === 'alumno' ? 'user' : 'assistant') as const,
      content: t.texto,
    })),
    { role: 'user', content: body.turnoAlumno },
  ];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const enviar = (evento: string, datos: unknown) => {
        controller.enqueue(encoder.encode(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`));
      };
      try {
        await llamarClaudeStream(
          {
            modelo: MODELO_PERSONAJE,
            systemPrompt,
            mensajes,
            maxTokens: MAX_TOKENS_PERSONAJE,
            cachearSystemPrompt: true,
            signal: req.signal,
          },
          (texto) => enviar('delta', { texto }),
        );
        enviar('fin', {});
      } catch (e) {
        enviar('error', { mensaje: e instanceof Error ? e.message : 'Error desconocido' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});
