// Hechos de referencia para el evaluador (docs/CASOS.md): lo que realmente pasó y lo
// que sería una buena comunicación. SOLO los usa evaluar-intento; nunca se envían al
// cliente ni se incluyen en el prompt del personaje (ver personajes.ts/construirSystemPrompt).
// Import estático por el mismo motivo que personajes.ts: el bundler de Edge Functions
// solo empaqueta lo que está en el grafo de módulos estático.
import n1Paracetamol from './data/hechos-referencia/n1_paracetamol.json' with { type: 'json' };
import n2CaidaFractura from './data/hechos-referencia/n2_caida_fractura.json' with { type: 'json' };

interface HechosReferencia {
  hechos: string;
}

const HECHOS: Record<string, HechosReferencia> = {
  n1_paracetamol: n1Paracetamol,
  n2_caida_fractura: n2CaidaFractura,
};

export function cargarHechosReferencia(casoId: string): string {
  const entrada = HECHOS[casoId];
  if (!entrada) throw new Error(`No hay hechos de referencia para casoId: ${casoId}`);
  return entrada.hechos;
}
