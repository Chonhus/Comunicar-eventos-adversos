// Estado del alumno entre pantallas mientras no hay persistencia en Supabase (F5):
// sessionStorage (con un respaldo en memoria si no está disponible — SSR, tests, o un
// navegador que lo bloquee) para los resultados de cada intento y la nota del mini-test
// de formación. Se pierde al cerrar la pestaña: es una limitación conocida y documentada
// en PROGRESS.md, no un error.
import type { EvaluacionIntento } from '@/motor/evaluacion/tipos';

export interface ResultadoIntento {
  casoId: string;
  intento: number;
  puntuacion: number;
  evaluacion: EvaluacionIntento;
  duracionSeg: number;
  fecha: number;
}

interface ProgresoAlmacenado {
  intentos: ResultadoIntento[];
  notaFormacion: number | null;
}

const CLAVE = 'progreso-intentos-v1';
const VACIO: ProgresoAlmacenado = { intentos: [], notaFormacion: null };

interface AlmacenSimple {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

const almacenMemoria = new Map<string, string>();
const respaldoEnMemoria: AlmacenSimple = {
  getItem: (clave) => almacenMemoria.get(clave) ?? null,
  setItem: (clave, valor) => {
    almacenMemoria.set(clave, valor);
  },
};

function obtenerAlmacen(): AlmacenSimple {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
  } catch {
    // sessionStorage puede lanzar en contextos restringidos (p. ej. ciertos iframes).
  }
  return respaldoEnMemoria;
}

function leer(): ProgresoAlmacenado {
  const crudo = obtenerAlmacen().getItem(CLAVE);
  if (!crudo) return { ...VACIO, intentos: [] };
  try {
    const datos = JSON.parse(crudo) as Partial<ProgresoAlmacenado>;
    return { intentos: Array.isArray(datos.intentos) ? datos.intentos : [], notaFormacion: datos.notaFormacion ?? null };
  } catch {
    return { ...VACIO, intentos: [] };
  }
}

function escribir(datos: ProgresoAlmacenado): void {
  obtenerAlmacen().setItem(CLAVE, JSON.stringify(datos));
}

/** Guarda el resultado de un intento; si ya existía uno para el mismo caso+intento, lo reemplaza. */
export function guardarResultadoIntento(resultado: ResultadoIntento): void {
  const datos = leer();
  const sinElAnterior = datos.intentos.filter(
    (r) => !(r.casoId === resultado.casoId && r.intento === resultado.intento),
  );
  escribir({ ...datos, intentos: [...sinElAnterior, resultado] });
}

export function obtenerResultadosDeCaso(casoId: string): ResultadoIntento[] {
  return leer()
    .intentos.filter((r) => r.casoId === casoId)
    .sort((a, b) => a.intento - b.intento);
}

export function obtenerUltimoResultado(casoId: string): ResultadoIntento | null {
  const resultados = obtenerResultadosDeCaso(casoId);
  return resultados.length > 0 ? resultados[resultados.length - 1] : null;
}

export function obtenerTodosLosResultados(): ResultadoIntento[] {
  return [...leer().intentos].sort((a, b) => a.fecha - b.fecha);
}

export function guardarNotaFormacion(nota: number): void {
  escribir({ ...leer(), notaFormacion: nota });
}

export function obtenerNotaFormacion(): number | null {
  return leer().notaFormacion;
}

export function limpiarProgreso(): void {
  escribir({ ...VACIO, intentos: [] });
}
