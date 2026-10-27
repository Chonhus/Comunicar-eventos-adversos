// Cliente del Edge Function `conversar` (docs/MOTOR.md §5): parsea el SSE propio
// (event: delta|fin|error) y va entregando el texto según llega.
import type { TurnoHistorial } from './tipos';

interface LlamarConversarOpts {
  casoId: string;
  historial: TurnoHistorial[];
  turnoAlumno: string;
  signal?: AbortSignal;
  onDelta: (texto: string) => void;
}

export async function llamarConversar(opts: LlamarConversarOpts): Promise<void> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversar`;
  const res = await fetch(url, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      casoId: opts.casoId,
      historial: opts.historial,
      turnoAlumno: opts.turnoAlumno,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`conversar: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const bloques = buffer.split('\n\n');
    buffer = bloques.pop() ?? '';

    for (const bloque of bloques) {
      const lineas = bloque.split('\n');
      const lineaEvento = lineas.find((l) => l.startsWith('event: '));
      const lineaDatos = lineas.find((l) => l.startsWith('data: '));
      if (!lineaEvento || !lineaDatos) continue;

      const evento = lineaEvento.slice('event: '.length).trim();
      const datos = JSON.parse(lineaDatos.slice('data: '.length));

      if (evento === 'delta' && typeof datos.texto === 'string') {
        opts.onDelta(datos.texto);
      } else if (evento === 'error') {
        throw new Error(datos.mensaje ?? 'Error en conversar');
      } else if (evento === 'fin') {
        return;
      }
    }
  }
}
