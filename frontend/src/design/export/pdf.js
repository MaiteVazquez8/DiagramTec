/** Generación y descarga de PDF a partir del canvas del diagrama con marca de agua. */
import { jsPDF } from 'jspdf';
import { getDiagramBounds } from '../math/bounds.js';
import { EXPORT_DEFAULTS } from '../constants/canvas.js';
import { canvasToPngDataUrl } from './capture.js';

/** Ruta del logo DiagramTec usado como marca de agua (public/Diagram(3).png). */
const WATERMARK_SRC = '/Diagram(3).png';
const WATERMARK_OPACITY = 0.2;              // Transparencia de la marca de agua
const WATERMARK_MAX_WIDTH_RATIO = 0.4;      // Tamaño máximo relativo a la página

// Caché en memoria para no recargar la imagen en cada exportación
let watermarkCache = null;
let watermarkLoadPromise = null;

/**
 * Carga y escala el logo de marca de agua una sola vez; devuelve dataUrl y dimensiones.
 * @returns {Promise<{ dataUrl: string, width: number, height: number } | null>}
 */
function loadWatermark() {
  if (watermarkCache) return Promise.resolve(watermarkCache);
  if (watermarkLoadPromise) return watermarkLoadPromise;

  watermarkLoadPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Redimensionar a máximo 512px en el lado mayor para optimizar el PDF
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

// Precargar la marca de agua al importar el módulo
loadWatermark();

/**
 * Superpone el logo DiagramTec centrado con transparencia sobre el PDF.
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
 * Genera un PDF embebido como data URI (para guardar en API).
 * Usa las dimensiones exactas del canvas capturado.
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
 * Descarga un PDF ajustado al contenido real del diagrama con marca de agua.
 * También devuelve el data URI para persistencia opcional en servidor.
 * @param {HTMLCanvasElement} canvas
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {string} [filename]
 * @returns {Promise<string>} data URI del PDF
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
