import TextoConEnfasis from './TextoConEnfasis';
import type { BloqueFormacion } from './tipos';

export default function TarjetaBloque({ bloque }: { bloque: BloqueFormacion }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{bloque.titulo}</h2>
      <ul className="mt-4 space-y-2 text-slate-700">
        {bloque.contenido.map((linea, i) => (
          <li key={i}>
            <TextoConEnfasis texto={linea} />
          </li>
        ))}
      </ul>
      {bloque.puntosClave && (
        <div className="mt-5 flex flex-wrap gap-2">
          {bloque.puntosClave.map((p) => (
            <span
              key={p}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
