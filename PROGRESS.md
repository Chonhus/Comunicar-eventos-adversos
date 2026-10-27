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

## F3 — Avatar 3D ✅

**Qué se hizo**

*Dependencias nuevas*: `@met4citizen/talkinghead` (1.8.2, trae `three@0.186.1`) y `microsoft-cognitiveservices-speech-sdk` (1.53.0) como runtime; `@gltf-transform/core` + `@gltf-transform/extensions` como dev-dependency para `validar-avatares`.

*Avatar 3D* (`src/features/llamada/AvatarTalkingHead.tsx`): carga el GLB real con `showAvatar({url, body})`, aplica la pose de brazos cruzados de `config/poses.json` vía `playPose()` (confirmado en el código fuente del paquete: `setPoseFromTemplate` sí existe, pero `playPose(nombre)` —que lee de `poseTemplates`— es la forma pública correcta, tal como ya decía `docs/AVATARES.md`), fija la cámara (`setView`) y el mood inicial. Si WebGL no está disponible o el GLB no carga, cae a `AvatarEstatico` (la imagen de F2) sin romper la llamada. Verificado con Playwright + Chromium software-rendering (swiftshader): el avatar se renderiza correctamente con la pose, ropa y fondo de cada caso.
- **Hallazgo**: `lipsyncModules` por defecto (`en`, `fi`, `lt`) hacen un `import()` dinámico interno que el dev server de Vite no resuelve bien y cuelga la carga del avatar. Como ninguno de esos idiomas es español de todas formas (nunca íbamos a usarlos — pilotamos los visemas nosotros), la solución es pasar `lipsyncModules: []`.

*Emociones y visemas* (`src/motor/avatar/`):
- `mapaEmociones.ts`: las 5 etiquetas del personaje → los 8 moods reales de TalkingHead (`neutral, happy, angry, sad, fear, disgust, love, sleep`, verificados en `animMoods` del paquete). Decisión: `preocupado→fear`, `aliviado→happy` (no hay mapeo "oficial"; `docs/MOTOR.md` ya anticipaba esta decisión).
- `mapaVisemas.ts`: Viseme ID de Azure (0-21) → visema Oculus. **Tabla reconstruida de memoria**, no verificable en vivo (esta red no tiene acceso a `learn.microsoft.com` ni `docs.azure.cn`) ni con audio real (sin `AZURE_SPEECH_KEY`). Marcada explícitamente en el código como pendiente de verificar.
- `construirVisemas.ts`: convierte eventos crudos de Azure (`visemeId` + `audioOffset` en ticks) a segmentos con duración, calculada como la diferencia con el siguiente `audioOffset` (el último se extiende hasta el final del audio) — tal como describe `docs/MOTOR.md §8`.
- `heuristicaVisemasEs.ts`: respaldo propio palabra→visema para español (reglas grafema→fonema: vocales, dígrafos `ch/ll/rr/qu/gu+e,i`, `h` muda, agrupación de consonantes alineada con los grupos de Azure) para cuando no hay visemas reales (sin Azure, o con `speechSynthesis` del navegador).

*TTS* (`src/motor/tts/AzureTTS.ts`, reescrito): antes usaba el endpoint REST crudo de Azure (sin visemas); ahora usa el **Speech SDK real** (`SpeechConfig.fromAuthorizationToken` + `SpeechSynthesizer` con `audioConfig: null` para no reproducir por los altavoces del propio SDK), suscrito a `visemeReceived` y `wordBoundary`, pidiendo `Riff24Khz16BitMonoPcm` y decodificando con `AudioContext.decodeAudioData` para obtener un `AudioBuffer`. Verificado leyendo los `.d.ts` reales del SDK instalado (no la documentación web, inalcanzable desde esta red): nombres de propiedades de los eventos, firma de `speakSsmlAsync`, etc.
- Puente avatar↔TTS (`src/motor/avatar/reproductorAvatar.ts`): un registro módulo-a-módulo (`registrarAvatarActivo`/`obtenerAvatarActivo`) que `AvatarTalkingHead` rellena al cargar. `AzureTTS` entrega el audio+visemas+palabras a `head.speakAudio()` (con lip sync) si hay avatar activo, o los reproduce él mismo con Web Audio API si no (p. ej. en tests sin avatar). **Hallazgo del código fuente de TalkingHead**: `speakAudio()` solo procesa visemas/marcadores si `words` no está vacío (están anidados dentro de `if (r.words)`); si no hay palabras se manda una palabra "muda" que ocupe todo el audio solo para destrabar ese camino.
- `NavegadorTTS` (el respaldo de `speechSynthesis`) no se ha tocado: sigue reproduciendo directamente, sin lip sync, tal como prevé `docs/AVATARES.md §5` ("si faltan visemas → avatar sin lip sync").
- `MotorBase`/`MotorPropio`/`MotorTexto` **no se han tocado**: `ProveedorTTS.hablar()` mantiene la misma firma, todo el cableado nuevo vive dentro de `AzureTTS` y el registro de avatar.

*Validación y herramientas de depuración*:
- `scripts/validar-avatares.ts` (antes placeholder): usa `@gltf-transform/core` + `@gltf-transform/extensions` (hace falta registrar `EXT_texture_webp`, si no el loader rechaza los GLB) para comprobar huesos, morph targets obligatorios/recomendados, triángulos, tamaño de textura y tamaño de archivo. Corrido contra los dos GLB reales: **67 morph targets, ~42.000 triángulos, texturas 1024px, sin errores** — coincide con lo que documenta `docs/AVATARES.md`.
- `/debug/avatar?caso=<id>`: botones de emoción, campo de texto que llama al pipeline real de TTS (mismo camino que la llamada real, así que sirve para probar el lip sync real en cuanto haya `AZURE_SPEECH_KEY`), y sliders de cámara con la vista JSON lista para copiar a `config/casos.json`.
- `/creditos`: atribución de los fondos CC BY-SA (obligación de la licencia), enlazada desde la pantalla de inicio.

**Cómo probarlo**
```
npm run dev              # ir a /llamada/n1_paracetamol/1?debug=1 (avatar 3D real)
                          # o /debug/avatar?caso=n2_caida_fractura (emociones, cámara, TTS)
npm run validar-avatares
npm run test              # 50 tests
npm run build
```
Verificado con Playwright (Chromium + swiftshader, sin GPU real): el avatar carga, aplica pose/ropa/fondo correctos, cambia de mood al pulsar los botones de emoción, y el pipeline de audio no rompe nada aunque no haya `AZURE_SPEECH_KEY` (cae correctamente al respaldo ya existente de F2).

**Decisiones tomadas**
- `lipsyncModules: []` en las opciones de TalkingHead (ver más arriba).
- `preocupado→fear`, `aliviado→happy` para el mapeo de moods.
- Mantener `ProveedorTTS.hablar()` con la misma firma (sin tocar `MotorBase`): el reparto audio+visemas↔avatar vive en un registro aparte (`reproductorAvatar.ts`), para minimizar el riesgo de tocar la máquina de turnos ya verificada en F2.
- `v→PP` (no `FF`) en la heurística de respaldo en español: en español la v suena como b (betacismo), más cercana a la forma bilabial de PP que a la labiodental de FF.

**Pendiente / no verificado en vivo**
- **Tabla `mapaVisemas.ts` (Azure 0-21 → Oculus)**: reconstruida de memoria, sin poder consultar la documentación oficial en vivo desde esta red ni probarla con audio real de Azure. Antes de confiar en ella en producción: verificar contra `learn.microsoft.com/.../how-to-speech-synthesis-viseme` o, mejor, observar visualmente el lip sync en `/debug/avatar` en cuanto haya `AZURE_SPEECH_KEY`.
- **Lip sync con Azure real**: todo el pipeline (SDK, eventos, decodificación de audio, `speakAudio`) está verificado contra los tipos reales del SDK instalado y probado estructuralmente (no revienta sin clave), pero no se ha podido ver ni oír un lip sync real todavía — falta la clave de Azure.
- **Barge-in con el avatar hablando de verdad**: `stopSpeaking()` está cableado (`ReproductorAvatar.detener()`), pero no se ha podido probar interrumpiendo audio real en curso.
- **Tamaño del bundle**: con TalkingHead + three.js + el Speech SDK, el JS de producción pasa de ~350 KB a ~430 KB gzip (más el decoder Draco, ~150 KB gzip, que ni siquiera usamos activamente). Candidato claro a `React.lazy()` / `import()` dinámico en la ruta `/llamada` y `/debug/avatar`, para no pagar ese peso en las pantallas previas (inicio, formación, briefing). No se ha hecho en esta fase para no añadir riesgo de última hora.
- `voz` en `config/casos.json` sigue siendo el placeholder `"PENDIENTE (voz neural es-ES...)"`: hay que elegir nombres reales de voz de Azure (p. ej. `es-ES-AlvaroNeural`) antes de poder probar el TTS de verdad.

## F4 — Evaluación ✅

**Qué se hizo**

*Hechos de referencia* (`config/hechos-referencia/*.json`, nuevo): lo que realmente pasó en cada caso y qué sería una buena comunicación (texto de `docs/CASOS.md`). Sincronizado a `supabase/functions/_shared/data/` igual que `personajes/*.json`; cargado por `_shared/hechosReferencia.ts`, usado **solo** por `evaluar-intento` — nunca llega al cliente ni al prompt del personaje.

*Edge Function `evaluar-intento`* (`supabase/functions/evaluar-intento/`): prompt y esquema exactos de `docs/RUBRICA.md §5` (`claude-sonnet-5-5`), con reintento si el JSON no parsea y filtrado de ids desconocidos contra `config/checklist.json` (mismo patrón que `detectar-items`). Se extrajo `extraerJson` a `_shared/extraerJson.ts` para no duplicarlo entre las dos funciones.
- **Bug real encontrado y corregido** (verificado contra la API real, no es una suposición): `_shared/anthropic.ts` mandaba `thinking:{type:"disabled"}` a **todos** los modelos (arreglo de F2 para `claude-haiku-5-5`). `claude-sonnet-5-5` rechaza ese valor — su mensaje de error explica que ese modelo no "piensa" salvo entre llamadas a herramientas (que aquí no usamos) y que para desactivarlo hay que mandar `{type:"between_tools"}`. No hay un valor único válido para ambos modelos; ahora `thinkingParaModelo(modelo)` decide según el nombre del modelo.
- Confirmado también que `claude-sonnet-5-5` rechaza `temperature` igual que `haiku` (salvo el valor por defecto, 1): se dejó de pasar `temperature: 0.2` como decía `docs/RUBRICA.md` y se usa el valor por defecto de `_shared/anthropic.ts`.
- Probado end-to-end contra la API real con una transcripción de ejemplo: evaluación de calidad real en ~12s (dentro del objetivo de `docs/SPEC.md §9`, "<20s"), citando correctamente datos de los hechos de referencia (p. ej. "1 g", "4 gramos en 24 horas") que el personaje nunca mencionó — confirma que el aislamiento hechos-de-referencia↔personaje funciona.

*Cliente* (`src/motor/evaluacion/`): `llamarEvaluarIntento.ts` (timeout 25s, sin red de seguridad "ignorar y seguir" como `detectar-items` — aquí el fallo se propaga porque es el resultado que el alumno está esperando ver) y `calcularPuntuacion.ts`: la fórmula de `docs/RUBRICA.md §3` **la calcula el código, no el modelo**, a partir de `items`/`alertas` que devuelve el evaluador y los pesos ya validados de `config/checklist.json` (con test unitario).

*Estado entre pantallas sin persistencia todavía* (`src/lib/progreso.ts`, nuevo): como F5 (Supabase) no está hecho, se usa `sessionStorage` (con un respaldo en memoria si no está disponible, para que sea testeable sin jsdom) para guardar el resultado de cada intento y la nota del mini-test de F1 — que antes no se guardaba en ningún sitio.

*Pantallas*:
- `LlamadaPage`: al colgar, captura duración real (con un `useRef` al inicio, no depende de `Temporizador`), la transcripción y el estado del checklist, y los pasa a `FeedbackPage` por `navigate(..., {state})` (no hay backend todavía que los guarde).
- `FeedbackPage` (antes placeholder): llama a `evaluar-intento`, con estados de carga/error/listo; puntuación global y por ítem (coloreado), alertas, fortalezas, mejoras con frase alternativa, comparación con el intento anterior (si lo hay), valoración global, botones "Repetir (intento 2)" / "Pasar al siguiente nivel" o "Ver evaluación final" en el último nivel.
  - **Bug real encontrado y corregido**: bucle infinito de renders (`Maximum update depth exceeded`) porque `partes` (casoId + número de intento, parseados de la URL) se recalculaba como un objeto nuevo en cada render y era dependencia de un `useEffect`; solucionado con `useMemo`.
- `BriefingPage`: bloquea el Nivel 2 hasta que `progreso.ts` tenga un intento del Nivel 1 con la puntuación mínima de `config/casos.json` (`requisitoDesbloqueo`); probado con y sin progreso guardado.
- `EvaluacionFinalPage` (antes placeholder): resumen de los 4 intentos agrupados por nivel, nota de formación, y descarga en PDF con `jsPDF` (`src/lib/exportarPdf.ts`) — probado de verdad con Playwright (el PDF se descarga y no está vacío).

**Cómo probarlo**
```
npm run dev
# /formacion -> mini-test -> Nivel 1 -> llamada (?debug=1) -> colgar -> feedback
# "Pasar al siguiente nivel" -> Nivel 2 ya desbloqueado -> ... -> /evaluacion-final -> Descargar PDF
npm run test    # 63 tests
npm run build
```
Verificado con Playwright, interceptando solo la respuesta de `evaluar-intento` (con un JSON real de una prueba contra la API, no inventado) porque no hay Supabase local en este entorno: flujo completo de llamada → colgar → feedback con puntuación calculada correctamente (verificado a mano contra la fórmula) → "Pasar al siguiente nivel" → Nivel 2 desbloqueado sin recargar. Also probado el bloqueo de Nivel 2 sin progreso previo.

**Decisiones tomadas**
- Sin tabla `intentos`/`turnos`/`evaluaciones` en Supabase todavía (eso es F5): el estado entre pantallas vive en `sessionStorage` vía `src/lib/progreso.ts`. Se pierde al cerrar la pestaña — limitación conocida, no un error.
- La puntuación final se calcula en el **cliente** (`calcularPuntuacion.ts`), no en la Edge Function: ya tiene cargados y validados con Zod los pesos de `config/checklist.json`, así que no hace falta duplicar esa lógica en el Edge Function ni mandar los pesos en cada petición.
- "Repetir intento" navega directo a `/llamada/:casoId/2` (no vuelve a pasar por el briefing): coherente con el diagrama de flujo de `docs/SPEC.md §2`.
- PDF con `jsPDF` (no `@react-pdf/renderer`, la otra opción que sugería `docs/SPEC.md §3.7`): más ligero y con una API más simple para un documento basado en texto como este.

**Pendiente / no verificado en vivo**
- Evaluación real con conversaciones de voz de verdad (con avatar y micrófono reales): el pipeline está verificado con una transcripción de ejemplo real contra la API, pero no con una sesión completa de voz.
- F5 (persistencia Supabase + panel docente): pendiente — en cuanto se aborde, hay que migrar `src/lib/progreso.ts` a leer/escribir en Supabase en vez de `sessionStorage` (la interfaz pública del módulo puede quedarse igual).
- El bundle de producción sigue creciendo (ahora con `jspdf`, que trae `html2canvas` de transitiva aunque no la usamos para nada: nuestro PDF es solo texto). Sigue pendiente el `code-splitting` ya anotado en F3.

## F5 — Persistencia y panel docente ⚠️ no probado contra una base de datos real

**Importante antes de leer esto:** este entorno no tiene Docker funcionando (el
daemon no arranca en este sandbox), así que **no se ha podido levantar un Supabase
local ni probar nada de esta fase contra una base de datos real** — ni las
migraciones, ni las políticas RLS, ni el flujo de acceso, ni el panel docente. Es la
primera fase del proyecto sin verificación en vivo (F2–F4 sí se probaron contra la
API de Anthropic real). Todo lo de abajo está escrito con cuidado contra patrones
estándar de Postgres/Supabase (no son APIs exóticas), pero hay que correr
`npx supabase start && supabase db reset` y probarlo de verdad en cuanto se pueda,
antes de dar la fase por buena de verdad.

**Qué se hizo**

*Modelo de acceso* (decisión tomada con el usuario, docs/SPEC.md §3.1 dejaba dos
opciones abiertas): el **alumno** entra con **código de grupo + alias** (sin email ni
contraseña), autenticado por debajo con `supabase.auth.signInAnonymously()` para
tener un `auth.uid()` estable con el que las políticas RLS protegen sus datos. El
**docente** usa **email + contraseña** (Supabase Auth normal): necesita identificarse
de forma estable desde cualquier dispositivo, cosa que una sesión anónima no permite.
`alumnos.id` referencia `auth.users.id` en los dos casos — la misma tabla distingue
el rol (`alumno` | `docente`).

*Migraciones* (`supabase/migrations/20261027120000_f5_persistencia.sql`): las 7 tablas
de `docs/SPEC.md §5` (grupos, alumnos, progreso_formacion, intentos, turnos,
eventos_checklist, evaluaciones, encuestas) con RLS en todas. Para evitar la
recursión típica de "el docente lee las filas de su grupo" (una política de
`alumnos` que necesita leer la propia tabla `alumnos` para saber si eres docente), se
usa una función `es_docente_del_grupo(grupo_id)` con `security definer` — el patrón
recomendado por Supabase para este caso exacto. `supabase/seed.sql` crea un grupo de
prueba (`DEMO2026`) y documenta cómo dar de alta un docente a mano (no hay UI para
esto, es decisión explícita de alcance).

*Acceso*:
- `src/lib/accesoAlumno.ts`: sesión anónima + unirse a un grupo por código (`ilike`
  para que no importen mayúsculas/minúsculas) + alias; guarda el resultado en
  `localStorage` para no volver a pedirlo en visitas siguientes.
- `src/lib/accesoDocente.ts`: login con email/contraseña + comprobación de que la
  fila de `alumnos` tiene `rol = 'docente'` (si no, cierra la sesión y avisa).
- `AccesoPage.tsx` (nueva, antes de Consentimiento) y `DocenteLoginPage.tsx` (nueva).
- **Bug real encontrado y corregido, independiente de F5**: `src/lib/supabase.ts`
  llamaba a `createClient(url ?? '', anonKey ?? '')`, y la librería **revienta** si
  la clave es una cadena vacía (no solo "falsy" — lanza `supabaseKey is required`
  de forma síncrona al cargar el módulo). Nadie lo había notado porque F2-F4 llaman
  a las Edge Functions con `fetch` directo, nunca con el cliente de `supabase-js`:
  `accesoAlumno.ts` es el primer código que de verdad lo usa, y expuso el bug
  (pantalla en blanco). Arreglado con un valor de relleno no vacío cuando falta la
  configuración, igual que el resto de la app (falla la llamada de red real, no el
  arranque del módulo).

*Persistencia* (`src/lib/persistencia.ts`, todas las funciones fallan "en silencio"
con un `console.warn`, sin romper la UI — la app sigue funcionando sin backend como
en F2-F4 si el alumno no ha entrado con código de grupo, o si Supabase no responde):
- `progreso_formacion`: una fila por bloque del módulo formativo + la nota del
  mini-test (wiring en `FormacionPage`).
- `intentos`: se crea al empezar la llamada (`useLlamada`, con `upsert` por
  `(alumno_id, caso_id, numero)` para que sea idempotente), se cierra al colgar
  (`fin`, `duracion_s`, `estado`).
- `turnos` y `eventos_checklist`: en vivo, turno a turno y detección a detección.
  Para poder persistir los eventos de checklist individuales (antes el evento
  `checklistActualizado` del motor no llevaba el detalle, solo avisaba "algo
  cambió"), se amplió `EventosMotor.checklistActualizado` para que lleve el
  `ResultadoDeteccion` completo — cambio pequeño y localizado en `motor/tipos.ts` y
  `MotorBase.ts`, sin tocar la lógica de turnos ya probada en F2.
- `evaluaciones`: al recibir el resultado de `evaluar-intento` (`FeedbackPage`).
- `encuestas`: encuesta de satisfacción opcional (3 preguntas Likert + 1 abierta,
  `docs/SPEC.md §3.7`) en `EvaluacionFinalPage`, solo visible si hay alumno logueado.

*Panel docente* (`DocentePanelPage.tsx`, nueva): tabla de alumnos del grupo con nº de
intentos y última puntuación; lista de intentos (clicable) con transcripción y
resumen de la evaluación; botón "Exportar CSV" (`src/lib/csv.ts`, sin librería, con
test unitario del escapado). Las consultas no filtran por grupo explícitamente en el
cliente — las políticas RLS ya limitan lo que un docente puede leer.

**Cómo probarlo** (en cuanto haya Docker o un proyecto en la nube)
```
npx supabase start
supabase db reset   # aplica migraciones + seed.sql
npm run dev
# /acceso con el código DEMO2026 -> flujo normal del alumno
# Dar de alta un docente (ver supabase/seed.sql) -> /docente/login -> /docente
```
En esta sesión solo se ha podido comprobar, con Playwright y sin backend real: que
`/acceso`, `/docente/login` y el guard de `/docente` renderizan y no revientan; que
la llamada completa (con un alumno simulado en `localStorage`) no se rompe aunque
todas las escrituras a Supabase fallen (quedan como `console.warn`); build, lint y
66 tests en verde.

**Decisiones tomadas**
- `src/lib/progreso.ts` (sessionStorage, de F4) se mantiene **sin tocar**, como
  caché local: `persistencia.ts` escribe en Supabase en paralelo, de forma aditiva.
  Evita reescribir toda la lógica de F4 y las páginas siguen funcionando igual sin
  login (modo `?debug=1` suelto).
- La puntuación se sigue calculando en el cliente (decisión de F4) y es el cliente
  quien la escribe en `evaluaciones.puntuacion`: un alumno con herramientas de
  desarrollador podría falsear su propia puntuación. Aceptable para una herramienta
  formativa (no certificadora); si se necesitara integridad real, habría que mover
  el cálculo a una Edge Function con service role que escriba ella misma la fila.
- No hay tipos TypeScript generados para el esquema de Supabase (`supabase gen
  types` necesita una base de datos real para conectarse): las consultas usan el
  cliente sin tipar y objetos `as unknown as ...` donde hace falta. Pendiente para
  cuando haya una instancia real.
- No hay UI para crear grupos ni para dar de alta docentes (fuera de alcance de F5,
  documentado en `supabase/seed.sql`): se hace a mano en Studio o con SQL.

**Pendiente**
- **Verificar todo esto contra un Supabase real**: migraciones, sobre todo las
  políticas RLS del docente (el patrón de recursión con `security definer` es
  estándar pero no se ha ejecutado ni una vez), y el flujo completo de acceso.
- F6 (pulido): STT de producción, móvil/Safari, accesibilidad, errores de verdad.
