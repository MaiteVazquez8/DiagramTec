/** Generación y descarga de PDF a partir del canvas del diagrama. */
import { jsPDF } from 'jspdf';
import { getDiagramBounds } from '../math/bounds.js';
import { EXPORT_DEFAULTS } from '../constants/canvas.js';
import { canvasToPngDataUrl } from './capture.js';

/** Logo DiagramTec usado como marca de agua (public/Diagram(3).png). */
const WATERMARK_SRC = '/Diagram(3).png';
const WATERMARK_OPACITY = 0.2;
const WATERMARK_MAX_WIDTH_RATIO = 0.4;

let watermarkCache = null;
let watermarkLoadPromise = null;

function loadWatermark() {
  if (watermarkCache) return Promise.resolve(watermarkCache);
  if (watermarkLoadPromise) return watermarkLoadPromise;

  watermarkLoadPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 512;
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      watermarkCache = { dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
      resolve(watermarkCache);
    };
    img.onerror = () => {
      console.warn('No se pudo cargar la marca de agua del PDF:', WATERMARK_SRC);
      resolve(null);
    };
    img.src = WATERMARK_SRC;
  });

  return watermarkLoadPromise;
}

loadWatermark();

/**
 * Superpone el logo DiagramTec centrado con transparencia.
 * @param {import('jspdf').jsPDF} pdf
 */
async function applyDiagramTecWatermark(pdf) {
  const wm = await loadWatermark();
  if (!wm) return;

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const scale = Math.min(
    (pageW * WATERMARK_MAX_WIDTH_RATIO) / wm.width,
    (pageH * WATERMARK_MAX_WIDTH_RATIO) / wm.height,
  );
  const w = wm.width * scale;
  const h = wm.height * scale;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;

  pdf.saveGraphicsState();
  pdf.setGState(new pdf.GState({ opacity: WATERMARK_OPACITY }));
  pdf.addImage(wm.dataUrl, 'PNG', x, y, w, h);
  pdf.restoreGraphicsState();
}

/**
 * PDF embebido para guardar en API (mismas dimensiones que preview).
 * @param {HTMLCanvasElement} canvas
 * @param {number} width
 * @param {number} height
 * @returns {Promise<string>}
 */
export async function buildInlinePdfDataUrl(canvas, width, height) {
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
  });
  const img = canvas.toDataURL('image/png', 1);
  pdf.addImage(img, 'PNG', 0, 0, width, height);
  await applyDiagramTecWatermark(pdf);
  return pdf.output('datauristring');
}

/**
 * Descarga PDF ajustado al contenido real del diagrama.
 * @param {HTMLCanvasElement} canvas
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {string} [filename]
 * @returns {Promise<string>} data URI del PDF para persistencia opcional
 */
export async function downloadDiagramPdf(canvas, shapes, filename = 'diagrama') {
  const bounds = getDiagramBounds(shapes, { padding: EXPORT_DEFAULTS.pdfPadding });
  const highResImg = canvasToPngDataUrl(canvas);

  const pdf = new jsPDF({
    orientation: bounds.width > bounds.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [bounds.width, bounds.height],
  });

  pdf.addImage(highResImg, 'PNG', 0, 0, bounds.width, bounds.height);
  await applyDiagramTecWatermark(pdf);

  let dataUri = '';
  try {
    dataUri = pdf.output('datauristring');
  } catch (err) {
    console.warn('PDF descargado; no se pudo generar copia para guardar en servidor:', err);
  }

  pdf.save(`${filename}.pdf`);
  return dataUri;
}
