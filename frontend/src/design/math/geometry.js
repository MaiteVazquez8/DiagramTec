/**
 * Utilidades geométricas para el editor de diagramas.
 */

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x: number, y: number, width: number, height: number }} Rect */

/**
 * @param {import('../models/shape.js').Shape} shape
 * @returns {Point}
 */
export function shapeCenter(shape) {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

/**
 * @param {number} dx
 * @param {number} dy
 * @returns {number}
 */
export function vectorLength(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Escala hasta el borde de una elipse (inicio/fin).
 * @param {import('../models/shape.js').Shape} shape
 * @param {number} dx
 * @param {number} dy
 * @param {number} dist
 */
export function ellipseBorderScale(shape, dx, dy, dist) {
  const angle = Math.atan2(dy, dx);
  const rx = shape.width / 2;
  const ry = shape.height / 2;
  const radius =
    (rx * ry) /
    Math.sqrt(
      Math.pow(ry * Math.cos(angle), 2) + Math.pow(rx * Math.sin(angle), 2)
    );
  return radius / dist;
}

/**
 * Escala hasta el borde de un rectángulo axis-aligned.
 * @param {import('../models/shape.js').Shape} shape
 * @param {number} absDx
 * @param {number} absDy
 */
export function rectBorderScale(shape, absDx, absDy) {
  const scaleX = absDx === 0 ? Infinity : shape.width / 2 / absDx;
  const scaleY = absDy === 0 ? Infinity : shape.height / 2 / absDy;
  return Math.min(scaleX, scaleY);
}

/**
 * @param {Rect} rect
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
 */
export function rectExtents(rect) {
  return {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height,
  };
}
