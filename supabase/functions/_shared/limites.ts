// Cortafuegos de coste a nivel de Edge Function: independiente de cuánto recorte
// el cliente su propio historial antes de enviarlo (MAX_TURNOS_CONTEXTO en
// MotorBase.ts). Mientras conversar/detectar-items/evaluar-intento acepten
// cualquier petición con la clave anónima (sin comprobar que quien llama es un
// alumno real — ver PROGRESS.md), esto acota el coste máximo de una petición
// manipulada, aunque no sustituye a cerrar ese agujero.
export const MAX_TURNOS_PETICION = 150;
export const MAX_CARACTERES_TURNO = 2000;

interface TurnoConTexto {
  texto: string;
}

/** `null` si la lista de turnos (historial, contexto...) es razonable; si no, el
 * motivo del rechazo, listo para pasar a respuestaError(). */
export function errorSiTurnosExcesivos(turnos: TurnoConTexto[]): string | null {
  if (turnos.length > MAX_TURNOS_PETICION) {
    return `Se han enviado demasiados turnos (${turnos.length}, máximo ${MAX_TURNOS_PETICION}).`;
  }
  const demasiadoLargo = turnos.find((t) => t.texto.length > MAX_CARACTERES_TURNO);
  if (demasiadoLargo) {
    return `Un turno supera el límite de ${MAX_CARACTERES_TURNO} caracteres.`;
  }
  return null;
}
