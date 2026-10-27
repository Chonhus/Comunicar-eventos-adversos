import { useState } from 'react';
import { preguntasTest } from './contenido';

export default function MiniTest({ onFinalizar }: { onFinalizar: (notaSobre10: number) => void }) {
  const [indice, setIndice] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [seleccion, setSeleccion] = useState<number | null>(null);

  const pregunta = preguntasTest[indice];
  const esUltima = indice === preguntasTest.length - 1;

  function elegir(opcionIndex: number) {
    if (seleccion !== null) return; // ya respondida
    setSeleccion(opcionIndex);
    if (pregunta.opciones[opcionIndex].correcta) setAciertos((a) => a + 1);
  }

  function siguiente() {
    if (esUltima) {
      const totalAciertos = aciertos; // "aciertos" ya incluye la respuesta actual (se actualizó en elegir)
      onFinalizar(Math.round((totalAciertos / preguntasTest.length) * 10));
      return;
    }
    setIndice((i) => i + 1);
    setSeleccion(null);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">
        Pregunta {indice + 1} de {preguntasTest.length}
      </p>
      <h2 className="mt-1 text-lg font-semibold">{pregunta.enunciado}</h2>
      <div className="mt-4 flex flex-col gap-2">
        {pregunta.opciones.map((opcion, i) => {
          const respondida = seleccion !== null;
          const esLaElegida = seleccion === i;
          const estilo = !respondida
            ? 'border-slate-200 hover:border-slate-400'
            : opcion.correcta
              ? 'border-green-500 bg-green-50'
              : esLaElegida
                ? 'border-red-400 bg-red-50'
                : 'border-slate-200 opacity-60';
          return (
            <button
              key={i}
              type="button"
              onClick={() => elegir(i)}
              disabled={respondida}
              className={`rounded-lg border px-4 py-2.5 text-left text-sm transition ${estilo}`}
            >
              {opcion.texto}
            </button>
          );
        })}
      </div>
      {seleccion !== null && (
        <button
          type="button"
          onClick={siguiente}
          className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {esUltima ? 'Ver resultado' : 'Siguiente pregunta'}
        </button>
      )}
    </div>
  );
}
