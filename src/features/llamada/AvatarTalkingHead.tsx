// F3 — avatar 3D real con TalkingHead (docs/AVATARES.md, docs/MOTOR.md §9).
// Si WebGL no está disponible o el GLB no carga, cae a AvatarEstatico (imagen de
// respaldo) sin romper la llamada — docs/AVATARES.md §5.
import { useEffect, useRef, useState } from 'react';
import { TalkingHead } from '@met4citizen/talkinghead';
import type { Caso } from '@/lib/config/schemas';
import type { EstadoMotor } from '@/motor';
import type { Emocion } from '@/lib/config/schemas';
import { posesConfig } from '@/lib/config';
import { emocionAMood } from '@/motor/avatar/mapaEmociones';
import { registrarAvatarActivo, type ReproductorAvatar } from '@/motor/avatar/reproductorAvatar';
import { rutaPublica } from '@/lib/rutaPublica';
import AvatarEstatico from './AvatarEstatico';

const ETIQUETA_ESTADO: Record<EstadoMotor, string> = {
  conectando: 'Conectando…',
  escuchando: 'Escuchando…',
  pensando: 'Pensando…',
  hablando: 'Hablando…',
  error: 'Ha habido un problema',
};

// TalkingHead replica la pose en los nombres que usa para alternar al azar
// según el mood (docs/AVATARES.md §1, verificado en animMoods del paquete).
const NOMBRES_POSE_ALTERNATIVA = ['side', 'hip', 'straight', 'wide', 'turn'];

/** Adapta TalkingHead.speakAudio() (callback-based) a la interfaz ReproductorAvatar
 * (basada en promesas) que usa el TTS — ver src/motor/avatar/reproductorAvatar.ts. */
function crearReproductor(head: TalkingHead): ReproductorAvatar {
  return {
    hablar(audio, visemas, palabras, opts) {
      return new Promise((resolve) => {
        let resuelto = false;
        let temporizador: ReturnType<typeof setTimeout> | null = null;
        const terminar = () => {
          if (resuelto) return;
          resuelto = true;
          if (temporizador) clearTimeout(temporizador);
          resolve();
        };

        const duracionMs = audio.duration * 1000;
        // speakAudio solo procesa visemas/marcadores si `words` no está vacío
        // (verificado en el código fuente de @met4citizen/talkinghead): si no hay
        // palabras (p.ej. la heurística de respaldo no detectó ninguna), se manda
        // una palabra "muda" que ocupe todo el audio solo para destrabar ese camino.
        const palabrasFinal = palabras.length > 0 ? palabras : [{ palabra: ' ', inicioMs: 0, durMs: duracionMs }];

        head.speakAudio({
          audio,
          words: palabrasFinal.map((p) => p.palabra),
          wtimes: palabrasFinal.map((p) => p.inicioMs),
          wdurations: palabrasFinal.map((p) => p.durMs),
          visemes: visemas.map((v) => v.visema),
          vtimes: visemas.map((v) => v.inicioMs),
          vdurations: visemas.map((v) => v.durMs),
          markers: [terminar],
          mtimes: [duracionMs],
        });

        // Red de seguridad: si el marcador no llega (p.ej. cola interrumpida por un
        // error interno), no se deja la llamada colgada esperando la promesa.
        temporizador = setTimeout(terminar, duracionMs + 2000);

        opts?.señal?.addEventListener('abort', () => { head.stopSpeaking(); terminar(); }, { once: true });
      });
    },
    detener() {
      head.stopSpeaking();
    },
  };
}

function hayWebGL(): boolean {
  try {
    const lienzo = document.createElement('canvas');
    return !!(lienzo.getContext('webgl2') || lienzo.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function AvatarTalkingHead({
  caso,
  estado,
  emocion,
  onListo,
}: {
  caso: Caso;
  estado: EstadoMotor;
  emocion: Emocion;
  /** Para la página /debug/avatar: acceso directo a la instancia para probar cámara/pose. */
  onListo?: (head: TalkingHead) => void;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<TalkingHead | null>(null);
  const [fallback, setFallback] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (!hayWebGL()) {
      setFallback(true);
      return;
    }
    const nodo = contenedorRef.current;
    if (!nodo) return;

    let cancelado = false;
    const head = new TalkingHead(nodo, {
      cameraView: caso.avatar.camara.vista as 'full' | 'mid' | 'upper' | 'head',
      cameraDistance: caso.avatar.camara.cameraDistance,
      cameraY: caso.avatar.camara.cameraY,
      avatarMood: emocionAMood(caso.emocionInicial),
      cameraRotateEnable: false,
      cameraPanEnable: false,
      cameraZoomEnable: false,
      // Ninguno de los idiomas integrados (en/fi/lt/de/fr/pt_br) incluye español
      // (docs/AVATARES.md §4): los visemas los damos nosotros (Azure o heurística
      // propia), así que no hace falta cargar estos módulos. Además, sin esto,
      // el import() dinámico que hacen falla en el dev server de Vite y cuelga
      // la carga del avatar.
      lipsyncModules: [],
    });
    headRef.current = head;

    head
      .showAvatar({ url: rutaPublica(caso.avatar.glb), body: caso.avatar.body })
      .then(() => {
        if (cancelado) return;

        const plantilla = posesConfig[caso.avatar.pose];
        if (plantilla) {
          head.poseTemplates['cruzados'] = plantilla;
          for (const nombre of NOMBRES_POSE_ALTERNATIVA) head.poseTemplates[nombre] = plantilla;
        }
        // Que no descruce los brazos al hablar (docs/AVATARES.md §1).
        (head as unknown as { speakWithHands: () => void }).speakWithHands = () => {};

        head.start();
        head.playPose('cruzados').catch(() => {
          /* la pose de reposo por defecto es un fallback aceptable visualmente */
        });
        setCargado(true);
        onListo?.(head);
      })
      .catch((e) => {
        console.warn('[avatar] no se pudo cargar el GLB, usando imagen de respaldo:', e);
        if (!cancelado) setFallback(true);
      });

    return () => {
      cancelado = true;
      head.stop();
      headRef.current = null;
      if (nodo) nodo.replaceChildren();
    };
    // Un único TalkingHead por caso (no se espera que caso cambie en caliente).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caso.id]);

  useEffect(() => {
    if (!cargado || !headRef.current) return;
    registrarAvatarActivo(crearReproductor(headRef.current));
    return () => registrarAvatarActivo(null);
  }, [cargado]);

  useEffect(() => {
    if (!cargado || !headRef.current) return;
    try {
      headRef.current.setMood(emocionAMood(emocion));
    } catch (e) {
      console.warn('[avatar] mood desconocido:', e);
    }
  }, [emocion, cargado]);

  useEffect(() => {
    if (!cargado || !headRef.current) return;
    const head = headRef.current;
    if (estado === 'escuchando') head.lookAtCamera(2000);
    else if (estado === 'pensando') head.lookAt(innerWidth * 0.3, innerHeight * 0.4, 1500);
  }, [estado, cargado]);

  if (fallback) return <AvatarEstatico caso={caso} estado={estado} />;

  return (
    <div
      className="relative h-full w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${rutaPublica(caso.avatar.fondo)})` }}
    >
      <div ref={contenedorRef} className="h-full w-full" />
      {!cargado && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-sm text-white">
          Cargando avatar…
        </div>
      )}
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
        {estado === 'hablando' && <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />}
        {ETIQUETA_ESTADO[estado]}
      </div>
    </div>
  );
}
