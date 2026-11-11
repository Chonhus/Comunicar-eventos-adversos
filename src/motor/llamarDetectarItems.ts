// Cliente del Edge Function `detectar-items` (docs/SPEC.md §4.1). El prompt del detector
// solo busca evidencia en el ÚLTIMO turno del alumno (los turnos previos son solo
// contexto): si esta llamada falla o tarda más de 4 s, ese turno se pierde para
// siempre (en la siguiente llamada ya no es el "último turno"), así que un
// reintento aquí evita falsos negativos por un fallo puntual de red o de latencia
// del modelo — mismo patrón que obtenerCredencialVoz.ts.
import type { ResultadoDeteccion } from '@/features/llamada/ChecklistEngine';
import type { TurnoHistorial } from './tipos';

interface LlamarDetectarOpts {
  casoId: string;
  pendientes: string[];
  contexto: TurnoHistorial[];
  turno: string;
}

const TIMEOUT_MS = 4000;

async function pedirDeteccion(opts: LlamarDetectarOpts): Promise<ResultadoDeteccion | null> {
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
  } catch {
    return null;
  }
}

export async function llamarDetectarItems(opts: LlamarDetectarOpts): Promise<ResultadoDeteccion | null> {
  let resultado = await pedirDeteccion(opts);
  if (resultado === null) resultado = await pedirDeteccion(opts);
  if (resultado === null) console.warn('[detectar-items] turno ignorado tras reintentar (fallo o timeout)');
  return resultado;
}
