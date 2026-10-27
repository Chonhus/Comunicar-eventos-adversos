// Cliente del Edge Function `detectar-items` (docs/SPEC.md §4.1): si falla o tarda
// más de 4 s se ignora ese turno (se incluirá como contexto en el siguiente).
import type { ResultadoDeteccion } from '@/features/llamada/ChecklistEngine';
import type { TurnoHistorial } from './tipos';

interface LlamarDetectarOpts {
  casoId: string;
  pendientes: string[];
  contexto: TurnoHistorial[];
  turno: string;
}

const TIMEOUT_MS = 4000;

export async function llamarDetectarItems(opts: LlamarDetectarOpts): Promise<ResultadoDeteccion | null> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detectar-items`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(opts),
    });
    if (!res.ok) return null;
    return (await res.json()) as ResultadoDeteccion;
  } catch (e) {
    console.warn('[detectar-items] turno ignorado (fallo o timeout):', e);
    return null;
  }
}
