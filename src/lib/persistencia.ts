// F5 — escrituras a Supabase (docs/SPEC.md §5), protegidas por las políticas RLS de
// supabase/migrations/. Todas fallan "en silencio" (avisan por consola, no rompen la
// UI): la app ya funciona sin persistencia desde F2-F4 con src/lib/progreso.ts
// (sessionStorage) como caché; esto es la fuente de verdad para el panel docente,
// pero perderla no debe bloquear la práctica del alumno.
import { supabase } from './supabase';
import type { EvaluacionIntento } from '@/motor/evaluacion/tipos';
import type { TurnoVisible } from '@/features/llamada/useLlamada';

export async function guardarProgresoBloque(alumnoId: string, bloque: number, notaTest?: number): Promise<void> {
  const { error } = await supabase
    .from('progreso_formacion')
    .upsert({ alumno_id: alumnoId, bloque, nota_test: notaTest ?? null }, { onConflict: 'alumno_id,bloque' });
  if (error) console.warn('[persistencia] progreso_formacion:', error.message);
}

export async function crearIntento(alumnoId: string, casoId: string, numero: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('intentos')
    .upsert(
      { alumno_id: alumnoId, caso_id: casoId, numero, estado: 'en_curso' },
      { onConflict: 'alumno_id,caso_id,numero' },
    )
    .select('id')
    .single();
  if (error || !data) {
    console.warn('[persistencia] crearIntento:', error?.message);
    return null;
  }
  return data.id as string;
}

export async function finalizarIntento(intentoId: string, duracionSeg: number): Promise<void> {
  const { error } = await supabase
    .from('intentos')
    .update({ fin: new Date().toISOString(), duracion_s: duracionSeg, estado: 'finalizado' })
    .eq('id', intentoId);
  if (error) console.warn('[persistencia] finalizarIntento:', error.message);
}

export async function guardarTurno(intentoId: string, turno: TurnoVisible): Promise<void> {
  const { error } = await supabase.from('turnos').insert({ intento_id: intentoId, rol: turno.rol, texto: turno.texto });
  if (error) console.warn('[persistencia] guardarTurno:', error.message);
}

export async function guardarEventoChecklist(
  intentoId: string,
  evento:
    | { tipo: 'cumplido'; itemId: string; calidad: 'parcial' | 'completo'; evidencia?: string }
    | { tipo: 'alerta'; itemId: string; evidencia: string },
): Promise<void> {
  const { error } = await supabase.from('eventos_checklist').insert({
    intento_id: intentoId,
    item_id: evento.itemId,
    tipo: evento.tipo,
    calidad: evento.tipo === 'cumplido' ? evento.calidad : null,
    evidencia: evento.evidencia ?? null,
  });
  if (error) console.warn('[persistencia] guardarEventoChecklist:', error.message);
}

export async function guardarEvaluacion(
  intentoId: string,
  puntuacion: number,
  detalle: EvaluacionIntento,
  modelo: string,
): Promise<void> {
  const { error } = await supabase
    .from('evaluaciones')
    .upsert({ intento_id: intentoId, puntuacion, detalle, modelo }, { onConflict: 'intento_id' });
  if (error) console.warn('[persistencia] guardarEvaluacion:', error.message);
}

export async function guardarEncuesta(alumnoId: string, respuestas: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('encuestas').insert({ alumno_id: alumnoId, respuestas });
  if (error) console.warn('[persistencia] guardarEncuesta:', error.message);
}
