// Los modelos a veces envuelven el JSON en ```json ... ``` pese a que se les pide que
// no lo hagan; esto lo tolera antes de parsear (usado por detectar-items y evaluar-intento).
export function extraerJson(texto: string): unknown {
  const limpio = texto.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(limpio);
}
