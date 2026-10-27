// docs/AVATARES.md §8 — obligación de la licencia CC BY-SA de los fondos
// provisionales: mostrar la atribución en la app.
import { Link } from 'react-router-dom';

const FONDOS = [
  {
    archivo: 'habitacion.jpg',
    original: 'Private Room - VIP - RSU MMC.jpg',
    url: 'https://commons.wikimedia.org/wiki/File:Private_Room_-_VIP_-_RSU_MMC.jpg',
    autor: 'RSU. Manado Medical Center',
    licencia: 'CC BY-SA 4.0',
    licenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    archivo: 'sala-informacion.jpg',
    original: 'BGH - Beratungszimmer.JPG',
    url: 'https://commons.wikimedia.org/wiki/File:BGH_-_Beratungszimmer.JPG',
    autor: 'ComQuat',
    licencia: 'CC BY-SA 3.0',
    licenciaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
];

export default function CreditosPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Créditos</h1>
      <p className="text-slate-600">
        Los fondos de la videollamada son provisionales (hasta tener fotos propias del hospital) y se usan bajo
        licencia Creative Commons, que exige mostrar esta atribución.
      </p>
      <ul className="flex flex-col gap-4">
        {FONDOS.map((f) => (
          <li key={f.archivo} className="rounded-lg border border-slate-200 p-4 text-sm">
            <p className="font-medium">{f.archivo}</p>
            <p>
              Original:{' '}
              <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {f.original}
              </a>
            </p>
            <p>Autor: {f.autor}</p>
            <p>
              Licencia:{' '}
              <a href={f.licenciaUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {f.licencia}
              </a>
            </p>
          </li>
        ))}
      </ul>
      <Link to="/" className="text-sm text-slate-500 underline">
        Volver al inicio
      </Link>
    </main>
  );
}
