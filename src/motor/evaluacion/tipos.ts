// docs/RUBRICA.md §5 — esquema de salida del evaluador final.
export interface ItemEvaluado {
  id: string;
  puntuacion: 0 | 1 | 2;
  evidencia: string;
  comentario: string;
}

export interface AlertaEvaluada {
  id: string;
  evidencia: string;
  comentario: string;
}

export interface Mejora {
  aspecto: string;
  frase_alternativa: string;
}

export interface ValoracionGlobal {
  empatia: number;
  claridad: number;
  honestidad: number;
}

export interface EvaluacionIntento {
  items: ItemEvaluado[];
  alertas: AlertaEvaluada[];
  fortalezas: string[];
  mejoras: Mejora[];
  global: ValoracionGlobal;
  comparacion_intento_anterior: string | null;
  resumen: string;
}

export interface TurnoParaEvaluar {
  rol: 'alumno' | 'avatar';
  texto: string;
}

export interface ItemDetectorParaEvaluar {
  id: string;
  calidad: 'parcial' | 'completo';
  evidencia?: string;
}

export interface AlertaDetectorParaEvaluar {
  id: string;
  evidencia: string;
  veces: number;
}

/** Lo que LlamadaPage pasa a FeedbackPage (vía router state) al colgar — docs/SPEC.md §4.2. */
export interface DatosLlamadaParaFeedback {
  casoId: string;
  intento: number;
  turnos: TurnoParaEvaluar[];
  checklistDetector: {
    cumplidos: ItemDetectorParaEvaluar[];
    alertas: AlertaDetectorParaEvaluar[];
  };
  duracionSeg: number;
  /** Fila de `intentos` en Supabase (F5); null si no se pudo crear o no hay alumno logueado. */
  intentoId: string | null;
}

export interface PeticionEvaluarIntento {
  casoId: string;
  turnos: TurnoParaEvaluar[];
  checklistDetector: {
    cumplidos: ItemDetectorParaEvaluar[];
    alertas: AlertaDetectorParaEvaluar[];
  };
  duracionSeg: number;
  intentoAnterior?: { resumen: string } | null;
}
