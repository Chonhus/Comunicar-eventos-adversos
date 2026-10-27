import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { casosConfig, obtenerCaso } from '@/lib/config';
import { useLlamada } from '@/features/llamada/useLlamada';
import AvatarEstatico from '@/features/llamada/AvatarEstatico';
import Subtitulos from '@/features/llamada/Subtitulos';
import Temporizador from '@/features/llamada/Temporizador';
import ChecklistPanel from '@/features/llamada/ChecklistPanel';
import ModoTextoDebug from '@/features/llamada/ModoTextoDebug';
import WebcamLocal from '@/features/llamada/WebcamLocal';
import TranscripcionPlegable from '@/features/llamada/TranscripcionPlegable';

export default function LlamadaPage() {
  const { casoId, intento } = useParams<{ casoId: string; intento: string }>();
  const [params] = useSearchParams();
  const debug = params.get('debug') === '1';
  const navigate = useNavigate();
  const caso = obtenerCaso(casoId ?? '');

  const [silenciado, setSilenciado] = useState(false);
  const [webcamActiva, setWebcamActiva] = useState(true);
  const [confirmandoColgar, setConfirmandoColgar] = useState(false);

  const {
    estado,
    subtitulo,
    transcripcionParcial,
    turnos,
    checklistVersion,
    errorMensaje,
    enviarTexto,
    silenciarMicro,
    obtenerChecklist,
  } = useLlamada(caso, debug);

  function colgar() {
    navigate(`/feedback/${caso.id}-${intento}`);
  }

  function alternarMicro() {
    const nuevo = !silenciado;
    setSilenciado(nuevo);
    silenciarMicro(nuevo);
  }

  return (
    <main className="flex h-screen flex-col bg-slate-950">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <AvatarEstatico caso={caso} estado={estado} />
          <WebcamLocal activa={webcamActiva} />
          <TranscripcionPlegable turnos={turnos} />
          <Subtitulos textoAvatar={subtitulo} transcripcionParcial={debug ? '' : transcripcionParcial} />

          {errorMensaje && (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
              <div className="pointer-events-auto max-w-md rounded-lg bg-red-600/90 px-3 py-2 text-center text-sm text-white shadow-lg">
                {errorMensaje}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
            <Temporizador
              duracionMaximaSeg={casosConfig.duracionMaximaSeg}
              avisoDuracionSeg={casosConfig.avisoDuracionSeg}
              onLimiteAlcanzado={colgar}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWebcamActiva((v) => !v)}
                className="rounded-full bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                title="Mostrar/ocultar tu cámara (solo local, no se envía)"
              >
                📷
              </button>
              <button
                type="button"
                onClick={alternarMicro}
                disabled={debug}
                className={`rounded-full px-4 py-2 text-lg text-white disabled:opacity-30 ${
                  silenciado ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={silenciado ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {silenciado ? '🔇' : '🎤'}
              </button>
              {confirmandoColgar ? (
                <button
                  type="button"
                  onClick={colgar}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white"
                >
                  ¿Seguro? Colgar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoColgar(true)}
                  className="rounded-full bg-red-600/90 px-4 py-2 text-lg text-white hover:bg-red-600"
                  title="Colgar"
                >
                  📞
                </button>
              )}
            </div>
          </div>
        </div>

        <ChecklistPanel key={checklistVersion} checklist={obtenerChecklist()} />
      </div>

      {debug && <ModoTextoDebug onEnviar={enviarTexto} />}
    </main>
  );
}
