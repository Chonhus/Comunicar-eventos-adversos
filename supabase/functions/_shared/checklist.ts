import checklistData from './data/checklist.json' with { type: 'json' };

export interface ChecklistItem {
  id: string;
  etiqueta: string;
  definicion: string;
}

export interface Alerta {
  id: string;
  etiqueta: string;
  definicion: string;
}

interface ChecklistJson {
  items: ChecklistItem[];
  alertas: Alerta[];
}

// Copia sincronizada de config/checklist.json — ver nota en personajes.ts.
export function cargarChecklist(): ChecklistJson {
  return checklistData as ChecklistJson;
}
