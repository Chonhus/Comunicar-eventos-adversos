# Especificación — Simulador de comunicación de eventos adversos

## 1. Objetivo docente
Que el profesional sanitario (residentes, enfermería, estudiantes de último curso) practique la **comunicación abierta de un evento adverso** a un paciente o familiar siguiendo una estructura clara, reciba feedback inmediato y pueda mejorar en un segundo intento.

## 2. Flujo del alumno

```
Acceso (código de grupo o login) 
  → Consentimiento (micrófono y tratamiento de voz)
  → Módulo formativo (5 bloques + mini-test)
  → Nivel 1 · Caso sencillo
       → Briefing del caso
       → Intento 1 (videollamada) → Feedback del intento
       → Intento 2 (videollamada) → Feedback del intento + comparación con intento 1
  → Nivel 2 · Caso difícil (se desbloquea al terminar el Nivel 1)
       → mismo esquema
  → Evaluación final (resumen de los 4 intentos, descargable en PDF)
```

- **Intentos:** `maxIntentos = 2` por caso (configurable). El alumno puede saltarse el 2.º intento si lo desea.
- **Desbloqueo Nivel 2:** al completar al menos 1 intento del Nivel 1 (configurable: `requisitoDesbloqueo`, p. ej. puntuación mínima).
- **Duración máxima por llamada:** 6 min (configurable). Aviso a los 5 min.

## 3. Pantallas

### 3.1 Inicio / acceso
- Opción A (MVP): código de grupo + nombre o alias.
- Opción B: Supabase Auth con email (magic link).

### 3.2 Consentimiento
Texto breve: la voz se transcribe y procesa en servicios externos (reconocimiento y síntesis de voz, Anthropic), preferentemente en la UE, solo con fines formativos; se guarda la transcripción y la evaluación; casos ficticios. Botón "Acepto y activar micrófono" (pide permiso del navegador).

### 3.3 Módulo formativo
- 5 bloques (contenido en `docs/FORMACION.md`), cada uno en una tarjeta con texto, puntos clave e ilustración sencilla. Opcional: vídeo incrustado si lo aportamos.
- Barra de progreso.
- Mini-test final (5 preguntas, feedback inmediato). No bloqueante, pero se registra la nota.

### 3.4 Briefing del caso
- Contexto clínico para el alumno (qué ha pasado, qué sabe él, a quién va a hablar).
- Objetivo: "Comunica el evento adverso a [nombre]".
- Recordatorio de la estructura (los ítems del checklist) — en el Nivel 2 se puede ocultar (`mostrarItemsEnBriefing: false`) para aumentar la dificultad.
- Botón "Iniciar llamada".

### 3.5 Videollamada (pantalla principal)
Diseño tipo Teams/Zoom:

```
┌───────────────────────────────────────────┬──────────────────────┐
│                                           │  CHECKLIST           │
│        AVATAR (plano medio, 3D)           │  ✔ Presentación      │
│                                           │  ✔ Explica el evento │
│   [subtítulos de lo que dice el avatar]   │  ☐ Lamenta / disculpa│
│                                ┌───────┐  │  ☐ Plan de atención  │
│                                │ webcam│  │  ☐ Interlocutor      │
│                                │alumno │  │  ☐ Escucha / dudas   │
│                                └───────┘  │  ☐ Prevención        │
│  ● 03:12   🎙 hablando…    [🎤] [📞 colgar] │  ⚠ Alertas           │
└───────────────────────────────────────────┴──────────────────────┘
```
- En móvil: avatar arriba, checklist como barra horizontal de iconos debajo.
- Webcam del alumno: **solo local** (getUserMedia de vídeo, no se envía ni se graba). Opcional, desactivable.
- Indicador de estado: conectando / escuchando / el avatar está hablando.
- **Checklist en tiempo real:** cada ítem pasa de ☐ a ✔ con animación (escala + color verde + pequeño sonido opcional) cuando el detector lo marca. Al pasar el ratón/tocar, muestra la frase que lo justificó.
- **Alertas** (conductas a evitar): aparecen en ámbar si se detectan (p. ej. "Culpabiliza a otro profesional"). No restan en tiempo real visualmente más allá del aviso.
- Botón colgar → confirma → pasa a feedback.
- Transcripción completa plegable (oculta por defecto durante la llamada).

### 3.6 Feedback del intento
- Puntuación global (0–100) y por ítem (0 = no, 1 = parcial, 2 = completo).
- 3 fortalezas y 3 mejoras concretas, con **frases alternativas** sugeridas.
- Alertas detectadas con la frase literal.
- En el intento 2: comparación con el intento 1 (qué ha mejorado).
- Botones: "Repetir (intento 2)" / "Pasar al siguiente nivel".

### 3.7 Evaluación final
- Resumen de ambos niveles, evolución entre intentos, nota de formación (mini-test).
- Descargar PDF (generado en cliente, p. ej. `@react-pdf/renderer` o `jspdf`).
- Encuesta de satisfacción opcional (3 preguntas Likert + 1 abierta) — útil para investigación.

### 3.8 Panel del docente (Fase 5)
- Acceso restringido (rol `docente`).
- Tabla de alumnos por grupo: estado, puntuaciones, nº intentos.
- Ver transcripción y evaluación de cada intento.
- Exportar CSV (para análisis/publicación).

## 4. Arquitectura

```
Navegador (React)
 ├─ MotorConversacion (ver docs/MOTOR.md)
 │    ├─ STT (Web Speech API en MVP / Azure Speech en producción)
 │    ├─ POST /functions/v1/conversar ── SSE ──► Claude (personaje)
 │    ├─ TTS por frases (Azure Speech con visemas) ── cola de audio
 │    └─ TalkingHead (avatar 3D con lip sync y emociones)
 ├─ ChecklistEngine (estado local, nunca desmarca)
 │     └─ por cada turno final del alumno → POST /functions/v1/detectar-items
 └─ al colgar → POST /functions/v1/evaluar-intento

Supabase
 ├─ Edge Function conversar        → Claude (haiku, streaming) — personaje
 ├─ Edge Function detectar-items   → Claude (haiku) → JSON ítems cumplidos + alertas
 ├─ Edge Function evaluar-intento  → Claude (sonnet) → JSON evaluación
 ├─ Edge Function token-voz        → token temporal STT/TTS
 └─ Postgres (sesiones, turnos, eventos de checklist, evaluaciones, métricas)
```

### 4.1 Detección en tiempo real
- Disparador: cada **turno final** del alumno emitido por el motor (evento `turnoAlumno`). Como el motor es propio, la transcripción está siempre disponible.
- Se envía: caso, ítems **pendientes**, últimos ~6 turnos (alumno y avatar) como contexto, y el turno nuevo.
- Respuesta: `{ "cumplidos": [{ "id", "evidencia", "calidad": "parcial"|"completo" }], "alertas": [{ "id", "evidencia" }] }`.
- El cliente **solo añade** ítems (un ítem marcado no se desmarca). Si un ítem estaba "parcial" puede pasar a "completo".
- Se lanza **en paralelo** a `conversar` (no debe retrasar la respuesta del avatar).
- Si la llamada al detector falla o tarda > 4 s, se ignora ese turno y se incluye como contexto en el siguiente.
- Latencia objetivo: el check aparece < 2 s después de que el alumno termine la frase.

### 4.2 Evaluación final del intento
- Entrada: transcripción completa (desde la tabla `turnos`), caso (incluidos hechos de referencia y perfil emocional), estado final del checklist, alertas, duración.
- Salida JSON según esquema en `docs/RUBRICA.md`. Validar con Zod; si falla el parseo, reintentar una vez.
- La evaluación final **puede corregir** al detector en tiempo real. La puntuación oficial es la de la evaluación final, calculada por código.

### 4.3 Personajes
- Un personaje por caso. Su prompt se construye en el servidor con la plantilla de `docs/MOTOR.md §6` y los textos de `docs/CASOS.md`.
- El personaje **no evalúa ni da pistas**; reacciona de forma realista y emite una etiqueta de emoción por respuesta.
- Voz TTS, avatar GLB, modelo de Claude y frase de apertura opcional, configurables por caso en `config/casos.json`.

### 4.4 Adaptador Convai (opcional)
Si en algún momento se quiere usar Convai (p. ej. reutilizar personajes ya creados), se implementa `MotorConvai` con la misma interfaz. Ninguna otra parte de la app depende del proveedor.

## 5. Modelo de datos (Supabase)

```sql
grupos(id uuid pk, nombre text, codigo text unique, creado_en timestamptz)
alumnos(id uuid pk, grupo_id uuid fk, alias text, email text null, rol text default 'alumno', creado_en timestamptz)
progreso_formacion(alumno_id fk, bloque int, completado_en timestamptz, nota_test numeric null)
intentos(id uuid pk, alumno_id fk, caso_id text, numero int, inicio timestamptz, fin timestamptz, duracion_s int, estado text)  -- estado: en_curso|finalizado|abandonado
turnos(id bigserial pk, intento_id fk, rol text, texto text, ts timestamptz)  -- rol: alumno|avatar
eventos_checklist(id bigserial pk, intento_id fk, item_id text, tipo text, calidad text, evidencia text, ts timestamptz)  -- tipo: cumplido|alerta
evaluaciones(intento_id pk fk, puntuacion int, detalle jsonb, modelo text, creado_en timestamptz)
encuestas(alumno_id fk, respuestas jsonb, creado_en timestamptz)
```
- RLS: el alumno solo lee/escribe lo suyo; el docente lee todo su grupo.
- Las Edge Functions usan la service key.

## 6. Configuración
- `config/checklist.json`: ítems, alertas, pesos.
- `config/casos.json`: casos, nivel, intentos, duración, avatar, voz, modelo, frase de apertura, si se muestran los ítems en el briefing.
- `config/motor.json`: motor y proveedores (STT/TTS), umbrales de turno, modelos.

## 7. Estructura de carpetas sugerida
```
src/
  app/            rutas (react-router)
  components/     VideoCall, Avatar, ChecklistPanel, ChecklistItem, FeedbackView, ...
  features/
    formacion/
    llamada/      ChecklistEngine, VideoCall, Subtitulos
  motor/          MotorConversacion, MotorPropio, MotorTexto, stt/, tts/, FraseBuffer, maquinaTurnos, avatar/ (TalkingHead)
    evaluacion/
    docente/
  lib/            supabase client, schemas zod, pdf
config/
supabase/
  functions/conversar/
  functions/detectar-items/
  functions/token-voz/
  functions/evaluar-intento/
  migrations/
docs/
```

## 8. Requisitos no funcionales
- HTTPS obligatorio (micrófono).
- Funciona en navegadores de escritorio y móvil modernos; aviso si el navegador no soporta WebRTC/micrófono.
- Coste: registrar tokens usados por intento en `evaluaciones.detalle` para estimar coste por alumno.
- Logs sin datos sensibles.

## 9. Criterios de aceptación clave
- [ ] Al decir "Hola, soy la doctora García, residente de Medicina Interna", el ítem *Presentación* se marca en < 2 s.
- [ ] Un ítem marcado no se desmarca nunca durante la llamada.
- [ ] Decir "ha sido culpa de la enfermera de noche" genera la alerta *Culpabiliza*.
- [ ] Tras colgar, el feedback aparece en < 20 s con puntuación por ítem y frases alternativas.
- [ ] El intento 2 muestra comparación con el intento 1.
- [ ] El Nivel 2 está bloqueado hasta completar el Nivel 1.
- [ ] El avatar empieza a hablar < 2 s (mediana) después de que el alumno termina su frase.
- [ ] Si el alumno interrumpe al avatar, este se calla en < 500 ms.
- [ ] La emoción del avatar cambia según su respuesta (p. ej. Lucía empieza enfadada y se calma con una comunicación empática).
- [ ] El modo texto (`?debug=1`) permite probar todo el flujo sin micrófono.
- [ ] Ninguna API key aparece en el bundle del cliente.

## 10. Fases de desarrollo
1. **F0 – Andamiaje:** Vite + React + TS + Tailwind + router + Supabase client + `config/` + `.env.example`.
2. **F1 – Formación:** módulo de 5 bloques + mini-test desde `docs/FORMACION.md` (contenido en JSON/MDX).
3. **F2 – Conversación por voz sin avatar 3D:** UI de videollamada con imagen estática del personaje; STT con Web Speech API; Edge Function `conversar` con streaming; FraseBuffer; TTS por frases (empezar con Azure; si aún no hay clave, `speechSynthesis` del navegador como provisional); subtítulos; máquina de turnos; ChecklistEngine + `detectar-items`; modo texto `?debug=1`. Tests unitarios. **Aquí ya se habla con el personaje y se ven los checks.**
4. **F3 – Avatar 3D** (ver `docs/AVATARES.md`): script `validar-avatares`, página `/debug/avatar`, TalkingHead con GLB, fallback a imagen, lip sync por visemas, emociones, estados escuchando/hablando, interrupción (barge-in), métricas de latencia.
5. **F4 – Evaluación:** Edge Function `evaluar-intento`, pantalla de feedback, flujo de 2 intentos, desbloqueo de niveles, evaluación final + PDF.
6. **F5 – Persistencia y panel docente:** tablas, RLS, panel, exportación CSV, costes por intento, encuesta.
7. **F6 – Pulido:** STT de producción (Azure con token), móvil y Safari, accesibilidad, errores (micrófono denegado, desconexión), pruebas con 3–5 usuarios reales.
8. **F7 (opcional) – Adaptador Convai.**
