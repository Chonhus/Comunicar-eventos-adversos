// Interfaz común del motor de conversación — docs/MOTOR.md §2.
import type { Caso, Emocion } from '@/lib/config/schemas';
import type { ChecklistEngine, ResultadoDeteccion } from '@/features/llamada/ChecklistEngine';

export type EstadoMotor = 'conectando' | 'escuchando' | 'pensando' | 'hablando' | 'error';

export interface TurnoAlumnoEvento {
  texto: string;
  ts: number;
}

export interface TextoAvatarEvento {
  texto: string;
  final: boolean;
}

export interface MetricasEvento {
  sttMs: number | null;
  primerTokenMs: number | null;
  primerAudioMs: number | null;
}

export type EventosMotor = {
  transcripcionParcial: (texto: string) => void;
  turnoAlumno: (t: TurnoAlumnoEvento) => void;
  textoAvatar: (t: TextoAvatarEvento) => void;
  estado: (e: EstadoMotor) => void;
  emocion: (e: Emocion) => void;
  metricas: (m: MetricasEvento) => void;
  // F5: lleva el resultado para poder persistir eventos_checklist (docs/SPEC.md §5)
  // además de re-renderizar el panel.
  checklistActualizado: (resultado: ResultadoDeteccion) => void;
};

export interface MotorConversacion {
  iniciar(caso: Caso): Promise<void>;
  detener(): Promise<void>;
  enviarTexto(texto: string): void;
  silenciarMicro(silenciado: boolean): void;
  obtenerChecklist(): ChecklistEngine;
  on<K extends keyof EventosMotor>(evento: K, cb: EventosMotor[K]): void;
  off<K extends keyof EventosMotor>(evento: K, cb: EventosMotor[K]): void;
}

export interface TurnoHistorial {
  rol: 'alumno' | 'avatar';
  texto: string;
}
