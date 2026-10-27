import { motorConfig } from '@/lib/config';
import { MotorPropio } from './MotorPropio';
import { MotorTexto } from './MotorTexto';
import type { MotorConversacion } from './tipos';

/** `?debug=1` fuerza el motor de texto aunque haya micrófono disponible. */
export function crearMotor(forzarTexto: boolean): MotorConversacion {
  if (forzarTexto || motorConfig.motor !== 'propio') return new MotorTexto(motorConfig);
  return new MotorPropio(motorConfig);
}

export type { EstadoMotor, EventosMotor, MotorConversacion, TurnoHistorial } from './tipos';
