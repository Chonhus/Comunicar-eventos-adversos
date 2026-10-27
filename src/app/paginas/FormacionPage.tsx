import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bloques } from '@/features/formacion/contenido';
import TarjetaBloque from '@/features/formacion/TarjetaBloque';
import MiniTest from '@/features/formacion/MiniTest';
import { obtenerCasoPorNivel } from '@/lib/config';
import { guardarNotaFormacion } from '@/lib/progreso';

type Fase = { tipo: 'bloque'; indice: number } | { tipo: 'test' } | { tipo: 'resultado'; nota: number };

export default function FormacionPage() {
  const [fase, setFase] = useState<Fase>({ tipo: 'bloque', indice: 0 });
  const navigate = useNavigate();

  const pasosTotales = bloques.length + 1; // + mini-test
  const pasoActual = fase.tipo === 'bloque' ? fase.indice + 1 : pasosTotales;
  const progresoPct = Math.round((pasoActual / pasosTotales) * 100);

  function continuarAlNivel1() {
    const caso = obtenerCasoPorNivel(1);
    navigate(`/briefing/${caso.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-xl font-semibold">Módulo formativo</h1>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-slate-900 transition-all"
          style={{ width: `${progresoPct}%` }}
        />
      </div>

      <div className="mt-6">
        {fase.tipo === 'bloque' && (
          <>
            <TarjetaBloque bloque={bloques[fase.indice]} />
            <div className="mt-5 flex justify-between">
              <button
                type="button"
                onClick={() => setFase({ tipo: 'bloque', indice: fase.indice - 1 })}
                disabled={fase.indice === 0}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-0"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() =>
                  fase.indice === bloques.length - 1
                    ? setFase({ tipo: 'test' })
                    : setFase({ tipo: 'bloque', indice: fase.indice + 1 })
                }
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                {fase.indice === bloques.length - 1 ? 'Empezar mini-test' : 'Siguiente'}
              </button>
            </div>
          </>
        )}

        {fase.tipo === 'test' && (
          <MiniTest
            onFinalizar={(nota) => {
              guardarNotaFormacion(nota);
              setFase({ tipo: 'resultado', nota });
            }}
          />
        )}

        {fase.tipo === 'resultado' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-500">Mini-test completado</p>
            <p className="mt-1 text-3xl font-semibold">{fase.nota} / 10</p>
            <p className="mt-2 text-sm text-slate-600">
              La nota queda registrada; no bloquea el acceso al Nivel 1.
            </p>
            <button
              type="button"
              onClick={continuarAlNivel1}
              className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Continuar al Nivel 1
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
