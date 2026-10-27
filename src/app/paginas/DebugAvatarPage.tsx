// docs/AVATARES.md §6 — /debug/avatar?caso=n1_paracetamol: probar el GLB, las
// emociones, el lip sync (TTS real) y ajustar el encuadre de cámara.
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TalkingHead } from '@met4citizen/talkinghead';
import { casosConfig, obtenerCaso } from '@/lib/config';
import type { Emocion } from '@/lib/config/schemas';
import AvatarTalkingHead from '@/features/llamada/AvatarTalkingHead';
import { crearProveedorTTS } from '@/motor/tts';

const EMOCIONES: Emocion[] = ['neutral', 'preocupado', 'enfadado', 'triste', 'aliviado'];
const VISTAS = ['full', 'mid', 'upper', 'head'] as const;

export default function DebugAvatarPage() {
  const [params] = useSearchParams();
  const casoId = params.get('caso') ?? casosConfig.casos[0].id;
  const caso = obtenerCaso(casoId);

  const [emocion, setEmocion] = useState<Emocion>(caso.emocionInicial);
  const [texto, setTexto] = useState(caso.fraseApertura);
  const [hablando, setHablando] = useState(false);
  const [vista, setVista] = useState<(typeof VISTAS)[number]>(caso.avatar.camara.vista as (typeof VISTAS)[number]);
  const [cameraDistance, setCameraDistance] = useState(caso.avatar.camara.cameraDistance);
  const [cameraY, setCameraY] = useState(caso.avatar.camara.cameraY);

  const headRef = useRef<TalkingHead | null>(null);
  const ttsRef = useRef(crearProveedorTTS());

  function aplicarCamara(v: typeof vista, dist: number, y: number) {
    setVista(v);
    setCameraDistance(dist);
    setCameraY(y);
    headRef.current?.setView(v, { cameraDistance: dist, cameraY: y });
  }

  async function hablar() {
    if (!texto.trim() || hablando) return;
    setHablando(true);
    try {
      await ttsRef.current.hablar(texto, caso.voz);
    } catch (e) {
      console.error('[debug/avatar] error en TTS:', e);
    } finally {
      setHablando(false);
    }
  }

  return (
    <main className="flex h-screen flex-col gap-4 bg-slate-950 p-4 text-white md:flex-row">
      <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl">
        <AvatarTalkingHead
          caso={caso}
          estado={hablando ? 'hablando' : 'escuchando'}
          emocion={emocion}
          onListo={(head) => {
            headRef.current = head;
          }}
        />
      </div>

      <div className="flex w-full flex-col gap-6 md:w-80">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/70">Caso</h2>
          <p className="text-sm">
            {caso.avatar.nombre} ({caso.id})
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/70">Emoción</h2>
          <div className="flex flex-wrap gap-2">
            {EMOCIONES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmocion(e)}
                className={`rounded-full px-3 py-1 text-xs ${
                  emocion === e ? 'bg-orange-500' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/70">Lip sync (TTS real)</h2>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/10 p-2 text-sm"
            placeholder="Texto a decir…"
          />
          <button
            type="button"
            onClick={() => void hablar()}
            disabled={hablando}
            className="mt-2 w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            {hablando ? 'Hablando…' : 'Hablar'}
          </button>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-white/70">Cámara (copiar a config/casos.json)</h2>
          <label className="mb-1 block text-xs text-white/60">Vista</label>
          <select
            value={vista}
            onChange={(e) => aplicarCamara(e.target.value as typeof vista, cameraDistance, cameraY)}
            className="mb-3 w-full rounded-lg bg-white/10 p-2 text-sm"
          >
            {VISTAS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-xs text-white/60">cameraDistance: {cameraDistance.toFixed(2)}</label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={cameraDistance}
            onChange={(e) => aplicarCamara(vista, Number(e.target.value), cameraY)}
            className="mb-3 w-full"
          />

          <label className="mb-1 block text-xs text-white/60">cameraY: {cameraY.toFixed(2)}</label>
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.01}
            value={cameraY}
            onChange={(e) => aplicarCamara(vista, cameraDistance, Number(e.target.value))}
            className="mb-3 w-full"
          />

          <pre className="rounded-lg bg-black/40 p-2 text-xs">
            {JSON.stringify({ vista, cameraDistance, cameraY }, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}
