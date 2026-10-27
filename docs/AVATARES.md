# Avatares 3D — obtención, requisitos y validación

Se necesitan **dos avatares** (uno por caso) y **dos fondos**:

| Caso | Personaje | Aspecto | Archivo |
|---|---|---|---|
| Nivel 1 | Antonio Ruiz | Hombre, 68 años, aspecto afable, pelo canoso, pijama de hospital | `public/avatars/antonio.glb` |
| Nivel 2 | Lucía Martín | Mujer, 52 años, pelo castaño recogido, ropa de calle, aspecto cansado | `public/avatars/lucia.glb` |

Fondos: `public/fondos/habitacion.jpg` (Antonio, en su cama de planta) y `public/fondos/sala-informacion.jpg` (Lucía, sala de información a familiares).

> Ready Player Me, la fuente clásica de avatares para TalkingHead, **cerró el 31/01/2026**. No usar tutoriales ni URLs que dependan de él.

## 1. Estado: avatares YA GENERADOS
Los dos avatares ya existen y están validados. **No hay que crearlos**; Claude Code solo tiene que integrarlos (F3).
- `public/avatars/antonio.glb` y `public/avatars/lucia.glb` (≈ 8 MB cada uno, ~44.000 triángulos, texturas WebP 1024 px).
- `public/avatars/antonio.jpg` y `public/avatars/lucia.jpg`: imágenes de respaldo (captura de TalkingHead con brazos cruzados sobre su fondo, 1024×1024). Sirven también como foto del personaje en F2.
- `assets-origen/preview_avatares.png`: vista previa de emociones y bocas en TalkingHead.
- `assets-origen/videollamada_preview.jpg`: cómo se ve cada personaje en la videollamada (brazos cruzados, fondo, encuadre).
- Generados con Blender 5.2 (módulo `bpy`) + MPFB 2 + rig, pesos y targets ARKit/Oculus de TalkingHead (`blender/MPFB` del repo met4citizen/TalkingHead). Assets de MakeHuman con licencia **CC0** (system assets + shirts01).

Comprobado en TalkingHead 1.8 (three 0.186) con un navegador headless:
- Raíz del modelo `Armature` (valor por defecto de `modelRoot`).
- Malla del cuerpo con **67 morph targets**: los 15 visemas Oculus (incl. `viseme_sil`) + 52 ARKit. Dientes, lengua, cejas, pestañas y pelo llevan solo los morphs que les afectan (normal).
- Huesos alineados con el rig de referencia de TalkingHead (orientación y roll), así que las poses y la mirada funcionan: mira a cámara con los ojos abiertos.
- Moods `neutral`, `angry`, `sad`, `happy` y visemas `viseme_aa` / `viseme_O` verificados visualmente.
- Materiales: OPACOS (piel, ropa, dientes, lengua) y MASK con alpha clip (pelo, cejas, pestañas, ojos). No usar BLEND: provoca errores de transparencia en three.js.
- Usar `body: 'M'` para Antonio y `body: 'F'` para Lucía en `showAvatar`.
- Ropa: Antonio con polo azul y pantalón azul claro; Lucía con jersey gris y vaqueros (pantalones extraídos de los conjuntos `male_casualsuit06` / `female_casualsuit01`).

### Pose obligatoria: BRAZOS CRUZADOS
Los dos personajes deben estar SIEMPRE con los brazos cruzados (nunca con los brazos abiertos de la pose de reposo).
- Las plantillas están en `config/poses.json` (`antonio`, `lucia`), en el formato de `poseTemplates` de TalkingHead (`{standing, props}` con `*.rotation` / `*.quaternion`). Se calcularon con cinemática inversa sobre cada avatar (`scripts/avatares/pose/`).
- Al cargar el avatar, justo después de `showAvatar`:
```js
import poses from '../config/poses.json';
const t = poses[casoId === 'n1_paracetamol' ? 'antonio' : 'lucia'];
head.poseTemplates['cruzados'] = t;
// TalkingHead cambia de pose al azar según el mood ('side','hip','straight','wide','turn'):
for (const n of ['side','hip','straight','wide','turn']) head.poseTemplates[n] = t;
head.speakWithHands = () => {};   // que no descruce los brazos al hablar
head.playPose('cruzados');        // NO existe setPoseFromTemplate(); el método real es playPose(nombre, onprogress, dur, ndx, scale)
```
> Corrección sobre la spec original: el método se llama `playPose`, no `setPoseFromTemplate` (no existe en la API de TalkingHead 1.8). Verificar en F3 los valores por defecto de `dur`/`scale` contra la versión instalada antes de ajustarlos.
- Verificado: se mantiene con los moods `neutral`, `angry`, `sad`, `happy` y también cuando TalkingHead refleja la pose (izquierda/derecha). En `angry` TalkingHead cierra los puños: es correcto para Lucía.
- Encuadre recomendado (plano de videollamada con cara y brazos): `head.setView('upper', { cameraDistance: 0.25, cameraY: 0.12 })`.

## 2. Regenerar o modificar los avatares (opcional)
Scripts en `scripts/avatares/` (pipeline usado para generarlos). Requisitos: Python con `bpy==5.2.x` (o Blender 5.2), repo MPFB 2 (`MPFB_SRC`), carpeta `blender/MPFB` de TalkingHead (`TH_DIR`) y los packs de MakeHuman instalados en los datos de usuario de MPFB.
- `config/antonio.json`, `config/lucia.json`: macros (edad, peso, género…), targets de modelado, piel, assets (pelo, ropa, ojos, cejas…), tintes de color y `clothes_push` (separación ropa-cuerpo). Para cambiar el aspecto se edita aquí.
- `build.py` (+ `boot.py`, `tint.py`, `tweaks.py`, `render.py`; `tweaks.py` = ojos, pelo lateral y arrugas de la frente): crea el humano → rig TalkingHead → assets → tintes → render de respaldo → copia de exportación → targets ARKit/Oculus → materiales glTF → alineado de huesos con `ref_bones.json` → export GLB.
- Después: `gltf-transform resize --width 1024 --height 1024` y `gltf-transform webp`.
- `inspect_glb.py`: comprueba raíz, morphs obligatorios y huesos.
Lecciones aprendidas (no repetir errores): añadir el rig ANTES que los assets; no dejar shape keys con valor ≠ 0; no usar materiales BLEND; alinear huesos con el rig de referencia (si no, la cabeza mira hacia abajo, sobre todo con edad alta).

## 3. Requisitos técnicos del GLB
Obligatorios:
- Formato **GLB** (glTF binario), un único archivo.
- Esqueleto compatible con TalkingHead (el rig de su guía). Al menos: `Hips`, `Spine`, `Neck`, `Head`, `LeftEye`, `RightEye`.
- **Visemas Oculus** como morph targets: `viseme_sil`, `viseme_PP`, `viseme_FF`, `viseme_TH`, `viseme_DD`, `viseme_kk`, `viseme_CH`, `viseme_SS`, `viseme_nn`, `viseme_RR`, `viseme_aa`, `viseme_E`, `viseme_I`, `viseme_O`, `viseme_U`.
- Parpadeo: `eyeBlinkLeft`, `eyeBlinkRight`.

Recomendados (expresiones y emociones):
- Blendshapes **ARKit**: como mínimo `browInnerUp`, `browDownLeft/Right`, `mouthSmileLeft/Right`, `mouthFrownLeft/Right`, `jawOpen`, `eyeSquintLeft/Right`, `eyeLook*`.

Rendimiento (debe ir bien en móvil):
- ≤ 50.000 triángulos, texturas ≤ 2048 px (preferible 1024), GLB ≤ 15 MB (ideal < 8 MB).
- Comprimir con `gltf-transform` (meshopt + texturas WebP/KTX2) **comprobando que se conservan los morph targets**.

> Los nombres exactos que espera TalkingHead deben verificarse en su README antes de implementar; esta lista es la referencia inicial.

## 4. Lip sync en español
- El lip sync integrado de TalkingHead **no incluye español** (solo inglés, alemán, francés, finés y lituano).
- Usar los **eventos de visemas de Azure TTS** y pasarlos a TalkingHead (método `speakAudio` con visemas y tiempos). Implementar el mapeo **ID de visema Azure (0–21) → visema Oculus** en `src/motor/avatar/mapaVisemas.ts`, con test unitario.
- Respaldo si el TTS no da visemas (voz del navegador u otro proveedor): clase propia palabra→visema para español (reglas grafema→fonema sencillas: vocales a/e/i/o/u; p/b/m → PP; f → FF; s/z/c → SS…). Documentar la decisión en `PROGRESS.md`.

## 5. Script de validación (implementar en F3)
`npm run validar-avatares`: script Node con `@gltf-transform/core` (portar `scripts/avatares/inspect_glb.py`) que, para cada GLB de `config/casos.json`:
1. Comprueba que el archivo existe y su tamaño.
2. Cuenta triángulos y tamaño máximo de textura.
3. Lista los morph targets y verifica los obligatorios del §3 (avisa de los recomendados que faltan).
4. Verifica los huesos mínimos.
5. Imprime un informe `OK / AVISO / ERROR` y sale con código ≠ 0 si falta algo obligatorio.

En la app, al cargar el avatar:
- Si faltan visemas → avatar sin lip sync y aviso en modo debug.
- Si el GLB no carga o WebGL falla → **imagen estática** de respaldo con un indicador animado de "hablando" (onda o borde pulsante).

## 6. Página de prueba del avatar (F3)
Ruta `/debug/avatar?caso=n1_paracetamol`:
- Carga el GLB sobre su fondo, en plano medio.
- Botones para probar cada emoción (neutral, preocupado, enfadado, triste, aliviado).
- Campo de texto → TTS → lip sync, para revisar la sincronía en español.
- Control de cámara (encuadre/altura) cuyos valores se copian a `config/casos.json` (`avatar.camara`).

## 7. Fondos
- Fotos de bancos libres (Unsplash, Pexels; revisar licencia), generadas con IA o renderizadas en Blender. Sin personas reconocibles ni logos de hospitales reales.
- 1920×1080 JPG/WebP, ligeramente desenfocados, como en una videollamada.

## 8. Checklist antes de F3
- [x] `antonio.glb`, `lucia.glb`, `antonio.jpg`, `lucia.jpg` en `public/avatars/`.
- [x] Morphs, huesos y materiales verificados en TalkingHead.
- [ ] Implementar `npm run validar-avatares` (Node) y la página `/debug/avatar`.
- [x] Dos fondos provisionales en `public/fondos/` (Wikimedia Commons, CC BY-SA; ver `public/fondos/CREDITOS.md`). Se sustituirán por fotos propias del hospital.
- [ ] Añadir en la app una página o pie de "Créditos" con la atribución de los fondos (obligatorio por la licencia).
- [ ] Ajustes estéticos que pida el docente tras ver los avatares en la app (editar `scripts/avatares/config/*.json`).
