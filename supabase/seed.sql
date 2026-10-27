-- Datos de ejemplo para desarrollo local (`supabase db reset` lo ejecuta tras las
-- migraciones). Un grupo de prueba para poder probar el flujo de acceso del alumno
-- (código de grupo + alias) sin tener que crear uno a mano en Studio.
insert into grupos (nombre, codigo) values
  ('Grupo de pruebas', 'DEMO2026');

-- Dar de alta un DOCENTE (no hay UI de alta en la app — ver PROGRESS.md "F5"):
--
-- 1. Crear el usuario en Supabase Studio > Authentication > Users > Add user
--    (local: http://127.0.0.1:54323/project/default/auth/users), con email y
--    contraseña. O, por script, con la service role key:
--      const { data } = await supabaseAdmin.auth.admin.createUser({
--        email: 'docente@ejemplo.com', password: '...', email_confirm: true,
--      });
--
-- 2. Anotar el `id` (uuid) del usuario creado y ejecutar, sustituyendo los valores:
--      insert into alumnos (id, grupo_id, alias, email, rol) values
--        ('<uuid del usuario de auth.users>',
--         (select id from grupos where codigo = 'DEMO2026'),
--         'Nombre del docente', 'docente@ejemplo.com', 'docente');
