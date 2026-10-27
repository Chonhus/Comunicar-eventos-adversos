// F5 — acceso del alumno: código de grupo + alias (docs/SPEC.md §3.1, Opción A).
// Por debajo, una sesión anónima de Supabase Auth (`signInAnonymously`) da un
// `auth.uid()` estable con el que las políticas RLS de las migraciones protegen los
// datos de cada alumno, sin pedir email ni contraseña.
import { supabase } from './supabase';

export interface AlumnoActual {
  id: string;
  grupoId: string;
  alias: string;
  rol: 'alumno' | 'docente';
}

const CLAVE_LOCAL = 'alumno-actual-v1';

export async function asegurarSesionAnonima(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;

  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error || !anon.session) {
    throw new Error(`No se pudo iniciar sesión: ${error?.message ?? 'sin sesión'}`);
  }
  return anon.session.user.id;
}

export async function unirseAGrupo(codigo: string, alias: string): Promise<AlumnoActual> {
  const id = await asegurarSesionAnonima();

  const { data: grupo, error: errGrupo } = await supabase
    .from('grupos')
    .select('id')
    .ilike('codigo', codigo.trim())
    .maybeSingle();
  if (errGrupo) throw new Error(`No se pudo comprobar el código de grupo: ${errGrupo.message}`);
  if (!grupo) throw new Error('Ese código de grupo no existe. Compruébalo con tu docente.');

  const { data: alumno, error: errAlumno } = await supabase
    .from('alumnos')
    .upsert({ id, grupo_id: grupo.id, alias: alias.trim() }, { onConflict: 'id' })
    .select('id, grupo_id, alias, rol')
    .single();
  if (errAlumno || !alumno) {
    throw new Error(`No se pudo unir al grupo: ${errAlumno?.message ?? 'sin datos'}`);
  }

  const actual: AlumnoActual = {
    id: alumno.id,
    grupoId: alumno.grupo_id,
    alias: alumno.alias,
    rol: alumno.rol,
  };
  localStorage.setItem(CLAVE_LOCAL, JSON.stringify(actual));
  return actual;
}

export function olvidarAlumnoLocal(): void {
  localStorage.removeItem(CLAVE_LOCAL);
}

export function obtenerAlumnoLocal(): AlumnoActual | null {
  try {
    const crudo = localStorage.getItem(CLAVE_LOCAL);
    return crudo ? (JSON.parse(crudo) as AlumnoActual) : null;
  } catch {
    return null;
  }
}

export async function cerrarSesionAlumno(): Promise<void> {
  olvidarAlumnoLocal();
  await supabase.auth.signOut();
}
