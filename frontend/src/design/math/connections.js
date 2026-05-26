import {
  ellipseBorderScale,
  getShapeOutlineVertices,
  polygonBorderScale,
  rectBorderScale,
  shapeCenter,
  vectorLength,
} from './geometry.js';
import { SHAPE_TYPES } from '../constants/palette.js';

/**
 * @typedef {{ x1: number, y1: number, x2: number, y2: number }} ConnectionLine
 * @typedef {'top' | 'bottom' | 'left' | 'right'} CardinalSide
 */

const CARDINAL_VECTOR = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * @param {import('../models/shape.js').Shape} shape
 * @param {number} dx
 * @param {number} dy
 * @param {number} dist
 */
function borderScaleForShape(shape, dx, dy, dist) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const outline = getShapeOutlineVertices(shape);
  if (outline) {
    const center = shapeCenter(shape);
    const polyScale = polygonBorderScale(center, { x: dx, y: dy }, outline);
    if (polyScale !== null) return polyScale;
  }
  if (shape.type === SHAPE_TYPES.START || shape.type === SHAPE_TYPES.END) {
    return ellipseBorderScale(shape, dx, dy, dist);
  }
  return rectBorderScale(shape, absDx, absDy);
}

/**
 * Lados de salida/entrada según la posición real (x, y) de cada figura.
 * @param {import('../models/shape.js').Shape} from
 * @param {import('../models/shape.js').Shape} to
 */
function getConnectionSides(from, to) {
  const fromC = shapeCenter(from);
  const toC = shapeCenter(to);
  const dx = toC.x - fromC.x;
  const dy = toC.y - fromC.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0
      ? { fromSide: 'right', toSide: 'left' }
      : { fromSide: 'left', toSide: 'right' };
  }
  return dy > 0
    ? { fromSide: 'bottom', toSide: 'top' }
    : { fromSide: 'top', toSide: 'bottom' };
}

/**
 * Punto de anclaje en el borde usando x, y, width y height del componente.
 * @param {import('../models/shape.js').Shape} shape
 * @param {CardinalSide} side
 * @returns {{ x: number, y: number }}
 */
function getShapeAnchorPoint(shape, side) {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;

  if (shape.type === SHAPE_TYPES.FOR && (side === 'top' || side === 'bottom')) {
    const armWidth = 65;
    const mainWidth = Math.max(shape.width - armWidth, shape.width * 0.72);
    const ax = shape.x + mainWidth / 2;
    if (side === 'top') return { x: ax, y: shape.y };
    return { x: ax, y: shape.y + shape.height };
  }

  const outline = getShapeOutlineVertices(shape);
  if (outline) {
    const dir = CARDINAL_VECTOR[side];
    const dx = dir.x * shape.width;
    const dy = dir.y * shape.height;
    const dist = vectorLength(dx, dy) || 1;
    const scale = borderScaleForShape(shape, dx, dy, dist);
    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  if (shape.type === SHAPE_TYPES.START || shape.type === SHAPE_TYPES.END) {
    const angle = {
      top: -Math.PI / 2,
      bottom: Math.PI / 2,
      left: Math.PI,
      right: 0,
    }[side];
    const rx = shape.width / 2;
    const ry = shape.height / 2;
    const radius =
      (rx * ry) /
      Math.sqrt(
        Math.pow(ry * Math.cos(angle), 2) + Math.pow(rx * Math.sin(angle), 2)
      );
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  }

  switch (side) {
    case 'top':
      return { x: cx, y: shape.y };
    case 'bottom':
      return { x: cx, y: shape.y + shape.height };
    case 'left':
      return { x: shape.x, y: cy };
    case 'right':
      return { x: shape.x + shape.width, y: cy };
    default:
      return { x: cx, y: cy };
  }
}

/**
 * Calcula los extremos de una línea entre dos figuras (borde a borde según su posición).
 * @param {import('../models/shape.js').Shape} from
 * @param {import('../models/shape.js').Shape} to
 * @returns {ConnectionLine | null}
 */
export function getConnectionLine(from, to) {
  const fromC = shapeCenter(from);
  const toC = shapeCenter(to);
  if (vectorLength(toC.x - fromC.x, toC.y - fromC.y) === 0) return null;

  const { fromSide, toSide } = getConnectionSides(from, to);
  const p1 = getShapeAnchorPoint(from, fromSide);
  const p2 = getShapeAnchorPoint(to, toSide);

  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

/**
 * @param {import('../models/connection.js').Connection} connection
 * @param {Map<string, import('../models/shape.js').Shape>} shapesById
 * @returns {ConnectionLine | null}
 */
export function getConnectionLineFromMap(connection, shapesById) {
  const from = shapesById.get(connection.from);
  const to = shapesById.get(connection.to);
  if (!from || !to) return null;
  return getConnectionLine(from, to);
}
