# Primer mensaje para Claude Code

Copia esta carpeta como raíz del proyecto, abre Claude Code dentro y pega:

---

Lee `CLAUDE.md` y todos los archivos de `docs/` y `config/`. Es la especificación de una app web de formación en comunicación de eventos adversos: el alumno habla por voz con un avatar 3D en formato videollamada, ve un checklist que se marca en tiempo real y recibe una evaluación por IA. El avatar funciona con un motor de conversación propio (STT → Claude → TTS → lip sync), descrito en `docs/MOTOR.md`.

Antes de escribir código:
1. Resúmeme en 10 líneas cómo lo has entendido.
2. Revisa la documentación real de TalkingHead, de la Web Speech API y del Azure Speech SDK (STT, TTS y eventos de visemas). Dime cómo encajan con `docs/MOTOR.md` y propón cambios si algo no cuadra.
3. Lista las dudas que bloqueen las fases F0–F2.

Después, ejecuta las fases F0, F1 y F2 de `docs/SPEC.md §10`, una a una, actualizando `PROGRESS.md` al terminar cada fase. Para al final de F2 para que yo pruebe a hablar con el personaje y ver los checks.

---

## Lo que necesitarás tener preparado
- **Supabase:** URL, anon key y service key.
- **Anthropic:** API key (como secreto de las Edge Functions).
- **Azure Speech** (antes de F2 si quieres voz de calidad desde el principio; si no, F2 arranca con la voz del navegador): clave y región UE. Elegir dos voces neurales es-ES y ponerlas en `config/casos.json`.
- **Avatares:** ya incluidos en `public/avatars/` (GLB + imagen de respaldo de Antonio y Lucía, validados con TalkingHead). Fondos provisionales en `public/fondos/` (ver créditos en `public/fondos/CREDITOS.md`).
- Navegador recomendado para las pruebas: Chrome o Edge, con auriculares.
