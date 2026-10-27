import casosData from './data/casos.json' with { type: 'json' };

export interface CasoResumen {
  id: string;
  titulo: string;
  avatar: { nombre: string; rol: string };
}

interface CasosJson {
  casos: Array<{ id: string; titulo: string; avatar: { nombre: string; rol: string } }>;
}

const casos = (casosData as CasosJson).casos;

// Copia sincronizada de config/casos.json — ver nota en personajes.ts.
export function cargarCaso(casoId: string): CasoResumen {
  const caso = casos.find((c) => c.id === casoId);
  if (!caso) throw new Error(`casoId desconocido: ${casoId}`);
  return caso;
}
