-- F5 — Persistencia y panel docente (docs/SPEC.md §5).
--
-- Modelo de acceso (ver PROGRESS.md): el ALUMNO entra con código de grupo + alias,
-- autenticado por debajo con `supabase.auth.signInAnonymously()` (sin email ni
-- contraseña) para tener un `auth.uid()` estable con el que proteger sus datos por
-- RLS. El DOCENTE usa email/contraseña real (Supabase Auth normal): necesita poder
-- identificarse de forma estable desde cualquier dispositivo, cosa que una sesión
-- anónima no permite. `alumnos.id` referencia `auth.users.id` en ambos casos.
--
-- No hay UI de alta de grupos ni de "ascender" a alguien a docente (fuera del
-- alcance de F5): se hace a mano con SQL — ver supabase/seed.sql y PROGRESS.md.

create table grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text not null unique,
  creado_en timestamptz not null default now()
);

create table alumnos (
  id uuid primary key references auth.users (id) on delete cascade,
  grupo_id uuid not null references grupos (id),
  alias text not null,
  email text,
  rol text not null default 'alumno' check (rol in ('alumno', 'docente')),
  creado_en timestamptz not null default now()
);

create table progreso_formacion (
  alumno_id uuid not null references alumnos (id) on delete cascade,
  bloque int not null,
  completado_en timestamptz not null default now(),
  nota_test numeric,
  primary key (alumno_id, bloque)
);

create table intentos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references alumnos (id) on delete cascade,
  caso_id text not null,
  numero int not null,
  inicio timestamptz not null default now(),
  fin timestamptz,
  duracion_s int,
  estado text not null default 'en_curso' check (estado in ('en_curso', 'finalizado', 'abandonado')),
  unique (alumno_id, caso_id, numero)
);

create table turnos (
  id bigserial primary key,
  intento_id uuid not null references intentos (id) on delete cascade,
  rol text not null check (rol in ('alumno', 'avatar')),
  texto text not null,
  ts timestamptz not null default now()
);

create table eventos_checklist (
  id bigserial primary key,
  intento_id uuid not null references intentos (id) on delete cascade,
  item_id text not null,
  tipo text not null check (tipo in ('cumplido', 'alerta')),
  calidad text,
  evidencia text,
  ts timestamptz not null default now()
);

create table evaluaciones (
  intento_id uuid primary key references intentos (id) on delete cascade,
  puntuacion int not null,
  detalle jsonb not null,
  modelo text not null,
  creado_en timestamptz not null default now()
);

create table encuestas (
  alumno_id uuid not null references alumnos (id) on delete cascade,
  respuestas jsonb not null,
  creado_en timestamptz not null default now()
);

create index intentos_alumno_id_idx on intentos (alumno_id);
create index turnos_intento_id_idx on turnos (intento_id);
create index eventos_checklist_intento_id_idx on eventos_checklist (intento_id);
create index alumnos_grupo_id_idx on alumnos (grupo_id);

-- Comprueba, sin recursión, si el usuario autenticado es docente del grupo dado.
-- `security definer` para poder leer `alumnos` sin pasar otra vez por sus propias
-- políticas (si no, una política de `alumnos` que llamase a esta función dentro de
-- una subconsulta sobre la propia tabla `alumnos` sería autorreferente).
create or replace function public.es_docente_del_grupo(p_grupo_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from alumnos
    where id = auth.uid() and rol = 'docente' and grupo_id = p_grupo_id
  );
$$;

alter table grupos enable row level security;
alter table alumnos enable row level security;
alter table progreso_formacion enable row level security;
alter table intentos enable row level security;
alter table turnos enable row level security;
alter table eventos_checklist enable row level security;
alter table evaluaciones enable row level security;
alter table encuestas enable row level security;

-- grupos: lectura pública (solo nombre/código, nada sensible) para poder validar
-- el código al unirse, antes de que exista ninguna fila de `alumnos` para ese usuario.
create policy "grupos_select_publico" on grupos
  for select using (true);

-- alumnos: cada cual ve/crea su propia fila; el docente del grupo ve las de su grupo.
create policy "alumnos_select_propio_o_docente" on alumnos
  for select using (auth.uid() = id or es_docente_del_grupo(grupo_id));

create policy "alumnos_insert_propio" on alumnos
  for insert with check (auth.uid() = id);

-- progreso_formacion
create policy "progreso_formacion_todo_propio" on progreso_formacion
  for all using (auth.uid() = alumno_id) with check (auth.uid() = alumno_id);

create policy "progreso_formacion_select_docente" on progreso_formacion
  for select using (
    exists (select 1 from alumnos a where a.id = progreso_formacion.alumno_id and es_docente_del_grupo(a.grupo_id))
  );

-- intentos
create policy "intentos_todo_propio" on intentos
  for all using (auth.uid() = alumno_id) with check (auth.uid() = alumno_id);

create policy "intentos_select_docente" on intentos
  for select using (
    exists (select 1 from alumnos a where a.id = intentos.alumno_id and es_docente_del_grupo(a.grupo_id))
  );

-- turnos (vía el intento, que a su vez pertenece a un alumno)
create policy "turnos_todo_propio" on turnos
  for all using (
    exists (select 1 from intentos i where i.id = turnos.intento_id and i.alumno_id = auth.uid())
  ) with check (
    exists (select 1 from intentos i where i.id = turnos.intento_id and i.alumno_id = auth.uid())
  );

create policy "turnos_select_docente" on turnos
  for select using (
    exists (
      select 1 from intentos i join alumnos a on a.id = i.alumno_id
      where i.id = turnos.intento_id and es_docente_del_grupo(a.grupo_id)
    )
  );

-- eventos_checklist (mismo patrón que turnos)
create policy "eventos_checklist_todo_propio" on eventos_checklist
  for all using (
    exists (select 1 from intentos i where i.id = eventos_checklist.intento_id and i.alumno_id = auth.uid())
  ) with check (
    exists (select 1 from intentos i where i.id = eventos_checklist.intento_id and i.alumno_id = auth.uid())
  );

create policy "eventos_checklist_select_docente" on eventos_checklist
  for select using (
    exists (
      select 1 from intentos i join alumnos a on a.id = i.alumno_id
      where i.id = eventos_checklist.intento_id and es_docente_del_grupo(a.grupo_id)
    )
  );

-- evaluaciones (mismo patrón, vía el intento)
create policy "evaluaciones_todo_propio" on evaluaciones
  for all using (
    exists (select 1 from intentos i where i.id = evaluaciones.intento_id and i.alumno_id = auth.uid())
  ) with check (
    exists (select 1 from intentos i where i.id = evaluaciones.intento_id and i.alumno_id = auth.uid())
  );

create policy "evaluaciones_select_docente" on evaluaciones
  for select using (
    exists (
      select 1 from intentos i join alumnos a on a.id = i.alumno_id
      where i.id = evaluaciones.intento_id and es_docente_del_grupo(a.grupo_id)
    )
  );

-- encuestas
create policy "encuestas_insert_select_propio" on encuestas
  for all using (auth.uid() = alumno_id) with check (auth.uid() = alumno_id);

create policy "encuestas_select_docente" on encuestas
  for select using (
    exists (select 1 from alumnos a where a.id = encuestas.alumno_id and es_docente_del_grupo(a.grupo_id))
  );
