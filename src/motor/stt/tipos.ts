// docs/MOTOR.md §3 — interfaz ProveedorSTT.
export type EventosSTT = {
  parcial: (texto: string) => void;
  final: (texto: string) => void;
  inicioHabla: () => void;
  finHabla: () => void;
  error: (mensaje: string) => void;
};

export interface ProveedorSTT {
  iniciar(): void;
  detener(): void;
  silenciar(silenciado: boolean): void;
  on<K extends keyof EventosSTT>(evento: K, cb: EventosSTT[K]): void;
}
