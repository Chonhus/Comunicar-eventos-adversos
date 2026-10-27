// docs/SPEC.md §3.7 — PDF de la evaluación final, generado en cliente con jsPDF
// (verificado contra node_modules/jspdf/types/index.d.ts: jsPDF, text, setFont,
// setFontSize, splitTextToSize, addPage, save).
import { jsPDF } from 'jspdf';
import type { Caso } from '@/lib/config/schemas';
import type { ResultadoIntento } from '@/lib/progreso';

const MARGEN = 15;

export function generarPdfEvaluacionFinal(datos: {
  casos: Caso[];
  resultados: ResultadoIntento[];
  notaFormacion: number | null;
}): void {
  const doc = new jsPDF();
  const anchoUtil = doc.internal.pageSize.getWidth() - MARGEN * 2;
  let y = MARGEN;

  function saltoDeLineaSiHaceFalta(alto: number): void {
    if (y + alto > doc.internal.pageSize.getHeight() - MARGEN) {
      doc.addPage();
      y = MARGEN;
    }
  }

  function escribirParrafo(texto: string, tamanoFuente = 11): void {
    doc.setFontSize(tamanoFuente);
    const lineas = doc.splitTextToSize(texto, anchoUtil) as string[];
    for (const linea of lineas) {
      saltoDeLineaSiHaceFalta(6);
      doc.text(linea, MARGEN, y);
      y += 6;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Evaluación final — Comunicación de eventos adversos', MARGEN, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  if (datos.notaFormacion !== null) {
    escribirParrafo(`Nota del módulo formativo (mini-test): ${datos.notaFormacion}/10`);
    y += 2;
  }

  for (const caso of [...datos.casos].sort((a, b) => a.nivel - b.nivel)) {
    const resultadosCaso = datos.resultados
      .filter((r) => r.casoId === caso.id)
      .sort((a, b) => a.intento - b.intento);
    if (resultadosCaso.length === 0) continue;

    saltoDeLineaSiHaceFalta(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Nivel ${caso.nivel} — ${caso.titulo}`, MARGEN, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    for (const resultado of resultadosCaso) {
      saltoDeLineaSiHaceFalta(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Intento ${resultado.intento}: ${resultado.puntuacion}/100`, MARGEN, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      escribirParrafo(resultado.evaluacion.resumen || '(sin resumen)');
      if (resultado.evaluacion.fortalezas.length > 0) {
        escribirParrafo(`Fortalezas: ${resultado.evaluacion.fortalezas.join(' · ')}`, 10);
      }
      y += 2;
    }
    y += 4;
  }

  doc.save('evaluacion-final.pdf');
}
