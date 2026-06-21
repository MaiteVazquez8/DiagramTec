/** Cálculo de puntos de anclaje y segmentos SVG entre dos formas conectadas. */
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
 * Segmento de línea entre dos puntos de anclaje.
 * @typedef {{ x1: number, y1: number, x2: number, y2: number }} ConnectionLine
 * @typedef {'top' | 'bottom' | 'left' | 'right'} CardinalSide
 */

// Vectores unitarios para cada lado cardinal (arriba, abajo, izquierda, derecha)
const CARDINAL_VECTOR = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Determina el factor de escala hasta el borde según la forma (polígono, elipse o rectángulo).
 * @param {import('../models/shape.js').Shape} shape
 * @param {number} dx  Dirección X hacia el otro nodo
 * @param {number} dy  Dirección Y hacia el otro nodo
 * @param {number} dist Longitud del vector dirección
 */
function borderScaleForShape(shape, dx, dy, dist) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const outline = getShapeOutlineVertices(shape);
  // Formas poligonales (input, print, if): intersección rayo–polígono
  if (outline) {
    const center = shapeCenter(shape);
    const polyScale = polygonBorderScale(center, { x: dx, y: dy }, outline);
    if (polyScale !== null) return polyScale;
  }
  // Terminadores inicio/fin: borde elíptico
  if (shape.type === SHAPE_TYPES.START || shape.type === SHAPE_TYPES.END) {
    return ellipseBorderScale(shape, dx, dy, dist);
  }
  // Resto: rectángulo axis-aligned
  return rectBorderScale(shape, absDx, absDy);
}

/**
 * Elige los lados de salida (origen) y entrada (destino) según posición relativa.
 * Prioriza el eje dominante (horizontal o vertical).
 * @param {import('../models/shape.js').Shape} from
 * @param {import('../models/shape.js').Shape} to
 */
function getConnectionSides(from, to) {
  const fromC = shapeCenter(from);
  const toC = shapeCenter(to);
  const dx = toC.x - fromC.x;
  const dy = toC.y - fromC.y;

  // Destino más a la derecha o izquierda: conectar por lados horizontales
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0
      ? { fromSide: 'right', toSide: 'left' }
      : { fromSide: 'left', toSide: 'right' };
  }
  // Destino más arriba o abajo: conectar por lados verticales
  return dy > 0
    ? { fromSide: 'bottom', toSide: 'top' }
    : { fromSide: 'top', toSide: 'bottom' };
}

/**
 * Calcula el punto exacto de anclaje en el borde de la figura para un lado cardinal.
 * Maneja casos especiales: FOR (brazo), polígonos, elipses y rectángulos.
 * @param {import('../models/shape.js').Shape} shape
 * @param {CardinalSide} side
 * @returns {{ x: number, y: number }}
 */
function getShapeAnchorPoint(shape, side) {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;

  // FOR: anclajes superior/inferior en el centro del cuerpo principal (no del brazo)
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

  // Elipses (inicio/fin): punto en el perímetro según ángulo del lado
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

  // Rectángulo estándar: punto medio del borde correspondiente
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
 * Calcula los extremos de la línea SVG entre dos figuras (borde a borde).
 * @param {import('../models/shape.js').Shape} from
 * @param {import('../models/shape.js').Shape} to
 * @returns {ConnectionLine | null}
 */
export function getConnectionLine(from, to) {
  const fromC = shapeCenter(from);
  const toC = shapeCenter(to);
  // Misma posición: no dibujar línea
  if (vectorLength(toC.x - fromC.x, toC.y - fromC.y) === 0) return null;

  const { fromSide, toSide } = getConnectionSides(from, to);
  const p1 = getShapeAnchorPoint(from, fromSide);
  const p2 = getShapeAnchorPoint(to, toSide);

  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

/**
 * Resuelve una figura desde el Map probando id directo, numérico y string.
 * @param {Map<string|number, import('../models/shape.js').Shape>} shapesById
 * @param {string|number} id
 */
function resolveShapeFromMap(shapesById, id) {
  if (id == null) return undefined;
  const direct = shapesById.get(id);
  if (direct) return direct;
  const asNumber = Number(id);
  if (!Number.isNaN(asNumber)) {
    const byNumber = shapesById.get(asNumber);
    if (byNumber) return byNumber;
  }
  return shapesById.get(String(id));
}

/**
 * Obtiene la línea de conexión a partir de una Connection y un Map de figuras.
 * @param {import('../models/connection.js').Connection} connection
 * @param {Map<string|number, import('../models/shape.js').Shape>} shapesById
 * @returns {ConnectionLine | null}
 */
export function getConnectionLineFromMap(connection, shapesById) {
  const from = resolveShapeFromMap(shapesById, connection.from);
  const to = resolveShapeFromMap(shapesById, connection.to);
  if (!from || !to) return null;
  return getConnectionLine(from, to);
}
