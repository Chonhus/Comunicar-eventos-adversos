import { Link } from 'react-router-dom';

export default function InicioPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold">
        Simulador de comunicación de eventos adversos
      </h1>
      <p className="text-slate-600">
        Formación en seguridad del paciente: practica hablar con un avatar en
        una videollamada simulada.
      </p>
      <Link
        to="/acceso"
        className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700"
      >
        Empezar
      </Link>
      <Link to="/creditos" className="text-xs text-slate-400 underline">
        Créditos
      </Link>
    </main>
  );
}
