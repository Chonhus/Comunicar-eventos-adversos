// docs/SPEC.md §4.1 — estado del checklist en el cliente: solo añade, nunca desmarca,
// y un ítem "parcial" puede pasar a "completo" pero nunca al revés.
export type CalidadItem = 'pendiente' | 'parcial' | 'completo';

export interface EstadoItem {
  calidad: CalidadItem;
  evidencia?: string;
}

export interface EstadoAlerta {
  evidencia: string;
  veces: number;
}

export interface ItemDetectado {
  id: string;
  calidad: 'parcial' | 'completo';
  evidencia: string;
}

export interface AlertaDetectada {
  id: string;
  evidencia: string;
}

export interface ResultadoDeteccion {
  cumplidos: ItemDetectado[];
  alertas: AlertaDetectada[];
}

const RANGO: CalidadItem[] = ['pendiente', 'parcial', 'completo'];

export class ChecklistEngine {
  private items = new Map<string, EstadoItem>();
  private alertas = new Map<string, EstadoAlerta>();

  constructor(idsItems: string[]) {
    for (const id of idsItems) this.items.set(id, { calidad: 'pendiente' });
  }

  aplicarDeteccion(resultado: ResultadoDeteccion): void {
    for (const c of resultado.cumplidos) {
      const actual = this.items.get(c.id);
      if (!actual) continue; // id desconocido: se ignora
      if (RANGO.indexOf(c.calidad) > RANGO.indexOf(actual.calidad)) {
        this.items.set(c.id, { calidad: c.calidad, evidencia: c.evidencia });
      }
    }
    for (const a of resultado.alertas) {
      const previa = this.alertas.get(a.id);
      this.alertas.set(a.id, { evidencia: a.evidencia, veces: (previa?.veces ?? 0) + 1 });
    }
  }

  obtenerItems(): Array<{ id: string } & EstadoItem> {
    return [...this.items.entries()].map(([id, e]) => ({ id, ...e }));
  }

  /** Ids que aún no están "completo" (incluye "parcial": el detector puede subirlos). */
  obtenerPendientes(): string[] {
    return [...this.items.entries()].filter(([, e]) => e.calidad !== 'completo').map(([id]) => id);
  }

  obtenerAlertas(): Array<{ id: string } & EstadoAlerta> {
    return [...this.alertas.entries()].map(([id, e]) => ({ id, ...e }));
  }

  contarCompletos(): number {
    return [...this.items.values()].filter((e) => e.calidad === 'completo').length;
  }
}
