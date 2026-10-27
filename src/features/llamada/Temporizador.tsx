import { useEffect, useRef, useState } from 'react';

function formatear(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, '0');
  const s = (segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Temporizador({
  duracionMaximaSeg,
  avisoDuracionSeg,
  onLimiteAlcanzado,
}: {
  duracionMaximaSeg: number;
  avisoDuracionSeg: number;
  onLimiteAlcanzado: () => void;
}) {
  const [segundos, setSegundos] = useState(0);
  const avisadoRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (segundos >= duracionMaximaSeg) onLimiteAlcanzado();
    if (segundos >= avisoDuracionSeg) avisadoRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundos]);

  const avisando = segundos >= avisoDuracionSeg;

  return (
    <span className={`font-mono text-sm ${avisando ? 'text-amber-300' : 'text-white/90'}`}>
      ● {formatear(segundos)}
    </span>
  );
}
