// Cliente de la Edge Function `evaluar-intento` (docs/SPEC.md §4.2). A diferencia de
// `detectar-items`, un fallo aquí SÍ se propaga: es el resultado que el alumno está
// esperando ver, así que la pantalla de feedback debe poder mostrar un error y
// reintentar, no ignorarlo en silencio.
import type { EvaluacionIntento, PeticionEvaluarIntento } from './tipos';

const TIMEOUT_MS = 25_000;

export async function llamarEvaluarIntento(peticion: PeticionEvaluarIntento): Promise<EvaluacionIntento> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluar-intento`;
  const res = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(peticion),
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    throw new Error(`evaluar-intento: HTTP ${res.status} ${texto}`);
  }
  return (await res.json()) as EvaluacionIntento;
}
