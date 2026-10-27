// Webcam del alumno: solo local (nunca se envía ni se graba) — docs/SPEC.md §3.5.
import { useEffect, useRef, useState } from 'react';

export default function WebcamLocal({ activa }: { activa: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [disponible, setDisponible] = useState(true);

  useEffect(() => {
    if (!activa) return;
    let stream: MediaStream | null = null;
    let cancelado = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        if (cancelado) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setDisponible(false));

    return () => {
      cancelado = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [activa]);

  if (!activa || !disponible) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="absolute bottom-4 right-4 h-24 w-32 rounded-lg border-2 border-white/80 object-cover shadow-lg md:h-28 md:w-40"
    />
  );
}
