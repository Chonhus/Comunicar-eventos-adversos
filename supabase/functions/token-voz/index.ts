// Edge Function `token-voz` — docs/MOTOR.md §11.
// Emite un token temporal de Azure Speech (STT/TTS) cuando hay AZURE_SPEECH_KEY configurada.
// Si no hay clave (caso por defecto mientras `config/casos.json` tenga "voz": "PENDIENTE"),
// responde { proveedor: "navegador" } para que el cliente use el respaldo sin tratarlo como error
// (ver docs/SPEC.md §10 F2: "si aún no hay clave, speechSynthesis del navegador como provisional").
import { corsHeaders, respuestaOpciones } from '../_shared/cors.ts';

const TOKEN_TTL_MS = 9 * 60 * 1000; // Azure emite tokens de 10 min; renovamos antes.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return respuestaOpciones();

  const clave = Deno.env.get('AZURE_SPEECH_KEY');
  const region = Deno.env.get('AZURE_SPEECH_REGION') ?? 'westeurope';

  if (!clave) {
    return new Response(JSON.stringify({ proveedor: 'navegador' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': clave } },
    );
    if (!res.ok) throw new Error(`Azure STS ${res.status}: ${await res.text()}`);
    const token = await res.text();
    return new Response(
      JSON.stringify({ proveedor: 'azure', token, region, expiraEn: Date.now() + TOKEN_TTL_MS }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    // La clave está mal configurada: no bloqueamos la llamada, el cliente cae al respaldo.
    console.error('[token-voz] error emitiendo token de Azure:', e);
    return new Response(JSON.stringify({ proveedor: 'navegador' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
