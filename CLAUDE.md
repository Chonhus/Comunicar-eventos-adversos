# CLAUDE.md — Simulador de comunicación de eventos adversos con avatar

## Qué es este proyecto
Aplicación web de formación en seguridad del paciente. El alumno:
1. Completa un **módulo formativo** breve sobre comunicación de eventos adversos (EA) a pacientes y familiares.
2. Practica **hablando por voz** en una **videollamada simulada** con un avatar 3D que hace de paciente o familiar.
3. Mientras habla, ve un **checklist en tiempo real** que se marca cuando cumple cada punto de la comunicación (se presenta ✔, lamenta lo sucedido ✔…).
4. Recibe **feedback** generado por IA tras cada intento y una **evaluación final**.

Hay **2 niveles**: caso sencillo (Nivel 1) y caso difícil (Nivel 2). Cada caso permite **2 intentos**.

Idioma de la interfaz y del contenido: **español de España**. Todo el texto visible al alumno va en español.

## Decisión de arquitectura clave
El avatar conversacional funciona con un **motor de conversación propio** (no Convai):
**voz del alumno → STT → Claude (personaje) en streaming → TTS por frases → avatar con lip sync**.
Todo detrás de una interfaz `MotorConversacion` para poder cambiar de proveedor (incluido un adaptador Convai opcional) sin tocar el resto de la app. Detalle completo en `docs/MOTOR.md`.

## Documentación (leer antes de programar)
- `docs/SPEC.md` — especificación funcional y técnica (flujo, pantallas, arquitectura, datos, fases).
- `docs/MOTOR.md` — diseño del motor de conversación propio (STT, LLM, TTS, lip sync, turnos, latencia).
- `docs/CASOS.md` — los dos casos clínicos y los prompts de los personajes.
- `docs/AVATARES.md` — de dónde salen los avatares 3D, requisitos del GLB (visemas, blendshapes), validación y fallback.
- `docs/RUBRICA.md` — ítems del checklist, criterios y prompts del detector y del evaluador.
- `docs/FORMACION.md` — contenido del módulo formativo previo.
- `config/checklist.json`, `config/casos.json`, `config/motor.json` — configuración editable sin tocar código.

## Stack
- **Frontend:** Vite + React + TypeScript + Tailwind.
- **Avatar 3D:** TalkingHead (Three.js) con GLB con blendshapes (visemas Oculus + ARKit). Requisitos y validación del GLB en `docs/AVATARES.md` (Ready Player Me ya no existe: no usarlo).
- **STT (voz a texto):** proveedor intercambiable. MVP: Web Speech API (es-ES, gratis, Chrome/Edge). Producción: STT en streaming (Azure Speech u otro) con token de corta duración emitido por Edge Function.
- **LLM:** Claude API, **solo desde Edge Functions** (nunca la API key en el cliente).
  - Personaje (conversación): `claude-haiku-5-5` por latencia; configurable por caso.
  - Detector de checklist: `claude-haiku-5-5`.
  - Evaluación final: `claude-sonnet-5-5`.
  - Nombres de modelo en variables de entorno / `config/motor.json`.
- **TTS (texto a voz):** proveedor intercambiable. Por defecto Azure Speech (voces neurales es-ES, eventos de visemas para lip sync, región UE). Alternativa: ElevenLabs con marcas de tiempo.
- **Backend:** Supabase (Postgres + Auth + Edge Functions).

## Reglas de trabajo
- **No inventes APIs.** Antes de integrar TalkingHead, Azure Speech SDK, ElevenLabs o cualquier SDK, lee su documentación oficial/README y usa los nombres reales de métodos y eventos. Si algo de la spec no encaja con la API real, propón el cambio antes de implementarlo.
- Construye por fases (ver `docs/SPEC.md §10`). Al final de cada fase: que compile, que funcione en local y una nota en `PROGRESS.md` (qué se hizo, cómo probarlo, decisiones tomadas, pendientes).
- Siempre debe existir un **modo texto para el docente** (cuadro de texto oculto tras un flag `?debug=1`) que sustituye al STT, para probar rápido sin micrófono.
- **Latencia:** objetivo < 2 s desde que el alumno termina de hablar hasta que el avatar empieza a hablar. Medir y mostrar tiempos en modo debug.
- Todo lo configurable (ítems, casos, intentos, duración, voces, modelos, umbrales de silencio) vive en `config/*.json`.
- Claves en `.env` / secretos de Supabase. Incluir `.env.example`. Nunca commitear claves. Ninguna clave de pago en el bundle del cliente: los proveedores de STT/TTS se usan con tokens temporales emitidos por Edge Functions.
- Diseño responsive: portátil, tablet y móvil (Chrome, Edge, Safari). Micrófono vía HTTPS. Si el navegador no soporta el STT elegido, avisar y ofrecer alternativa.
- Accesibilidad: subtítulos de lo que dice el avatar, contraste AA, navegación con teclado.
- Datos: todos los casos son **ficticios**. Pantalla de consentimiento antes de activar el micrófono (la voz se procesa en servicios externos). Preferir regiones de la UE.

## Comandos esperados
- `npm run dev` — desarrollo local
- `npm run build` — build de producción
- `npm run validar-avatares` — comprueba que los GLB tienen visemas, huesos y tamaño adecuados
- `npm run test` — tests (Vitest) de checklist, troceado de frases, máquina de estados del turno y parsing de respuestas de IA
- `supabase functions serve` — Edge Functions en local
