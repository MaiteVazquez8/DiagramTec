/**
 * Captura del lienzo como imagen (preview PNG transparente y alta resolución para PDF).
 */
import html2canvas from 'html2canvas';
import { getDiagramBounds, captureRegionFromBounds } from '../math/bounds.js';
import { EXPORT_DEFAULTS } from '../constants/canvas.js';

/**
 * Quita transform de zoom en el clon de html2canvas.
 * @param {Document} clonedDoc
 */
export function resetZoomLayerInClone(clonedDoc) {
  const zoomLayer = clonedDoc.querySelector('.canvas-zoom-layer');
  if (zoomLayer) {
    zoomLayer.style.transform = 'none';
    zoomLayer.style.background = 'transparent';
  }

  clonedDoc.querySelector('.canvas-bg')?.remove();

  const wrapper = clonedDoc.querySelector('.editor-canvas-fs');
  if (wrapper) {
    wrapper.style.background = 'transparent';
    wrapper.style.backgroundImage = 'none';
  }
}

/**
 * @param {HTMLElement} canvasElement
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {import('html2canvas').Options & { padding?: number }} [options]
 */
export async function captureDiagramPreview(canvasElement, shapes, options = {}) {
  const bounds = getDiagramBounds(shapes, {
    padding: options.padding ?? EXPORT_DEFAULTS.padding,
  });
  const region = captureRegionFromBounds(bounds, { padding: options.padding });

  const backgroundColor =
    options.backgroundColor !== undefined
      ? options.backgroundColor
      : EXPORT_DEFAULTS.previewBackground;

  return html2canvas(canvasElement, {
    backgroundColor,
    scale: options.scale ?? EXPORT_DEFAULTS.previewScale,
    logging: false,
    useCORS: true,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    onclone: resetZoomLayerInClone,
    ...options,
  });
}

/**
 * @param {HTMLElement} canvasElement
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {import('html2canvas').Options & { padding?: number }} [options]
 */
export async function captureDiagramHighRes(canvasElement, shapes, options = {}) {
  const padding = options.padding ?? EXPORT_DEFAULTS.pdfPadding;
  const bounds = getDiagramBounds(shapes, {
    padding,
  });
  const region = captureRegionFromBounds(bounds, { padding });

  return html2canvas(canvasElement, {
    backgroundColor: options.backgroundColor ?? EXPORT_DEFAULTS.pdfBackground,
    scale: options.scale ?? EXPORT_DEFAULTS.pdfScale,
    logging: false,
    useCORS: true,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    onclone: resetZoomLayerInClone,
    ...options,
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} [quality]
 */
export function canvasToJpegDataUrl(canvas, quality = EXPORT_DEFAULTS.jpegQuality) {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export function canvasToPngDataUrl(canvas) {
  return canvas.toDataURL('image/png', 1);
}
