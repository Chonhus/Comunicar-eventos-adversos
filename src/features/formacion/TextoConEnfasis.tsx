// Soporta únicamente **negrita**, suficiente para el contenido de docs/FORMACION.md.
export default function TextoConEnfasis({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((parte, i) =>
        parte.startsWith('**') && parte.endsWith('**') ? (
          <strong key={i}>{parte.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}
