// Tipos TS mínimos para @met4citizen/talkinghead 1.8.2 — no trae tipado propio.
// Verificado contra node_modules/@met4citizen/talkinghead/modules/talkinghead.mjs
// (firmas reales de los métodos que usamos) y su README, no inventado.
declare module '@met4citizen/talkinghead' {
  export interface TalkingHeadOptions {
    modelRoot?: string;
    modelFPS?: number;
    modelPixelRatio?: number;
    cameraView?: 'full' | 'mid' | 'upper' | 'head';
    cameraDistance?: number;
    cameraX?: number;
    cameraY?: number;
    cameraRotateEnable?: boolean;
    cameraPanEnable?: boolean;
    cameraZoomEnable?: boolean;
    lipsyncModules?: string[];
    lipsyncLang?: string;
    avatarMood?: string;
    avatarMute?: boolean;
    [clave: string]: unknown;
  }

  export interface AvatarConfig {
    url: string;
    body?: 'M' | 'F';
    avatarMood?: string;
    lipsyncLang?: string;
    [clave: string]: unknown;
  }

  export interface ViewOpts {
    cameraDistance?: number;
    cameraX?: number;
    cameraY?: number;
    cameraRotateX?: number;
    cameraRotateY?: number;
  }

  /** props: claves "HuesoTalkingHead.rotation" (Euler XYZ radianes) o ".quaternion" o ".position" (metros). */
  export interface PoseTemplate {
    standing?: boolean;
    sitting?: boolean;
    bend?: boolean;
    kneeling?: boolean;
    lying?: boolean;
    props: Record<string, { x: number; y: number; z: number; w?: number }>;
  }

  /** Audio + palabras/visemas en milisegundos, ver docs/MOTOR.md §8. */
  export interface SpeakAudioRequest {
    audio: AudioBuffer | ArrayBuffer[];
    words?: string[];
    wtimes?: number[];
    wdurations?: number[];
    visemes?: string[];
    vtimes?: number[];
    vdurations?: number[];
    markers?: Array<() => void>;
    mtimes?: number[];
  }

  export interface SpeakOpts {
    lipsyncLang?: string;
    isRaw?: boolean;
    [clave: string]: unknown;
  }

  export class TalkingHead {
    constructor(nodo: HTMLElement, opciones?: TalkingHeadOptions);
    poseTemplates: Record<string, PoseTemplate>;
    showAvatar(
      avatar: AvatarConfig,
      onprogress?: ((ev: ProgressEvent) => void) | null,
      onpreprocess?: ((gltf: unknown) => void) | null,
    ): Promise<void>;
    setView(view: 'full' | 'mid' | 'upper' | 'head', opt?: ViewOpts): void;
    setMood(mood: string): void;
    start(): void;
    stop(): void;
    playPose(
      nombreOUrl: string,
      onprogress?: ((ev: ProgressEvent) => void) | null,
      dur?: number,
      ndx?: number,
      scale?: number,
    ): Promise<void>;
    stopPose(): void;
    speakAudio(peticion: SpeakAudioRequest, opt?: SpeakOpts, onsubtitles?: ((palabra: string) => void) | null): void;
    stopSpeaking(): void;
    speakText(
      texto: string,
      opt?: SpeakOpts,
      onsubtitles?: ((palabra: string) => void) | null,
      excludes?: Array<[number, number]>,
    ): void;
    lookAt(x: number, y: number, t: number): void;
    lookAhead(t: number): void;
    lookAtCamera(t: number): void;
    makeEyeContact(t: number): void;
  }
}
