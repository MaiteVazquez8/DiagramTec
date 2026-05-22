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
 * Intersección rayo–segmento: P = origin + t * direction.
 * @returns {number | null} t mínimo positivo
 */
function raySegmentIntersectionT(origin, direction, a, b) {
  const { x: ox, y: oy } = origin;
  const { x: dx, y: dy } = direction;
  const sx = b.x - a.x;
  const sy = b.y - a.y;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((a.x - ox) * sy - (a.y - oy) * sx) / denom;
  const u = ((a.x - ox) * dy - (a.y - oy) * dx) / denom;
  if (t > 1e-6 && u >= 0 && u <= 1) return t;
  return null;
}

/**
 * Escala hasta el borde de un polígono convexo (origen = centro, direction = hacia el otro nodo).
 * @param {Point} origin
 * @param {{ x: number, y: number }} direction
 * @param {Point[]} vertices
 * @returns {number | null}
 */
export function polygonBorderScale(origin, direction, vertices) {
  let bestT = Infinity;
  for (let i = 0; i < vertices.length; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const t = raySegmentIntersectionT(origin, direction, a, b);
    if (t !== null && t < bestT) bestT = t;
  }
  return bestT === Infinity ? null : bestT;
}

/**
 * Vértices del contorno visible de la figura (coordenadas del lienzo).
 * @param {import('../models/shape.js').Shape} shape
 * @returns {Point[] | null}
 */
export function getShapeOutlineVertices(shape) {
  const { x, y, width: w, height: h } = shape;
  switch (shape.type) {
    case 'input':
      return [
        { x, y },
        { x: x + w, y },
        { x: x + 0.85 * w, y: y + h },
        { x: x + 0.15 * w, y: y + h },
      ];
    case 'print':
      return [
        { x: x + 0.15 * w, y },
        { x: x + 0.85 * w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
      ];
    case 'if': {
      const roofY = y + 0.4 * h;
      return [
        { x: x + w / 2, y: y + 0.06 * h },
        { x: x + 0.96 * w, y: roofY },
        { x: x + 0.96 * w, y: y + h },
        { x: x + 0.04 * w, y: y + h },
        { x: x + 0.04 * w, y: roofY },
      ];
    }
    default:
      return null;
  }
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
