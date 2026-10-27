// F5 — acceso del docente: email/contraseña reales (Supabase Auth), a diferencia del
// alumno (código de grupo + sesión anónima, ver accesoAlumno.ts). El docente necesita
// poder entrar de forma estable desde cualquier dispositivo para ver el panel de su
// grupo, cosa que una sesión anónima no permite.
//
// No hay alta de docentes por la app (fuera de alcance de F5): se crea el usuario en
// Supabase Studio o con supabase.auth.admin.createUser, y se marca su fila en
// `alumnos` con rol = 'docente' a mano — ver supabase/seed.sql y PROGRESS.md.
import { supabase } from './supabase';

export interface DocenteActual {
  id: string;
  grupoId: string;
  alias: string;
}

async function cargarComoDocente(userId: string): Promise<DocenteActual | null> {
  const { data: alumno } = await supabase
    .from('alumnos')
    .select('id, grupo_id, alias, rol')
    .eq('id', userId)
    .maybeSingle();
  if (!alumno || alumno.rol !== 'docente') return null;
  return { id: alumno.id, grupoId: alumno.grupo_id, alias: alumno.alias };
}

export async function iniciarSesionDocente(email: string, password: string): Promise<DocenteActual> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? 'No se pudo iniciar sesión.');

  const docente = await cargarComoDocente(data.session.user.id);
  if (!docente) {
    await supabase.auth.signOut();
    throw new Error('Esta cuenta no tiene permiso de docente.');
  }
  return docente;
}

export async function obtenerDocenteActual(): Promise<DocenteActual | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  return cargarComoDocente(data.session.user.id);
}

export async function cerrarSesionDocente(): Promise<void> {
  await supabase.auth.signOut();
}
