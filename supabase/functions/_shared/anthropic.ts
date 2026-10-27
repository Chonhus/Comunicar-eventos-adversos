const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export interface MensajeClaude {
  role: 'user' | 'assistant';
  content: string;
}

interface LlamarClaudeOpts {
  modelo: string;
  systemPrompt: string;
  mensajes: MensajeClaude[];
  maxTokens: number;
  temperature?: number;
  cachearSystemPrompt?: boolean;
  signal?: AbortSignal;
}

function apiKey(): string {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Falta el secreto ANTHROPIC_API_KEY (supabase secrets set / --env-file).');
  return key;
}

function cabeceras() {
  return {
    'content-type': 'application/json',
    'x-api-key': apiKey(),
    'anthropic-version': ANTHROPIC_VERSION,
  };
}

/** Llamada sin streaming: devuelve el texto completo de la primera respuesta. */
export async function llamarClaude(opts: LlamarClaudeOpts): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: cabeceras(),
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.modelo,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 1,
      thinking: { type: 'disabled' },
      system: opts.cachearSystemPrompt
        ? [{ type: 'text', text: opts.systemPrompt, cache_control: { type: 'ephemeral' } }]
        : opts.systemPrompt,
      messages: opts.mensajes,
    }),
  });
  if (!res.ok) {
    const cuerpo = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${cuerpo}`);
  }
  const json = await res.json();
  const bloqueTexto = (json.content ?? []).find((b: { type: string }) => b.type === 'text');
  return bloqueTexto?.text ?? '';
}

/**
 * Llamada con streaming (SSE de Anthropic) que invoca `onDelta` por cada
 * fragmento de texto recibido. Reemite solo el texto: el formato de evento
 * de Anthropic queda encapsulado aquí (ver MotorConversacion en docs/MOTOR.md,
 * principio de poder cambiar de proveedor sin tocar el resto de la app).
 */
export async function llamarClaudeStream(
  opts: LlamarClaudeOpts,
  onDelta: (texto: string) => void,
): Promise<void> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: cabeceras(),
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.modelo,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 1,
      thinking: { type: 'disabled' },
      stream: true,
      system: opts.cachearSystemPrompt
        ? [{ type: 'text', text: opts.systemPrompt, cache_control: { type: 'ephemeral' } }]
        : opts.systemPrompt,
      messages: opts.mensajes,
    }),
  });
  if (!res.ok || !res.body) {
    const cuerpo = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${cuerpo}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const eventos = buffer.split('\n\n');
    buffer = eventos.pop() ?? '';

    for (const bloque of eventos) {
      const lineaDatos = bloque.split('\n').find((l) => l.startsWith('data: '));
      if (!lineaDatos) continue;
      const payload = lineaDatos.slice('data: '.length);
      let evento: Record<string, unknown>;
      try {
        evento = JSON.parse(payload);
      } catch {
        continue;
      }
      if (
        evento.type === 'content_block_delta' &&
        (evento.delta as { type?: string } | undefined)?.type === 'text_delta'
      ) {
        const texto = (evento.delta as { text?: string }).text;
        if (texto) onDelta(texto);
      }
    }
  }
}
