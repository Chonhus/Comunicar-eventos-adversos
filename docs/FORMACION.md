# Módulo formativo previo (borrador de contenido)

> **Nota:** el módulo ya no se renderiza como tarjetas de texto — ahora son 4 vídeos de una clase grabada (ver `src/features/formacion/contenido.ts`). Este documento queda como guion/referencia del contenido que cubren los vídeos, no como lo que ve el alumno en pantalla.
>
> **Pretest/postest:** justo después del consentimiento (antes del primer vídeo) el alumno responde un pretest de 5 preguntas (`preguntasPrePost` en `contenido.ts`); las mismas 5 preguntas se repiten como postest antes de mostrar la evaluación final del Nivel 2. Es el mismo diseño clásico pre/post para medir la mejora real, no una nota que cuente en contra. El resultado de cada mini-test (incluidos los dos bloques intercalados entre vídeos) se muestra como aciertos en bruto («4/4»), nunca escalado a una nota sobre 10.

> Contenido base para revisar y adaptar por el equipo docente. Cada bloque = una tarjeta en la app (texto breve + 3–4 puntos clave). Duración total estimada: 10–12 min.

## Bloque 1 · ¿Qué es un evento adverso?
- Un **evento adverso** es un daño al paciente relacionado con la atención sanitaria y no con su enfermedad de base.
- Un **incidente sin daño** es aquel que llegó al paciente pero no le causó daño (p. ej. una dosis extra sin consecuencias). También se comunica.
- Los eventos adversos son frecuentes: en los estudios en hospitales afectan aproximadamente a 1 de cada 10 pacientes ingresados, y una parte importante son evitables.
- La mayoría se deben a **fallos del sistema** (procesos, comunicación, organización), no a la mala fe de una persona.

**Puntos clave:** daño ligado a la atención · incidentes sin daño también cuentan · enfoque de sistema, no de culpa.

## Bloque 2 · ¿Por qué comunicar?
- El paciente tiene **derecho a la información** sobre su proceso (Ley 41/2002 de autonomía del paciente).
- Comunicar de forma honesta **mantiene la confianza**, facilita la toma de decisiones y reduce el conflicto.
- No comunicar o hacerlo mal aumenta la sensación de engaño y las reclamaciones.
- Pedir disculpas **no es reconocer culpa jurídica**: es expresar pesar por lo que ha vivido el paciente.
- La comunicación también ayuda al profesional implicado (segunda víctima).

**Puntos clave:** derecho del paciente · confianza · disculparse ≠ declararse culpable.

## Bloque 3 · Antes de la conversación
- Recoge los **hechos confirmados** (qué, cuándo, consecuencias, plan). No especules.
- Decide **quién** comunica (idealmente el responsable del paciente, acompañado si es posible) y **a quién** (paciente y/o familia, con su consentimiento).
- Busca un **lugar tranquilo**, sin interrupciones, sentado, con tiempo.
- Asegúrate de que el evento está **notificado** en el sistema de notificación del hospital.

## Bloque 4 · La estructura de la conversación
1. **Preséntate**: nombre y rol.
2. **Explica qué ha pasado**: hechos claros, lenguaje sencillo, sin tecnicismos ni suposiciones.
3. **Lamenta lo sucedido**: "Siento mucho lo que ha ocurrido". Pedir disculpas es adecuado.
4. **Explica cómo se va a tratar**: consecuencias, pruebas, tratamiento y signos de alarma.
5. **Ofrece un interlocutor**: una persona concreta de referencia para dudas y seguimiento.
6. **Escucha y resuelve dudas**: deja silencios, valida emociones ("entiendo que esté enfadada").
7. **Explica qué se hará para que no se repita**: notificación, análisis, medidas.

## Bloque 5 · Qué evitar y situaciones difíciles
- ❌ **Culpabilizar** a compañeros, a otros servicios o al propio paciente.
- ❌ **Especular** o prometer resultados.
- ❌ **Minimizar** ("no ha sido nada").
- ❌ **Ponerse a la defensiva** o desanimar una reclamación (es un derecho; informa del Servicio de Atención al Paciente).
- Ante el **enfado**: no lo tomes como algo personal, valida la emoción, no discutas, vuelve a los hechos y al plan.
- Ante "**¿de quién es la culpa?**": "Ahora mismo estamos analizando qué falló para que no vuelva a pasar; le mantendremos informada".
- Si no sabes algo: "No lo sé todavía, lo voy a averiguar y se lo diré".

## Pretest/postest (5 preguntas, opción única — `preguntasPrePost` en `contenido.ts`)
Las opciones incorrectas están pensadas para sonar plausibles, no para descartarse por simple sentido común.
1. ¿Qué es un evento adverso? → **daño al paciente ligado a la atención, no a la evolución natural de su enfermedad** (no: cualquier empeoramiento clínico · no: solo errores de medicación).
2. ¿Por qué tiene el paciente derecho a ser informado? → **es un derecho legal (Ley 41/2002)** (no: solo buena práctica sin obligación legal · no: solo si el daño es grave o permanente).
3. Al comunicar un evento adverso, lo recomendable es… → **explicar los hechos con claridad y ofrecer un interlocutor** (no: esperar a la investigación completa · no: dar el máximo detalle técnico).
4. Ante "¿de quién es la culpa?" → **analizar qué ha pasado a nivel de proceso, sin señalar a una persona** (no: decir que la identidad del responsable es confidencial · no: decir que nunca se sabrá).
5. Pedir disculpas… → **expresa pesar, no es una admisión de responsabilidad legal** (no: reservarlo para cuando esté confirmado el error de alguien · no: evitarlo porque puede interpretarse como culpa).

## Preguntas intercaladas entre vídeos (2+2, en `pasos` de `contenido.ts`)
Tras el vídeo de Introducción:
1. Método CANDOR → **proceso estructurado de comunicación abierta y resolución, incluye apoyo al profesional implicado** (no: estrategia de "negar y defender" · no: solo para incidentes sin daño).
2. "Segunda víctima" → **el profesional implicado, que también necesita apoyo** (no: un segundo paciente afectado · no: el familiar que reclama).

Tras el vídeo de Cómo notificar un evento adverso:
3. Incidente sin daño al paciente → **se notifica siempre internamente, aunque no se comunique al paciente** (no: no hace falta si no hubo consecuencia clínica · no: solo si el paciente pregunta).
4. Si la familia quiere reclamar → **informar de que es su derecho y cómo hacerlo** (no: intentar disuadirla porque no cambiará nada · no: decirle que espere a la investigación).
