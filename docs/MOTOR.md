# Motor de conversación propio

Sustituye a Convai. Convierte la voz del alumno en respuesta hablada del avatar con lip sync, y entrega la transcripción a la app (checklist y evaluación).

## 1. Pipeline

```
 Micrófono ─► STT ─► (fin de turno) ─► Edge Function `conversar` ─► Claude (streaming SSE)
                                                                       │
                                     texto en streaming ◄──────────────┘
                                            │
                              troceado por frases (FraseBuffer)
                                            │
                         TTS por frase (cola) ─► audio + visemas/tiempos
                                            │
                          TalkingHead: reproduce audio + mueve labios
```

Paralelamente, cada **turno final del alumno** se envía a `detectar-items` (checklist) — ver `docs/RUBRICA.md`.

## 2. Interfaz común

```ts
type Emocion = 'neutral' | 'preocupado' | 'enfadado' | 'triste' | 'aliviado';

interface MotorConversacion {
  iniciar(caso: Caso): Promise<void>;        // conecta, saludo inicial opcional del avatar
  detener(): Promise<void>;                  // cuelga, libera micrófono y audio
  enviarTexto(texto: string): void;          // modo texto (debug docente)
  silenciarMicro(silenciado: boolean): void;
  on(evento: 'transcripcionParcial', cb: (t: string) => void): void;
  on(evento: 'turnoAlumno', cb: (t: { texto: string; ts: number }) => void): void;   // turno final
  on(evento: 'textoAvatar', cb: (t: { texto: string; final: boolean }) => void): void; // para subtítulos
  on(evento: 'estado', cb: (e: 'conectando'|'escuchando'|'pensando'|'hablando'|'error') => void): void;
  on(evento: 'emocion', cb: (e: Emocion) => void): void;
  on(evento: 'metricas', cb: (m: { sttMs: number; primerTokenMs: number; primerAudioMs: number }) => void): void;
}
```
Implementaciones:
- `MotorPropio` (principal): STT + `conversar` + TTS + TalkingHead.
- `MotorTexto` (debug): sin voz; útil para tests y para el docente.
- `MotorConvai` (opcional, Fase 7): adaptador con `@convai/web-sdk`.

La selección se hace en `config/motor.json` (`"motor": "propio" | "convai"`).

## 3. STT (voz a texto)
Interfaz `ProveedorSTT` con eventos `parcial`, `final`, `inicioHabla`, `finHabla`.
- **`webspeech` (MVP):** `SpeechRecognition` con `lang: 'es-ES'`, `continuous: true`, `interimResults: true`. Gratis. Funciona bien en Chrome/Edge; soporte limitado en otros navegadores → detectar y avisar. Se reinicia automáticamente si el navegador corta la sesión.
- **`azure` (producción):** Azure Speech SDK para JS, reconocimiento continuo en es-ES, autenticado con **token temporal** de la Edge Function `token-voz` (la clave nunca va al cliente). Región UE.
- `getUserMedia` con `echoCancellation`, `noiseSuppression` y `autoGainControl` activados. Recomendar auriculares en la pantalla previa.

## 4. Fin de turno y turnos
Máquina de estados (testeable, sin dependencias de navegador):

```
ESCUCHANDO ──(final STT + silencio ≥ silencioFinTurnoMs)──► PENSANDO
PENSANDO   ──(primer audio listo)──────────────────────────► HABLANDO
HABLANDO   ──(cola de audio vacía y stream terminado)──────► ESCUCHANDO
HABLANDO   ──(alumno habla > bargeInMinMs)──────────────────► INTERRUMPIDO → ESCUCHANDO
```
- `silencioFinTurnoMs` por defecto 800 ms (configurable). Juntar varios `final` consecutivos del STT en un único turno.
- **Interrupción (barge-in):** si el alumno empieza a hablar mientras el avatar habla (detectado por STT parcial con ≥ 2 palabras o energía de voz sostenida > `bargeInMinMs`), parar audio, abortar el stream de Claude (AbortController) y vaciar la cola. Guardar en el historial solo lo que el avatar llegó a decir.
- Mientras el avatar habla, ignorar parciales cortos (eco, "ajá") para evitar cortes falsos.

## 5. Edge Function `conversar`
- Entrada: `{ intentoId, casoId, historial: [{rol, texto}], turnoAlumno }`.
- Construye el **system prompt del personaje** (§6) en el servidor a partir de `docs/CASOS.md` / tabla de casos. Los hechos de referencia del evaluador **nunca** se incluyen aquí.
- Llama a Claude con `stream: true` y devuelve SSE al cliente.
- Guarda en `turnos` el turno del alumno y, al terminar, el del avatar (o la parte dicha si hubo interrupción, que el cliente confirma con un POST corto).
- Límites: `max_tokens` ~200; respuesta objetivo de 1–3 frases.
- Usar prompt caching para el system prompt del personaje (es fijo por caso) para bajar latencia y coste.

## 6. Prompt del personaje (plantilla)

```
Eres {{nombre}}, {{descripcion_breve}}. Estás en una conversación con un profesional sanitario del hospital, en un ejercicio de simulación formativa. Hablas SIEMPRE en español de España, de forma natural y coloquial, como hablaría esta persona en la vida real.

QUIÉN ERES:
{{backstory}}

LO QUE SABES Y LO QUE NO:
{{conocimiento}}

CÓMO TE COMPORTAS:
{{comportamiento}}

REGLAS:
- Responde en 1–3 frases cortas, como en una conversación oral. Nada de listas ni de formato.
- No eres un asistente: nunca ayudes al profesional, no le des pistas sobre cómo comunicar, no evalúes ni menciones que esto es una simulación.
- Reacciona a lo que el profesional dice realmente: si es claro y empático, te vas calmando; si es vago, técnico, defensivo o culpabiliza, tu reacción empeora según tu perfil.
- No inventes datos clínicos que no te hayan dicho.
- Empieza cada respuesta con una etiqueta de emoción entre corchetes: [neutral], [preocupado], [enfadado], [triste] o [aliviado]. La etiqueta no se pronuncia.
```
- El cliente extrae la etiqueta al inicio del stream → evento `emocion` (cambia la expresión del avatar) y la elimina antes del TTS y de los subtítulos.
- Si el alumno no habla en `silencioIncomodoMs` (p. ej. 12 s) al inicio, el avatar puede decir una frase de apertura configurada en el caso (p. ej. Lucía: "¿Me va a explicar alguien qué ha pasado?").

## 7. Troceado por frases (FraseBuffer)
- Acumular tokens y emitir una frase al encontrar `.`, `?`, `!`, `…` o `;` seguidos de espacio, o al superar ~120 caracteres en una coma.
- La primera frase se emite lo antes posible (aunque sea corta) para reducir latencia.
- Tests unitarios con abreviaturas habituales ("Dr.", "Sra.", "p. ej.") para no cortar mal.

## 8. TTS (texto a voz) y lip sync
Interfaz `ProveedorTTS.sintetizar(frase, voz) → { audio: AudioBuffer | ArrayBuffer, visemas?: [{ visema, inicioMs, durMs }], palabras?: [{ palabra, inicioMs, durMs }] }`.
- **`azure` (por defecto):** voces neurales es-ES (elegir una masculina mayor para Antonio y una femenina madura para Lucía; configurable en `config/motor.json`). Usar SSML para ritmo y, si la voz lo permite, estilo emocional según la etiqueta. Suscribirse al evento `visemeReceived` del `SpeechSynthesizer` (no requiere el elemento `mstts:viseme` del SSML: ese elemento solo sirve para pedir blendshapes ARKit, que no usamos). Cada evento trae `visemeId` (entero Microsoft 0–21) y `audioOffset` (en *ticks* de 100 ns → dividir entre 10 000 para ms), **sin duración**: la duración de cada visema se calcula como la diferencia con el `audioOffset` del siguiente evento (el último se extiende hasta el final del audio). Mapear `visemeId` (0–21) a visema Oculus y pasar el resultado a `speakAudio({ visemes, vtimes, vdurations })` de TalkingHead. Token temporal desde `token-voz`.
- **`elevenlabs` (alternativa):** endpoint con marcas de tiempo por carácter → derivar palabras y dejar que TalkingHead genere visemas, o usar su sincronía por palabras. La clave debe pasar por la Edge Function (proxy).
- **Cola de reproducción:** sintetizar la frase n+1 mientras suena la n. Reproducción secuencial sin huecos.
- Verificar en el README de TalkingHead el método para reproducir audio con visemas/palabras (p. ej. su función de "speak audio") y el formato exacto esperado.

## 9. Avatar (TalkingHead)
- Escena: plano medio, fondo de habitación de hospital o sala de información (imagen o escena sencilla), luz suave.
- Estados visuales: escuchando (asentimientos sutiles, mirada a cámara), pensando (breve mirada lateral), hablando (lip sync).
- Emoción → `mood`/expresión de TalkingHead según la etiqueta. TalkingHead 1.8 solo trae `setMood()` con `neutral, happy, angry, sad, fear, disgust, love, sleep`: no hay `preocupado` ni `aliviado` nativos. En F3 decidir mapeo (p. ej. `preocupado→sad` atenuado, `aliviado→happy` atenuado) o añadir esas dos entradas a `head.animMoods`.
- Carga diferida del GLB y fallback a imagen estática si WebGL falla.

## 10. Latencia — presupuesto orientativo
| Tramo | Objetivo |
|---|---|
| Fin de habla → turno final STT | 300–800 ms |
| Petición → primer token de Claude | 400–900 ms |
| Primera frase → primer audio TTS | 200–400 ms |
| **Total hasta que el avatar habla** | **< 2 s** |
Mostrar estas métricas en modo debug y registrarlas por intento.

## 11. Edge Functions del motor
- `conversar` — §5.
- `token-voz` — emite tokens temporales del proveedor STT/TTS (Azure: token de 10 min). Requiere sesión válida.
- `tts-proxy` — solo si el proveedor elegido no admite tokens temporales (ElevenLabs).

## 12. Costes y datos
- Registrar por intento: segundos de STT, caracteres de TTS y tokens de Claude → estimación de coste por alumno en el panel docente.
- Elegir región UE en Azure. Indicar en el consentimiento qué servicios procesan la voz.
