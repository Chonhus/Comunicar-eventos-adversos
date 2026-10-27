// docs/RUBRICA.md §3 — la puntuación numérica final la calcula el código (no el
// modelo), para que sea reproducible: Puntuación = (Σ puntos × peso) / (Σ máximo × peso)
// × 100, menos 5 puntos (configurable por alerta) por cada alerta detectada, mínimo 0.
import type { ChecklistConfig } from '@/lib/config/schemas';
import type { AlertaEvaluada, ItemEvaluado } from './tipos';

export function calcularPuntuacion(
  evaluacion: { items: ItemEvaluado[]; alertas: AlertaEvaluada[] },
  checklist: ChecklistConfig,
): number {
  const pesoPorId = new Map(checklist.items.filter((i) => i.activo).map((i) => [i.id, i.peso]));

  let sumaPuntos = 0;
  let sumaMaximo = 0;
  for (const item of evaluacion.items) {
    const peso = pesoPorId.get(item.id);
    if (peso === undefined) continue; // id desconocido o ítem desactivado: se ignora
    sumaPuntos += item.puntuacion * peso;
    sumaMaximo += 2 * peso;
  }
  if (sumaMaximo === 0) return 0;

  const penalizacionPorId = new Map(checklist.alertas.map((a) => [a.id, a.penalizacion]));
  const penalizacionTotal = evaluacion.alertas.reduce((acc, a) => acc + (penalizacionPorId.get(a.id) ?? 0), 0);

  const base = (sumaPuntos / sumaMaximo) * 100;
  return Math.max(0, Math.round(base - penalizacionTotal));
}
