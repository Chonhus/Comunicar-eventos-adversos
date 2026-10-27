import casosJson from '../../../config/casos.json';
import checklistJson from '../../../config/checklist.json';
import motorJson from '../../../config/motor.json';
import {
  CasosConfigSchema,
  ChecklistConfigSchema,
  MotorConfigSchema,
  type Caso,
} from './schemas';

function cargar<T>(schema: { parse: (v: unknown) => T }, datos: unknown, nombre: string): T {
  try {
    return schema.parse(datos);
  } catch (error) {
    throw new Error(`config/${nombre}.json no cumple el esquema esperado: ${String(error)}`);
  }
}

export const casosConfig = cargar(CasosConfigSchema, casosJson, 'casos');
export const checklistConfig = cargar(ChecklistConfigSchema, checklistJson, 'checklist');
export const motorConfig = cargar(MotorConfigSchema, motorJson, 'motor');

export function obtenerCaso(id: string): Caso {
  const caso = casosConfig.casos.find((c) => c.id === id);
  if (!caso) throw new Error(`No existe el caso "${id}" en config/casos.json`);
  return caso;
}

export function obtenerCasoPorNivel(nivel: number): Caso {
  const caso = casosConfig.casos.find((c) => c.nivel === nivel);
  if (!caso) throw new Error(`No existe ningún caso de nivel ${nivel} en config/casos.json`);
  return caso;
}

export type { Caso, ChecklistItem, Alerta, Emocion, MotorConfig, CasosConfig } from './schemas';
