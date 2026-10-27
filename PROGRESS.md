# PROGRESS

## F0 — Andamiaje ✅

**Qué se hizo**
- Proyecto Vite 8 + React 19 + TypeScript 7 + Tailwind CSS 4 (`@tailwindcss/vite`, sin `tailwind.config.js`, import único `@import "tailwindcss";` en `src/index.css`).
- `react-router-dom` 7 con rutas de las 7 pantallas de `docs/SPEC.md §3` (la mayoría placeholder, se rellenan en fases siguientes): `/`, `/consentimiento`, `/formacion`, `/briefing/:casoId`, `/llamada/:casoId/:intento`, `/feedback/:intentoId`, `/evaluacion-final`.
- Cliente de Supabase en `src/lib/supabase.ts` (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; avisa en consola si faltan, no revienta el arranque).
- Carga y validación de `config/casos.json`, `config/checklist.json` y `config/motor.json` con esquemas Zod en `src/lib/config/` (falla rápido y con mensaje claro si algún JSON no cumple el esquema). 6 tests unitarios (Vitest) cubren la carga y `obtenerCaso`/`obtenerCasoPorNivel`.
- `.env.example` con las variables de cliente (`VITE_*`) y de servidor (Edge Functions: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AZURE_SPEECH_KEY`...), separadas para que quede explícito qué nunca debe llevar prefijo `VITE_`.
- Estructura de carpetas de `docs/SPEC.md §7`: `src/app/paginas`, `src/lib`, (siguientes fases añadirán `src/features`, `src/motor`, `supabase/functions`).
- Dos correcciones a la documentación tras revisar las APIs reales (ver respuesta de análisis previo): `docs/AVATARES.md` (TalkingHead no tiene `setPoseFromTemplate`, es `playPose`) y `docs/MOTOR.md` (formato real del evento `visemeReceived` de Azure, y mapeo de emociones a moods de TalkingHead). No afecta a F0–F2.

**Cómo probarlo**
```
npm install
cp .env.example .env   # de momento no hace falta rellenar nada para F0
npm run dev            # http://localhost:5173
npm run build           # tsc -b && vite build
npm run test             # vitest run
```
Verificado con Playwright: `/` carga, el botón "Empezar" navega a `/consentimiento`, sin errores de consola. Build de producción y suite de tests en verde.

**Decisiones tomadas**
- TypeScript 7 / Vite 8 / Tailwind 4 / React 19: son las versiones `latest` reales en npm a fecha de hoy; con TS 7 cambia la config de `paths` (ya no existe `baseUrl`, hay que usar rutas relativas dentro de `paths`) y `vite.config.ts` usa `import.meta.dirname` (Node ≥20.11) en vez de `__dirname`.
- `supabase` CLI se usará vía `npx supabase` (local, con Docker) para `functions serve` en F2; no se requiere un proyecto Supabase en la nube para desarrollar F0–F2.
- Excluido `scripts/avatares/` del escaneo de dependencias de Vite (`optimizeDeps.entries`): esos scripts Python/HTML de generación de avatares no son parte de la app.

**Pendiente**
- Nada bloqueante para F1. `npm run validar-avatares` queda como script placeholder (`tsx scripts/validar-avatares.ts`, aún no implementado) hasta F3.
