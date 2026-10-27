// Exportación CSV del panel docente (docs/SPEC.md §3.8) — sin librería, es solo texto.
function escaparCampoCsv(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function construirCsv(cabecera: string[], filas: unknown[][]): string {
  const lineas = [cabecera, ...filas].map((fila) => fila.map(escaparCampoCsv).join(','));
  return lineas.join('\n');
}

export function descargarCsv(nombreArchivo: string, contenido: string): void {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
