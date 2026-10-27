// docs/MOTOR.md §8. En F2 (sin avatar 3D) el proveedor reproduce directamente el audio;
// en F3, cuando TalkingHead consuma audio+visemas vía speakAudio(), se revisará esta
// interfaz para separar "sintetizar" de "reproducir" si hace falta.
export interface ReproducirOpts {
  /** Para barge-in: si se aborta, se corta la reproducción en curso. */
  señal?: AbortSignal;
  onInicio?: () => void;
}

export interface ProveedorTTS {
  hablar(frase: string, voz: string, opts?: ReproducirOpts): Promise<void>;
  detener(): void;
}
