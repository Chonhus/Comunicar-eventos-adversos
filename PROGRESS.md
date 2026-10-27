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

## F1 — Módulo formativo ✅

**Qué se hizo**
- `src/features/formacion/contenido.ts`: los 5 bloques y las 5 preguntas del mini-test de `docs/FORMACION.md`, tipados (`tipos.ts`).
- `FormacionPage` reescrita: tarjeta por bloque (`TarjetaBloque`) con barra de progreso, navegación Anterior/Siguiente, soporte de **negrita** vía un parser mínimo (`TextoConEnfasis`, sin `dangerouslySetInnerHTML` ni dependencia MDX).
- `MiniTest`: una pregunta a la vez, feedback inmediato (verde/rojo) al elegir, nota final sobre 10.
- Al terminar el test se muestra la nota y un botón "Continuar al Nivel 1" que navega a `/briefing/:casoId` usando `obtenerCasoPorNivel(1)` (ya no es el placeholder de F0).
- Tests: `contenido.test.ts` (5 bloques, 5 preguntas, cada pregunta con exactamente una opción correcta).

**Cómo probarlo**
```
npm run dev   # ir a /formacion, pasar los 5 bloques, responder el mini-test
npm run test
npm run build
```
Verificado con Playwright: recorrido completo de los 5 bloques → mini-test → nota (comprobado que 5/5 correctas da 10/10) → navegación a `/briefing/n1_paracetamol` con el título y avatar reales del caso. Sin errores de consola.

**Decisiones tomadas**
- La nota del mini-test se calcula y se muestra en cliente, pero **no se persiste todavía** (no hay tabla `progreso_formacion` ni Edge Function en F0–F2; la persistencia es F5 según `docs/SPEC.md §10`). Queda anotado como pendiente.
- Mini-test secuencial (una pregunta por pantalla) en vez de las 5 a la vez, para dar el feedback inmediato que pide `docs/SPEC.md §3.3` sin complicar el estado.
- Markdown reducido a `**negrita**` con un parser propio de 10 líneas en vez de añadir una dependencia MDX, ya que el contenido de `docs/FORMACION.md` no usa más que eso.

**Pendiente**
- Persistir `progreso_formacion` (bloque completado, nota del test) cuando se aborde F5.
- Revisión de contenido por el equipo docente (el propio `docs/FORMACION.md` se marca como borrador).

## F2 — Conversación por voz sin avatar 3D ✅

**Qué se hizo**

*Edge Functions* (`supabase/functions/`, Deno):
- `conversar`: construye el prompt del personaje (plantilla de `docs/MOTOR.md §6` + `config/personajes/*.json`, nuevo — datos de personaje separados de los hechos de referencia del evaluador, que no se tocan en F2) y llama a Claude con `stream: true`, prompt caching en el system prompt. Reemite un SSE propio (`event: delta|fin|error`) para no acoplar el cliente al formato de Anthropic.
- `detectar-items`: prompt y esquema exactos de `docs/RUBRICA.md §4`; filtra ids desconocidos contra `config/checklist.json`; reintenta una vez si el JSON no parsea.
- `token-voz`: token temporal STS de Azure si hay `AZURE_SPEECH_KEY`; si no, `{proveedor:"navegador"}` para que el cliente use el respaldo (sin tratarlo como error).
- **Hallazgo importante de infraestructura:** el runtime de Edge Functions (local *y* en la nube) solo empaqueta lo que está en el grafo de módulos estático de `supabase/functions/`; un `Deno.readTextFile` a `../../../config/*.json` en tiempo de ejecución compila pero **falla en el contenedor** (ruta no encontrada) porque esos archivos nunca se copian. Solución: `scripts/sync-config-edge.mjs` (`npm run sync:config`) copia `config/casos.json`, `config/checklist.json` y `config/personajes/*.json` a `supabase/functions/_shared/data/`, que se importan con `import x from './data/y.json' with { type: 'json' }` (import estático: solo así el compilador de Supabase los incluye). `npm run functions:serve` ya encadena `sync:config` antes de `supabase functions serve`. La copia se versiona (no está en `.gitignore`): hay que repetir `npm run sync:config` tras editar la config de origen, antes de desplegar.

*Motor* (`src/motor/`): `FraseBuffer` (trocea el streaming en frases, respeta abreviaturas "Dr.", "Sra.", "p. ej."), `maquinaTurnos` (ESCUCHANDO/PENSANDO/HABLANDO, barge-in), `ExtractorEmocion` (saca la etiqueta `[emocion]` aunque llegue partida entre chunks), `EmisorEventos` (emisor tipado sin dependencias). `stt/WebSpeechSTT` (Web Speech API, se reinicia sola si el navegador corta la sesión). `tts/`: `NavegadorTTS` (`speechSynthesis`), `AzureTTS` (REST + token de `token-voz`, sin visemas todavía: eso es F3), `TTSConRespaldo` (si Azure falla o no hay clave, cae a `NavegadorTTS` sin romper la llamada). `MotorBase`/`MotorPropio`/`MotorTexto`: turno → `conversar` (streaming) → `FraseBuffer` → cola de TTS secuencial, en paralelo `detectar-items`; `MotorTexto` comparte toda la lógica y solo cambia cómo llega el turno (sin STT), para el modo debug.

*Checklist* (`src/features/llamada/ChecklistEngine.ts`): nunca desmarca, "parcial" puede subir a "completo" pero no al revés, ids desconocidos se ignoran, alertas se acumulan contando repeticiones.

*UI* (`src/features/llamada/`, `LlamadaPage`): layout de videollamada de `docs/SPEC.md §3.5` — imagen estática del personaje sobre su fondo (el avatar 3D es F3) con indicador de estado, subtítulos, webcam local (nunca se envía), cronómetro con aviso y colgado automático al límite, checklist en vivo con alertas en ámbar, transcripción completa plegable, modo texto tras `?debug=1` (`ModoTextoDebug`, sustituye al STT).

**Cómo probarlo**

Hacen falta tres procesos en paralelo (y Docker para Supabase local):
```
npx supabase start            # Postgres/Auth/Storage locales (una vez; deja URLs y claves)
npm run functions:serve       # sync:config + Edge Functions (conversar, detectar-items, token-voz)
npm run dev                   # Vite, http://localhost:5173
```
`.env` ya apunta al Supabase local (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` son las claves de desarrollo local estándar de Supabase, no un secreto real). **Falta `ANTHROPIC_API_KEY`**: sin ella, `conversar`/`detectar-items` devuelven un error claro ("Falta el secreto ANTHROPIC_API_KEY") y la UI muestra un aviso genérico sin bloquear la app. Para probar con Claude de verdad: `ANTHROPIC_API_KEY=sk-ant-... npm run functions:serve` (o `npx supabase secrets set ANTHROPIC_API_KEY=...`).

Verificado con Playwright, en dos rondas:
1. **Camino feliz** (con un servidor que simula el formato real de `conversar`/`detectar-items`, para no depender de una clave real): `/briefing/n1_paracetamol?debug=1` → "Iniciar llamada" → escribir un turno en modo debug → el ítem *Se presenta* se marca ✔ en verde, la etiqueta `[emocion]` no aparece en el subtítulo (se extrae correctamente), el estado pasa ESCUCHANDO→PENSANDO→HABLANDO→ESCUCHANDO, un segundo turno marca *Lamenta lo sucedido* sin desmarcar el primero, la transcripción plegable muestra ambos turnos.
2. **Camino de error real** (Edge Functions locales reales, sin `ANTHROPIC_API_KEY`): la función responde el error correcto, la UI muestra un aviso genérico sin romperse.

En esta ronda encontré y corregí 3 bugs de interfaz antes de darla por buena: (a) el subtítulo del avatar se borraba en cuanto terminaba el streaming de texto, antes de que terminara de sonar el audio; (b) el aviso de error y el botón de "Ver transcripción" compartían la misma esquina (`top-4 left-4`) y se solapaban; (c) el contenedor transparente del aviso de error ocupaba todo el ancho y bloqueaba los clics de los botones que tenía detrás aunque no se viera nada ahí (le faltaba `pointer-events-none`).

`npm run build`, `npm run test` (35 tests) y `npm run dev` en verde.

**Decisiones tomadas**
- `config/personajes/*.json`: nuevo, no estaba en la spec original como archivo — `docs/CASOS.md` ya sugería "o en `config/personajes/*.md`"; se usó JSON porque lo lee tanto la Edge Function como (potencialmente) el cliente, sin parsear Markdown en el servidor. Los *hechos de referencia* del evaluador (que nunca deben llegar al personaje) se quedan solo en `docs/CASOS.md` hasta F4.
- TTS en F2 reproduce el audio directamente (no separa "sintetizar" de "reproducir" como en la interfaz completa de `docs/MOTOR.md §8`) porque todavía no hay avatar 3D que consuma audio+visemas vía `speakAudio`. Se revisará en F3.
- Sin persistencia en Supabase todavía (ni `turnos` ni `intentos`): la conversación vive en memoria del cliente durante la llamada, tal como corresponde a F2 (la persistencia es F5).
- No hay Supabase Auth: las tres Edge Functions tienen `verify_jwt = false` en `supabase/config.toml`, anotado para revisar cuando se aborde login/RLS.
- El motor de texto (`MotorTexto`) no es solo para tests: es el modo `?debug=1` que pide `CLAUDE.md`, y comparte el 100% de la lógica de `conversar`/`detectar-items`/TTS con `MotorPropio`; solo cambia cómo llega el turno del alumno.

**Pendiente / no verificado en vivo**
- **`ANTHROPIC_API_KEY` real**: todo el pipeline está verificado estructuralmente (SSE, FraseBuffer, checklist, máquina de turnos, manejo de errores) pero la conversación real con Claude necesita que se configure la clave — es el paso que falta para la prueba que pedía el mensaje inicial ("que yo pruebe a hablar con el personaje").
- **Azure STT/TTS**: implementados contra la API REST real documentada (STS token, `visemeReceived` aclarado en `docs/MOTOR.md`), pero sin clave de Azure no se ha podido probar en vivo; con clave, revisar sobre todo la región y el nombre exacto de las voces (`config/casos.json` las tiene como `"PENDIENTE"`).
- `speechSynthesis` del navegador falla en Chromium headless (sin motor de voz instalado) — es una limitación del entorno de pruebas, no de la app; debería funcionar en un Chrome/Edge de escritorio normal, pero no se ha podido confirmar con audio real en esta sesión.
- Barge-in (interrumpir al avatar hablando) está implementado (`bargeInMinPalabras`) pero no se ha podido probar con micrófono real en este entorno.
- F3 (avatar 3D): pendiente integrar TalkingHead, `npm run validar-avatares`, mapeo de visemas Azure→Oculus y de emociones a moods.
