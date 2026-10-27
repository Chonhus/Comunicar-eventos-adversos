import { useState } from 'react';

export default function ModoTextoDebug({ onEnviar }: { onEnviar: (texto: string) => void }) {
  const [texto, setTexto] = useState('');

  function enviar() {
    if (!texto.trim()) return;
    onEnviar(texto.trim());
    setTexto('');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
      className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-4 py-2"
    >
      <span className="shrink-0 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
        debug
      </span>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escribe lo que diría el alumno (sin micrófono)…"
        className="flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-500"
      />
      <button
        type="submit"
        className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
      >
        Enviar
      </button>
    </form>
  );
}
