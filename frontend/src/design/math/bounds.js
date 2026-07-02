/** Rectángulo envolvente del diagrama para recortar capturas html2canvas. */
import { EXPORT_DEFAULTS } from '../constants/canvas.js';

/**
 * @typedef {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }} DiagramBounds
 */

/**
 * Caja envolvente de todas las figuras.
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {{ padding?: number, fallbackWidth?: number, fallbackHeight?: number }} [options]
 * @returns {DiagramBounds}
 */
export function getDiagramBounds(shapes, options = {}) {
  const padding = options.padding ?? EXPORT_DEFAULTS.padding;
  const fallbackWidth = options.fallbackWidth ?? EXPORT_DEFAULTS.minCaptureWidth;
  const fallbackHeight = options.fallbackHeight ?? EXPORT_DEFAULTS.minCaptureHeight;

  if (!shapes.length) {
    return {
      minX: 0,
      minY: 0,
      maxX: fallbackWidth,
      maxY: fallbackHeight,
      width: fallbackWidth,
      height: fallbackHeight,
    };
  }

  const minX = Math.min(...shapes.map((s) => s.x));
  const minY = Math.min(...shapes.map((s) => s.y));
  const maxX = Math.max(...shapes.map((s) => s.x + s.width));
  const maxY = Math.max(...shapes.map((s) => s.y + s.height));

  const width = Math.max(fallbackWidth, maxX - minX + padding * 2);
  const height = Math.max(fallbackHeight, maxY - minY + padding * 2);

  return { minX, minY, maxX, maxY, width, height };
}

/**
 * Opciones para html2canvas según bounds.
 * @param {DiagramBounds} bounds
 * @param {{ padding?: number }} [options]
 */
export function captureRegionFromBounds(bounds, options = {}) {
  const padding = options.padding ?? EXPORT_DEFAULTS.padding;
  return {
    x: bounds.minX - padding,
    y: bounds.minY - padding,
    width: bounds.width,
    height: bounds.height,
  };
}
