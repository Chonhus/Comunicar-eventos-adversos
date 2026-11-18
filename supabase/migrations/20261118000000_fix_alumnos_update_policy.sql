-- Corrige el alta de alumnos: unirseAGrupo() (src/lib/accesoAlumno.ts) hace un
-- upsert sobre `alumnos` con onConflict:'id', que Postgres traduce en
-- `INSERT ... ON CONFLICT (id) DO UPDATE`. La migración F5 solo creó políticas de
-- select e insert para `alumnos` — nunca se había probado contra un Supabase real
-- (ver PROGRESS.md, F5 "pendiente"). Sin política de update, Postgres deniega esa
-- rama con "new row violates row-level security policy (USING expression)",
-- reportado por un alumno real al intentar unirse a un grupo.
create policy "alumnos_update_propio" on alumnos
  for update using (auth.uid() = id) with check (auth.uid() = id);
