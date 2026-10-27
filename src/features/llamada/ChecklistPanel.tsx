import { checklistConfig } from '@/lib/config';
import ChecklistItemView from './ChecklistItemView';
import type { ChecklistEngine } from './ChecklistEngine';

export default function ChecklistPanel({ checklist }: { checklist: ChecklistEngine }) {
  const estados = new Map(checklist.obtenerItems().map((i) => [i.id, i]));
  const alertas = checklist.obtenerAlertas();

  return (
    <aside className="flex w-full flex-col gap-3 border-t border-slate-200 bg-white p-4 md:w-72 md:border-l md:border-t-0">
      <h2 className="text-sm font-semibold text-slate-500">Checklist</h2>
      <ul className="flex flex-col gap-1">
        {checklistConfig.items
          .filter((item) => item.activo)
          .map((item) => (
            <ChecklistItemView
              key={item.id}
              etiqueta={item.etiqueta}
              calidad={estados.get(item.id)?.calidad ?? 'pendiente'}
              evidencia={estados.get(item.id)?.evidencia}
            />
          ))}
      </ul>

      {alertas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-600">⚠ Alertas</h3>
          <ul className="mt-1.5 flex flex-col gap-1">
            {alertas.map((a) => {
              const definicion = checklistConfig.alertas.find((x) => x.id === a.id);
              return (
                <li
                  key={a.id}
                  title={a.evidencia}
                  className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800"
                >
                  {definicion?.etiqueta ?? a.id}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}
