// docs/AVATARES.md §5 — porta scripts/avatares/inspect_glb.py (Python/Blender) a Node,
// para poder correrlo con `npm run validar-avatares` sin depender de Blender/bpy.
import { existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import casosJson from '../config/casos.json' with { type: 'json' };

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Los GLB usan texturas WebP (docs/AVATARES.md §1): sin registrar la extensión,
// gltf-transform rechaza el archivo como inválido.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// Obligatorios — docs/AVATARES.md §3.
const VISEMAS_OBLIGATORIOS = [
  'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH', 'viseme_DD', 'viseme_kk',
  'viseme_CH', 'viseme_SS', 'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E',
  'viseme_I', 'viseme_O', 'viseme_U',
];
const PARPADEO_OBLIGATORIO = ['eyeBlinkLeft', 'eyeBlinkRight'];
const HUESOS_OBLIGATORIOS = ['Hips', 'Spine', 'Neck', 'Head', 'LeftEye', 'RightEye'];

// Recomendados (expresiones ARKit) — se avisa si faltan, no bloquea.
const ARKIT_RECOMENDADOS = [
  'browInnerUp', 'browDownLeft', 'browDownRight', 'mouthSmileLeft', 'mouthSmileRight',
  'mouthFrownLeft', 'mouthFrownRight', 'jawOpen', 'eyeSquintLeft', 'eyeSquintRight',
];

const MAX_TRIANGULOS = 50_000;
const MAX_TEXTURA_PX = 2048;
const MAX_TAMANO_MB = 15;

interface ResultadoValidacion {
  errores: string[];
  avisos: string[];
}

async function validarGlb(ruta: string): Promise<ResultadoValidacion> {
  const errores: string[] = [];
  const avisos: string[] = [];

  if (!existsSync(ruta)) {
    errores.push(`No existe el archivo: ${ruta}`);
    return { errores, avisos };
  }

  const tamanoMb = statSync(ruta).size / (1024 * 1024);
  if (tamanoMb > MAX_TAMANO_MB) avisos.push(`Tamaño ${tamanoMb.toFixed(1)} MB > ${MAX_TAMANO_MB} MB (ideal < 8 MB)`);

  const documento = await io.read(ruta);
  const root = documento.getRoot();

  const nombresNodos = new Set(root.listNodes().map((n) => n.getName()));
  for (const hueso of HUESOS_OBLIGATORIOS) {
    if (!nombresNodos.has(hueso)) errores.push(`Falta el hueso obligatorio "${hueso}"`);
  }

  let triangulos = 0;
  const nombresMorph = new Set<string>();
  for (const mesh of root.listMeshes()) {
    const targetNames = (mesh.getExtras().targetNames as string[] | undefined) ?? [];
    for (const nombre of targetNames) nombresMorph.add(nombre);
    for (const primitiva of mesh.listPrimitives()) {
      const indices = primitiva.getIndices();
      if (indices) triangulos += indices.getCount() / 3;
    }
  }

  for (const v of VISEMAS_OBLIGATORIOS) {
    if (!nombresMorph.has(v)) errores.push(`Falta el morph target obligatorio "${v}"`);
  }
  for (const p of PARPADEO_OBLIGATORIO) {
    if (!nombresMorph.has(p)) errores.push(`Falta el morph target obligatorio "${p}"`);
  }
  for (const a of ARKIT_RECOMENDADOS) {
    if (!nombresMorph.has(a)) avisos.push(`Falta el morph target recomendado "${a}" (ARKit)`);
  }

  if (triangulos > MAX_TRIANGULOS) avisos.push(`${triangulos} triángulos > ${MAX_TRIANGULOS} recomendado`);

  let texturaMaxPx = 0;
  for (const textura of root.listTextures()) {
    const tam = textura.getSize();
    if (tam) texturaMaxPx = Math.max(texturaMaxPx, tam[0], tam[1]);
  }
  if (texturaMaxPx > MAX_TEXTURA_PX) avisos.push(`Textura de ${texturaMaxPx}px > ${MAX_TEXTURA_PX}px recomendado`);

  console.log(
    `  ${tamanoMb.toFixed(1)} MB | ${triangulos} triángulos | textura máx ${texturaMaxPx}px | ` +
      `${nombresMorph.size} morph targets | ${nombresNodos.size} huesos`,
  );

  return { errores, avisos };
}

async function main(): Promise<void> {
  let huboError = false;

  for (const caso of casosJson.casos) {
    const ruta = resolve(REPO_ROOT, 'public', caso.avatar.glb.replace(/^\//, ''));
    console.log(`\n${caso.avatar.nombre} — ${ruta}`);

    const { errores, avisos } = await validarGlb(ruta);
    for (const aviso of avisos) console.log(`  AVISO: ${aviso}`);
    for (const error of errores) console.log(`  ERROR: ${error}`);
    if (errores.length === 0 && avisos.length === 0) console.log('  OK');
    if (errores.length > 0) huboError = true;
  }

  if (huboError) {
    console.error('\nValidación FALLIDA: hay avatares con requisitos obligatorios incumplidos.');
    process.exit(1);
  }
  console.log('\nValidación OK.');
}

main().catch((e: unknown) => {
  console.error('Fallo validando avatares:', e);
  process.exit(1);
});
