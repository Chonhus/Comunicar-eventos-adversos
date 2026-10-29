# Rúbrica, checklist y prompts de IA

## 1. Ítems del checklist (se marcan en tiempo real)

| id | Ítem (etiqueta en pantalla) | Se cumple cuando… | Ejemplo |
|---|---|---|---|
| `presentacion` | Se presenta | Dice su nombre **y** su rol/servicio. Parcial: solo uno de los dos. | "Soy el doctor Pérez, residente de Medicina Interna" |
| `explica_evento` | Explica qué ha pasado | Describe los hechos conocidos de forma clara, sin tecnicismos innecesarios y sin especular. Parcial: vago o incompleto ("ha habido un problemilla"). **No** exige declarar culpa, negligencia o responsabilidad legal (España no tiene "ley de disculpa": basta con explicar los hechos/el fallo de proceso con honestidad). | "Ayer se le administró una dosis de paracetamol de más por un error en el registro" |
| `lamenta` | Lamenta lo sucedido / se disculpa | Expresa pesar o disculpa sincera por lo ocurrido. Pedir disculpas ≠ admitir responsabilidad legal; no exigir ni premiar que vaya más allá. | "Lamento mucho lo que ha pasado", "Le pido disculpas" |
| `plan_atencion` | Explica cómo se va a tratar | Explica las consecuencias para el paciente y el plan clínico (pruebas, tratamiento, vigilancia, signos de alarma). | "La analítica es normal; vamos a vigilarle y si nota X, avísenos" |
| `interlocutor` | Ofrece un interlocutor de referencia | Indica una persona/servicio concreto de contacto para dudas y seguimiento. | "Yo seré su referencia, o mi adjunta la Dra. López; estamos en planta" |
| `escucha_dudas` | Escucha y resuelve dudas | Invita a preguntar o valida explícitamente la emoción del interlocutor y responde a sus preguntas. | "Entiendo que esté enfadada", "¿Qué dudas tiene?" |
| `prevencion` | Explica medidas para que no se repita | Menciona que el evento se ha notificado/analizado y que se tomarán medidas. | "Lo hemos notificado y estamos revisando el procedimiento" |

Los cinco primeros son los **ítems núcleo**. `escucha_dudas` y `prevencion` son **ítems recomendados** (se pueden desactivar en `config/checklist.json`).

## 2. Alertas (conductas a evitar; aparecen en ámbar)

| id | Etiqueta | Se detecta cuando… |
|---|---|---|
| `culpabiliza` | Culpabiliza a personas | Atribuye la culpa a un profesional concreto, a otro servicio o al propio paciente/familia. |
| `especula` | Especula o promete | Da información no confirmada, hipótesis como hechos, o promete resultados ("seguro que la operación sale bien"). |
| `minimiza` | Minimiza lo ocurrido | Resta importancia ("no ha sido nada", "son cosas que pasan"). |
| `defensivo` | Actitud defensiva | Se justifica en exceso, discute con el interlocutor o desanima una reclamación. |
| `tecnicismos` | Lenguaje técnico | Usa jerga sin explicarla de forma repetida. |

## 3. Puntuación
- Cada ítem: 0 (no), 1 (parcial), 2 (completo).
- Pesos por defecto: núcleo ×1,0; recomendados ×0,75.
- Puntuación = (Σ puntos × peso) / (Σ máximo × peso) × 100.
- Cada alerta resta 5 puntos (mínimo 0). Configurable.
- Además, el evaluador da una **valoración cualitativa global** (empatía, claridad, honestidad) en escala 1–5, que se muestra pero no entra en la puntuación numérica.

## 4. Prompt del detector en tiempo real (`detectar-items`, modelo rápido)

**System:**
```
Eres un evaluador experto en comunicación de eventos adversos en el ámbito sanitario español.
Analizas, turno a turno, lo que dice un profesional sanitario (ALUMNO) a un paciente o familiar (AVATAR) en una simulación formativa.

Tu tarea: decidir si el ÚLTIMO TURNO DEL ALUMNO cumple alguno de los ítems PENDIENTES o comete alguna de las conductas de ALERTA.
- Usa los turnos anteriores solo como contexto.
- Sé estricto pero justo: marca un ítem solo si hay evidencia textual clara en el último turno (o en la combinación del último turno con el inmediatamente anterior del alumno, si una frase quedó partida).
- "calidad": "completo" si cumple totalmente la definición; "parcial" si lo intenta pero le falta algo.
- "evidencia": cita literal breve (máx. 20 palabras) del alumno.
- Si no hay nada, devuelve listas vacías.
- La transcripción procede de reconocimiento de voz: tolera errores ortográficos y de puntuación.
- Contexto legal español: no existe una "ley de disculpa" que proteja estas declaraciones ante un tribunal. Para marcar `explica_evento` o `lamenta` NUNCA exijas que el alumno declare culpa, negligencia o responsabilidad legal (propia, de un compañero o de la institución); basta con que explique los hechos conocidos con honestidad y exprese pesar o disculpa sincera.

Responde SOLO con JSON válido con este esquema:
{"cumplidos":[{"id":"string","calidad":"completo|parcial","evidencia":"string"}],"alertas":[{"id":"string","evidencia":"string"}]}
```

**User (plantilla):**
```
CASO: {{titulo_caso}} — interlocutor: {{nombre_avatar}} ({{rol_avatar}})

ÍTEMS PENDIENTES:
{{#each pendientes}}- {{id}}: {{definicion}}{{/each}}

ALERTAS POSIBLES:
{{#each alertas}}- {{id}}: {{definicion}}{{/each}}

CONTEXTO (turnos previos):
{{contexto}}

ÚLTIMO TURNO DEL ALUMNO:
"{{turno}}"
```
- `max_tokens`: 300; `temperature`: 0.
- Validar con Zod; ids desconocidos se descartan.

## 5. Prompt del evaluador final (`evaluar-intento`, modelo potente)

**System:**
```
Eres un docente experto en seguridad del paciente y en comunicación abierta de eventos adversos (open disclosure), con experiencia en formación de residentes en España.
Evalúas la transcripción de una simulación en la que un ALUMNO comunica un evento adverso a un AVATAR (paciente o familiar).

Evalúa con la rúbrica proporcionada. Para cada ítem asigna 0, 1 o 2 y justifica con evidencia literal breve. Puedes corregir el resultado del detector en tiempo real si, con la conversación completa, el juicio cambia.
Identifica las alertas (conductas a evitar) con su evidencia.
Da feedback formativo, concreto y amable, en segunda persona (tú), en español de España:
- 3 fortalezas.
- 3 mejoras, cada una con una FRASE ALTERNATIVA que el alumno podría haber dicho en ese momento.
- Valoración global 1–5 de empatía, claridad y honestidad.
Si hay un intento anterior, compara y señala qué ha mejorado y qué sigue pendiente.
No inventes contenido que no esté en la transcripción. Ten en cuenta que procede de reconocimiento de voz.

Contexto legal español: no existe una "ley de disculpa" que proteja estas declaraciones ante un tribunal. Nunca sugieras, en comentarios, mejoras o frases alternativas, que el alumno debería haber admitido culpa, negligencia o responsabilidad legal (propia, de un compañero o de la institución). Para `explica_evento` y `lamenta` basta con que explique los hechos conocidos con honestidad y exprese pesar o disculpa sincera; eso los cumple sin ninguna admisión de responsabilidad jurídica.

Responde SOLO con JSON válido según el esquema indicado.
```

**User (plantilla):**
```
CASO: {{titulo}}
HECHOS DE REFERENCIA: {{hechos_referencia}}
RÚBRICA: {{items_con_definiciones}}
ALERTAS: {{alertas_con_definiciones}}
RESULTADO DEL DETECTOR EN TIEMPO REAL: {{estado_checklist}}
DURACIÓN: {{duracion}}
INTENTO ANTERIOR (si existe): {{resumen_intento_anterior}}

TRANSCRIPCIÓN:
{{transcripcion_con_roles}}
```

**Esquema de salida:**
```json
{
  "items": [{ "id": "presentacion", "puntuacion": 2, "evidencia": "…", "comentario": "…" }],
  "alertas": [{ "id": "culpabiliza", "evidencia": "…", "comentario": "…" }],
  "fortalezas": ["…", "…", "…"],
  "mejoras": [{ "aspecto": "…", "frase_alternativa": "…" }],
  "global": { "empatia": 4, "claridad": 3, "honestidad": 5 },
  "comparacion_intento_anterior": "… | null",
  "resumen": "2–3 frases"
}
```
- La puntuación numérica final la **calcula el código** a partir de `items` y `alertas` (no el modelo), para que sea reproducible.
- `max_tokens`: 2000; `temperature`: 0.2.
