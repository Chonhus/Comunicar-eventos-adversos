import { useCallback, useEffect, useRef, useState } from 'react';
import { crearMotor } from '@/motor';
import type { Caso, Emocion } from '@/lib/config/schemas';
import type { EstadoMotor } from '@/motor';
import type { ChecklistEngine } from './ChecklistEngine';

export interface TurnoVisible {
  rol: 'alumno' | 'avatar';
  texto: string;
}

export function useLlamada(caso: Caso, debug: boolean) {
  const motorRef = useRef(crearMotor(debug));
  const [estado, setEstado] = useState<EstadoMotor>('conectando');
  const [emocion, setEmocion] = useState<Emocion>(caso.emocionInicial);
  const [subtitulo, setSubtitulo] = useState('');
  const [transcripcionParcial, setTranscripcionParcial] = useState('');
  const [turnos, setTurnos] = useState<TurnoVisible[]>([]);
  const [checklistVersion, setChecklistVersion] = useState(0);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  useEffect(() => {
    const motor = motorRef.current;

    const onEstado = (e: EstadoMotor) => {
      setEstado(e);
      if (e === 'error') {
        // Detalle técnico (p. ej. secretos sin configurar) solo en consola: al alumno
        // se le muestra un mensaje genérico, y puede intentarlo de nuevo.
        setErrorMensaje('No se ha podido obtener respuesta. Puedes intentarlo de nuevo.');
      } else {
        setErrorMensaje(null);
      }
    };
    const onEmocion = (e: Emocion) => setEmocion(e);
    const onTextoAvatar = (t: { texto: string; final: boolean }) => {
      // El subtítulo se queda visible (como un pie de videollamada) hasta que el alumno
      // empiece un turno nuevo: el texto puede seguir sonando (cola de TTS) después de
      // que termine de llegar el stream, así que no se borra en "final".
      setSubtitulo(t.texto);
      if (t.final) {
        setTurnos((prev) => [...prev, { rol: 'avatar', texto: t.texto }]);
      }
    };
    const onTurnoAlumno = (t: { texto: string }) => {
      setTurnos((prev) => [...prev, { rol: 'alumno', texto: t.texto }]);
      setTranscripcionParcial('');
      setSubtitulo('');
    };
    const onParcial = (t: string) => setTranscripcionParcial(t);
    const onChecklist = () => setChecklistVersion((v) => v + 1);

    motor.on('estado', onEstado);
    motor.on('emocion', onEmocion);
    motor.on('textoAvatar', onTextoAvatar);
    motor.on('turnoAlumno', onTurnoAlumno);
    motor.on('transcripcionParcial', onParcial);
    motor.on('checklistActualizado', onChecklist);

    motor.iniciar(caso).catch((e: Error) => {
      setErrorMensaje(e.message);
      setEstado('error');
    });

    return () => {
      motor.off('estado', onEstado);
      motor.off('emocion', onEmocion);
      motor.off('textoAvatar', onTextoAvatar);
      motor.off('turnoAlumno', onTurnoAlumno);
      motor.off('transcripcionParcial', onParcial);
      motor.off('checklistActualizado', onChecklist);
      void motor.detener();
    };
    // Un único motor por montaje de la pantalla de llamada (caso e idDebug no cambian en caliente).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviarTexto = useCallback((texto: string) => motorRef.current.enviarTexto(texto), []);
  const silenciarMicro = useCallback((s: boolean) => motorRef.current.silenciarMicro(s), []);
  const obtenerChecklist = useCallback((): ChecklistEngine => motorRef.current.obtenerChecklist(), []);

  return {
    estado,
    emocion,
    subtitulo,
    transcripcionParcial,
    turnos,
    checklistVersion,
    errorMensaje,
    enviarTexto,
    silenciarMicro,
    obtenerChecklist,
  };
}
