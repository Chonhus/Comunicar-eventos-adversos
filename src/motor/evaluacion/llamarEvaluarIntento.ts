// Cliente de la Edge Function `evaluar-intento` (docs/SPEC.md §4.2). A diferencia de
// `detectar-items`, un fallo aquí SÍ se propaga: es el resultado que el alumno está
// esperando ver, así que la pantalla de feedback debe poder mostrar un error y
// reintentar, no ignorarlo en silencio.
import type { EvaluacionIntento, PeticionEvaluarIntento } from './tipos';

// 25s se quedaba corto en redes móviles (sobre todo con la función "fría", recién
// invocada tras estar inactiva): el modelo tarda ~12s en una red buena de por sí.
// No es crítico en latencia como conversar/detectar-items — el alumno ya está
// viendo "Calculando tu feedback…", así que aquí conviene más margen que cortar.
const TIMEOUT_MS = 60_000;

export async function llamarEvaluarIntento(peticion: PeticionEvaluarIntento): Promise<EvaluacionIntento> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluar-intento`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(peticion),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error('La evaluación está tardando más de lo normal. Comprueba tu conexión y vuelve a intentarlo.');
    }
    throw e;
  }
  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    throw new Error(`evaluar-intento: HTTP ${res.status} ${texto}`);
  }
  return (await res.json()) as EvaluacionIntento;
}
