// Las Edge Functions de Supabase (local y en la nube) solo empaquetan
// supabase/functions/: no pueden leer config/*.json con una ruta relativa que
// salga de ahí. Este script copia la config canónica a
// supabase/functions/_shared/data/ para que las funciones la lean desde dentro
// de su propio árbol. Ejecutar tras editar config/casos.json, config/checklist.json
// o config/personajes/*.json, y siempre antes de `supabase functions serve`/`deploy`.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const destino = path.join(raiz, 'supabase/functions/_shared/data');
mkdirSync(destino, { recursive: true });

function copiarJson(origenRel) {
  const origen = path.join(raiz, origenRel);
  const nombre = path.basename(origenRel);
  writeFileSync(path.join(destino, nombre), readFileSync(origen, 'utf-8'));
  console.log(`✓ ${origenRel} -> supabase/functions/_shared/data/${nombre}`);
}

copiarJson('config/casos.json');
copiarJson('config/checklist.json');

mkdirSync(path.join(destino, 'personajes'), { recursive: true });
cpSync(path.join(raiz, 'config/personajes'), path.join(destino, 'personajes'), { recursive: true });
console.log('✓ config/personajes/ -> supabase/functions/_shared/data/personajes/');
