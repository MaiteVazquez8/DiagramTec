/**
 * Utilidades geométricas para el editor de diagramas:
 * centros, longitudes, intersecciones rayo–borde y contornos de figuras.
 */

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x: number, y: number, width: number, height: number }} Rect */

/**
 * Calcula el centro geométrico de una figura.
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
 * Longitud euclidiana de un vector (distancia entre dos puntos).
 * @param {number} dx
 * @param {number} dy
 * @returns {number}
 */
export function vectorLength(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Factor de escala desde el centro hasta el borde de una elipse en dirección (dx, dy).
 * Usado para terminadores inicio/fin.
 * @param {import('../models/shape.js').Shape} shape
 * @param {number} dx
 * @param {number} dy
 * @param {number} dist
 */
export function ellipseBorderScale(shape, dx, dy, dist) {
  const angle = Math.atan2(dy, dx);
  const rx = shape.width / 2;
  const ry = shape.height / 2;
  // Radio de la elipse en la dirección del ángulo
  const radius =
    (rx * ry) /
    Math.sqrt(
      Math.pow(ry * Math.cos(angle), 2) + Math.pow(rx * Math.sin(angle), 2)
    );
  return radius / dist;
}

/**
 * Factor de escala hasta el borde de un rectángulo alineado a los ejes.
 * @param {import('../models/shape.js').Shape} shape
 * @param {number} absDx  Componente X absoluta de la dirección
 * @param {number} absDy  Componente Y absoluta de la dirección
 */
export function rectBorderScale(shape, absDx, absDy) {
  const scaleX = absDx === 0 ? Infinity : shape.width / 2 / absDx;
  const scaleY = absDy === 0 ? Infinity : shape.height / 2 / absDy;
  return Math.min(scaleX, scaleY); // Primer borde que intersecta el rayo
}

/**
 * Intersección rayo–segmento: P = origin + t * direction.
 * Devuelve t mínimo positivo o null si no hay intersección.
 * @returns {number | null}
 */
function raySegmentIntersectionT(origin, direction, a, b) {
  const { x: ox, y: oy } = origin;
  const { x: dx, y: dy } = direction;
  const sx = b.x - a.x;
  const sy = b.y - a.y;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-9) return null; // Paralelos
  const t = ((a.x - ox) * sy - (a.y - oy) * sx) / denom;
  const u = ((a.x - ox) * dy - (a.y - oy) * dx) / denom;
  if (t > 1e-6 && u >= 0 && u <= 1) return t;
  return null;
}

/**
 * Factor de escala hasta el borde de un polígono convexo desde el centro.
 * @param {Point} origin     Centro de la figura
 * @param {{ x: number, y: number }} direction  Vector hacia el otro nodo
 * @param {Point[]} vertices  Vértices del contorno en coordenadas del lienzo
 * @returns {number | null}
 */
export function polygonBorderScale(origin, direction, vertices) {
  let bestT = Infinity;
  // Probar intersección con cada arista del polígono
  for (let i = 0; i < vertices.length; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const t = raySegmentIntersectionT(origin, direction, a, b);
    if (t !== null && t < bestT) bestT = t;
  }
  return bestT === Infinity ? null : bestT;
}

/**
 * Devuelve los vértices del contorno visible de figuras no rectangulares.
 * null para tipos que usan rectángulo o elipse estándar.
 * @param {import('../models/shape.js').Shape} shape
 * @returns {Point[] | null}
 */
export function getShapeOutlineVertices(shape) {
  const { x, y, width: w, height: h } = shape;
  switch (shape.type) {
    case 'input':
      // Paralelogramo de entrada (base inferior más estrecha)
      return [
        { x, y },
        { x: x + w, y },
        { x: x + 0.85 * w, y: y + h },
        { x: x + 0.15 * w, y: y + h },
      ];
    case 'print':
      // Paralelogramo de salida (base superior más estrecha)
      return [
        { x: x + 0.15 * w, y },
        { x: x + 0.85 * w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
      ];
    case 'if': {
      // Forma de casa: techo triangular + cuerpo rectangular
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
 * Convierte un rectángulo { x, y, width, height } en límites min/max.
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
