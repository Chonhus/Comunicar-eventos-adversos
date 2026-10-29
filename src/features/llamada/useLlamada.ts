import { useCallback, useEffect, useRef, useState } from 'react';
import { crearMotor } from '@/motor';
import type { Caso, Emocion } from '@/lib/config/schemas';
import type { EstadoMotor, MetricasEvento } from '@/motor';
import { obtenerAlumnoLocal } from '@/lib/accesoAlumno';
import { crearIntento, guardarEventoChecklist, guardarTurno } from '@/lib/persistencia';
import type { ChecklistEngine, ResultadoDeteccion } from './ChecklistEngine';

export interface TurnoVisible {
  rol: 'alumno' | 'avatar';
  texto: string;
}

export function useLlamada(caso: Caso, debug: boolean, numeroIntento: number) {
  const motorRef = useRef(crearMotor(debug));
  const [estado, setEstado] = useState<EstadoMotor>('conectando');
  const [emocion, setEmocion] = useState<Emocion>(caso.emocionInicial);
  const [subtitulo, setSubtitulo] = useState('');
  const [transcripcionParcial, setTranscripcionParcial] = useState('');
  const [turnos, setTurnos] = useState<TurnoVisible[]>([]);
  const [checklistVersion, setChecklistVersion] = useState(0);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  // docs/CLAUDE.md: "Latencia... Medir y mostrar tiempos en modo debug". Solo se usa
  // si debug=true (ver LlamadaPage), pero se escucha siempre: es barato y mantiene un
  // único sitio donde se cablea el evento 'metricas' del motor.
  const [metricas, setMetricas] = useState<MetricasEvento | null>(null);
  // F5: si el alumno entró con código de grupo, se persiste en Supabase (docs/SPEC.md
  // §5); si no (p. ej. ?debug=1 suelto, sin pasar por /acceso), la llamada funciona
  // igual que en F2-F4, solo que sin guardar nada.
  const [intentoId, setIntentoId] = useState<string | null>(null);
  const intentoIdRef = useRef<string | null>(null);
  // Silencio pedido por el alumno (botón 🔇), aparte del silencio automático al pasar
  // la pestaña/app a segundo plano (ver más abajo) — se combinan en aplicarSilencio(),
  // para que volver de segundo plano no desaga un silencio que el alumno sí pidió.
  const silenciadoManualRef = useRef(false);

  useEffect(() => {
    const motor = motorRef.current;
    const alumno = obtenerAlumnoLocal();

    // El micrófono no se corta solo al minimizar: dependíamos de que el propio
    // navegador/sistema operativo pausara la captura en segundo plano, que es lo
    // habitual pero no algo que controlemos ni esté garantizado (varía por
    // navegador/versión). Con algo tan sensible como "¿me está escuchando?" no basta
    // con confiar en eso: se silencia explícitamente en cuanto la pestaña deja de
    // estar visible, y se restaura el estado que tuviera el alumno al volver.
    const aplicarSilencio = () => motor.silenciarMicro(silenciadoManualRef.current || document.hidden);
    document.addEventListener('visibilitychange', aplicarSilencio);

    if (alumno) {
      crearIntento(alumno.id, caso.id, numeroIntento).then((id) => {
        intentoIdRef.current = id;
        setIntentoId(id);
      });
    }

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
        if (intentoIdRef.current) void guardarTurno(intentoIdRef.current, { rol: 'avatar', texto: t.texto });
      }
    };
    const onTurnoAlumno = (t: { texto: string }) => {
      setTurnos((prev) => [...prev, { rol: 'alumno', texto: t.texto }]);
      setTranscripcionParcial('');
      setSubtitulo('');
      if (intentoIdRef.current) void guardarTurno(intentoIdRef.current, { rol: 'alumno', texto: t.texto });
    };
    const onParcial = (t: string) => setTranscripcionParcial(t);
    const onMetricas = (m: MetricasEvento) => setMetricas(m);
    const onChecklist = (resultado: ResultadoDeteccion) => {
      setChecklistVersion((v) => v + 1);
      const id = intentoIdRef.current;
      if (!id) return;
      for (const c of resultado.cumplidos) {
        void guardarEventoChecklist(id, { tipo: 'cumplido', itemId: c.id, calidad: c.calidad, evidencia: c.evidencia });
      }
      for (const a of resultado.alertas) {
        void guardarEventoChecklist(id, { tipo: 'alerta', itemId: a.id, evidencia: a.evidencia });
      }
    };

    motor.on('estado', onEstado);
    motor.on('emocion', onEmocion);
    motor.on('textoAvatar', onTextoAvatar);
    motor.on('turnoAlumno', onTurnoAlumno);
    motor.on('transcripcionParcial', onParcial);
    motor.on('checklistActualizado', onChecklist);
    motor.on('metricas', onMetricas);

    motor.iniciar(caso).catch((e: Error) => {
      setErrorMensaje(e.message);
      setEstado('error');
    });

    return () => {
      document.removeEventListener('visibilitychange', aplicarSilencio);
      motor.off('estado', onEstado);
      motor.off('emocion', onEmocion);
      motor.off('textoAvatar', onTextoAvatar);
      motor.off('turnoAlumno', onTurnoAlumno);
      motor.off('transcripcionParcial', onParcial);
      motor.off('checklistActualizado', onChecklist);
      motor.off('metricas', onMetricas);
      void motor.detener();
    };
    // Un único motor por montaje de la pantalla de llamada (caso e idDebug no cambian en caliente).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviarTexto = useCallback((texto: string) => motorRef.current.enviarTexto(texto), []);
  const silenciarMicro = useCallback((s: boolean) => {
    silenciadoManualRef.current = s;
    motorRef.current.silenciarMicro(s || document.hidden);
  }, []);
  const obtenerChecklist = useCallback((): ChecklistEngine => motorRef.current.obtenerChecklist(), []);

  return {
    estado,
    emocion,
    subtitulo,
    transcripcionParcial,
    turnos,
    checklistVersion,
    errorMensaje,
    intentoId,
    metricas,
    enviarTexto,
    silenciarMicro,
    obtenerChecklist,
  };
}
