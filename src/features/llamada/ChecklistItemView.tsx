import type { CalidadItem } from './ChecklistEngine';

interface Props {
  etiqueta: string;
  calidad: CalidadItem;
  evidencia?: string;
}

export default function ChecklistItemView({ etiqueta, calidad, evidencia }: Props) {
  const estilos: Record<CalidadItem, string> = {
    pendiente: 'text-slate-500',
    parcial: 'bg-green-50/70 text-green-700',
    completo: 'bg-green-50 text-green-800',
  };

  return (
    <li
      title={evidencia}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${estilos[calidad]}`}
    >
      <span aria-hidden className={calidad === 'completo' ? 'scale-110 transition-transform' : ''}>
        {calidad === 'pendiente' ? '☐' : '✔'}
      </span>
      <span>{etiqueta}</span>
      {calidad === 'parcial' && (
        <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-green-700">
          parcial
        </span>
      )}
    </li>
  );
}
