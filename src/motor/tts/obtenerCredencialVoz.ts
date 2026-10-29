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

async function pedirToken(): Promise<CredencialVoz | null> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/token-voz`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as CredencialVoz;
  } catch {
    return null; // red caída, Edge Function en frío, etc.
  }
}

export async function obtenerCredencialVoz(): Promise<{ token: string; region: string } | null> {
  if (cache?.proveedor === 'azure' && cache.expiraEn && cache.expiraEn > Date.now() + 5000) {
    return { token: cache.token!, region: cache.region! };
  }

  let datos = await pedirToken();
  if (datos?.proveedor !== 'azure') {
    // token-voz devuelve { proveedor: 'navegador' } tanto si Azure no está configurado
    // como si hubo un fallo puntual al pedirle el token a Azure (red, arranque en frío
    // de la Edge Function...) — desde aquí se ven igual. Un reintento basta para el
    // caso típico y evita caer a la voz del navegador por algo ya resuelto medio
    // segundo después (bug real reportado: "a veces también habla con la voz del
    // sintetizador [del navegador], aunque normalmente es la nueva voz").
    await new Promise((r) => setTimeout(r, 300));
    datos = await pedirToken();
  }

  if (datos) cache = datos;
  if (!datos || datos.proveedor !== 'azure' || !datos.token || !datos.region) return null;
  return { token: datos.token, region: datos.region };
}
