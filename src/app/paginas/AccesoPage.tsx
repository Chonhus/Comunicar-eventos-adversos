import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerAlumnoLocal, olvidarAlumnoLocal, unirseAGrupo } from '@/lib/accesoAlumno';

export default function AccesoPage() {
  const navigate = useNavigate();
  const alumnoLocal = obtenerAlumnoLocal();

  const [codigo, setCodigo] = useState('');
  const [alias, setAlias] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !alias.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      await unirseAGrupo(codigo, alias);
      navigate('/consentimiento');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setEnviando(false);
    }
  }

  if (alumnoLocal) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">¡Hola de nuevo, {alumnoLocal.alias}!</h1>
        <button
          type="button"
          onClick={() => navigate('/consentimiento')}
          className="w-full rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700"
        >
          Continuar
        </button>
        <button
          type="button"
          onClick={() => {
            olvidarAlumnoLocal();
            window.location.reload();
          }}
          className="text-sm text-slate-500 underline"
        >
          No soy yo / unirme con otro código
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <p className="text-sm text-slate-600">Pide a tu docente el código de tu grupo.</p>
      <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-3">
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código de grupo"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          autoComplete="off"
        />
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Tu nombre o alias"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          autoComplete="off"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={enviando || !codigo.trim() || !alias.trim()}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
