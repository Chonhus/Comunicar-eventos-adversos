import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ConsentimientoPage() {
  const [aceptado, setAceptado] = useState(false);
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold">Antes de empezar</h1>
      <p className="text-slate-700">
        Durante la práctica se te pedirá hablar por micrófono. Tu voz se
        transcribe y se procesa con servicios externos de reconocimiento y
        síntesis de voz, y con Anthropic (Claude) para generar las respuestas
        del personaje, preferentemente en la Unión Europea, solo con fines
        formativos. Se guarda la transcripción y la evaluación de cada
        intento. Todos los casos son ficticios.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
        />
        He leído la información anterior y acepto activar el micrófono.
      </label>
      <button
        type="button"
        disabled={!aceptado}
        onClick={() => navigate('/formacion')}
        className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white disabled:opacity-40"
      >
        Acepto y activar micrófono
      </button>
    </main>
  );
}
