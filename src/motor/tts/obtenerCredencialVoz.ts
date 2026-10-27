// Cliente del Edge Function `token-voz` (docs/MOTOR.md §11). Devuelve null cuando no hay
// Azure configurado (AZURE_SPEECH_KEY ausente) para que el llamante caiga al respaldo del
// navegador, tal como prevé docs/SPEC.md §10 (F2).
interface CredencialVoz {
  proveedor: 'azure' | 'navegador';
  token?: string;
  region?: string;
  expiraEn?: number;
}

let cache: CredencialVoz | null = null;

export async function obtenerCredencialVoz(): Promise<{ token: string; region: string } | null> {
  if (cache?.proveedor === 'azure' && cache.expiraEn && cache.expiraEn > Date.now() + 5000) {
    return { token: cache.token!, region: cache.region! };
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/token-voz`;
  const res = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;

  const datos = (await res.json()) as CredencialVoz;
  cache = datos;
  if (datos.proveedor !== 'azure' || !datos.token || !datos.region) return null;
  return { token: datos.token, region: datos.region };
}
