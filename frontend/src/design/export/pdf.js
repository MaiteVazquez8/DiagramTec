/** Generación y descarga de PDF a partir del canvas del diagrama. */
import { jsPDF } from 'jspdf';
import { getDiagramBounds } from '../math/bounds.js';
import { EXPORT_DEFAULTS } from '../constants/canvas.js';
import { canvasToPngDataUrl } from './capture.js';

/**
 * PDF embebido para guardar en API (mismas dimensiones que preview).
 * @param {HTMLCanvasElement} canvas
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
export function buildInlinePdfDataUrl(canvas, width, height) {
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
  });
  const img = canvas.toDataURL('image/png', 1);
  pdf.addImage(img, 'PNG', 0, 0, width, height);
  return pdf.output('datauristring');
}

/**
 * Descarga PDF ajustado al contenido real del diagrama.
 * @param {HTMLCanvasElement} canvas
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {string} [filename]
 * @returns {string} data URI del PDF para persistencia opcional
 */
export function downloadDiagramPdf(canvas, shapes, filename = 'diagrama') {
  const bounds = getDiagramBounds(shapes, { padding: EXPORT_DEFAULTS.pdfPadding });
  const highResImg = canvasToPngDataUrl(canvas);

  const pdf = new jsPDF({
    orientation: bounds.width > bounds.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [bounds.width, bounds.height],
  });

  pdf.addImage(highResImg, 'PNG', 0, 0, bounds.width, bounds.height);

  let dataUri = '';
  try {
    dataUri = pdf.output('datauristring');
  } catch (err) {
    console.warn('PDF descargado; no se pudo generar copia para guardar en servidor:', err);
  }

  pdf.save(`${filename}.pdf`);
  return dataUri;
}
