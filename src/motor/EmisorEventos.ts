// Emisor de eventos tipado mínimo (sin dependencias) para MotorConversacion.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (...args: any[]) => void;

export class EmisorEventos<Eventos extends Record<string, Callback>> {
  private listeners: { [K in keyof Eventos]?: Set<Eventos[K]> } = {};

  on<K extends keyof Eventos>(evento: K, cb: Eventos[K]): void {
    (this.listeners[evento] ??= new Set()).add(cb);
  }

  off<K extends keyof Eventos>(evento: K, cb: Eventos[K]): void {
    this.listeners[evento]?.delete(cb);
  }

  emit<K extends keyof Eventos>(evento: K, ...args: Parameters<Eventos[K]>): void {
    for (const cb of this.listeners[evento] ?? []) cb(...args);
  }
}
