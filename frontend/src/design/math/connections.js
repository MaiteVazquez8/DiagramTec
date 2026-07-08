/** Cálculo de puntos de anclaje y segmentos SVG entre dos formas. */
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

const WHILE_HEADER_HEIGHT = 38;
const IF_ROOF_RATIO = 0.45;
const IF_HEADER_ROW_HEIGHT = 30;
const CONNECTION_SHAPE_GAP = 4;
const CONTAINER_TYPES = new Set([SHAPE_TYPES.WHILE, SHAPE_TYPES.IF, SHAPE_TYPES.FOR]);

function isContainerShape(shape) {
  return CONTAINER_TYPES.has(shape?.type);
}

function containsShape(container, child) {
  return (
    child.x >= container.x
    && child.y >= container.y
    && child.x + child.width <= container.x + container.width
    && child.y + child.height <= container.y + container.height
  );
}

function getContainerContentRect(container) {
  if (container.type === SHAPE_TYPES.WHILE) {
    const headerHeight = Math.min(WHILE_HEADER_HEIGHT, container.height / 2);
    return {
      x: container.x,
      y: container.y + headerHeight,
      width: container.width,
      height: Math.max(0, container.height - headerHeight),
    };
  }

  if (container.type === SHAPE_TYPES.IF) {
    const bodyStart = container.height * IF_ROOF_RATIO + IF_HEADER_ROW_HEIGHT;
    return {
      x: container.x,
      y: container.y + bodyStart,
      width: container.width,
      height: Math.max(0, container.height - bodyStart),
    };
  }

  if (container.type === SHAPE_TYPES.FOR) {
    const armWidth = 65;
    const mainWidth = Math.max(container.width - armWidth, container.width * 0.72);
    return {
      x: container.x,
      y: container.y,
      width: mainWidth,
      height: container.height,
    };
  }

  return {
    x: container.x,
    y: container.y,
    width: container.width,
    height: container.height,
  };
}

function isShapeVisuallyInside(container, child) {
  const content = getContainerContentRect(container);
  const childCenter = shapeCenter(child);
  const centerInside = (
    childCenter.x >= content.x
    && childCenter.x <= content.x + content.width
    && childCenter.y >= content.y
    && childCenter.y <= content.y + content.height
  );

  const overlapX = Math.max(
    0,
    Math.min(content.x + content.width, child.x + child.width) - Math.max(content.x, child.x),
  );
  const overlapY = Math.max(
    0,
    Math.min(content.y + content.height, child.y + child.height) - Math.max(content.y, child.y),
  );
  const overlapArea = overlapX * overlapY;
  const childArea = getShapeArea(child);

  return centerInside && childArea > 0 && overlapArea / childArea >= 0.35;
}

function getShapeArea(shape) {
  return shape.width * shape.height;
}

export function getContainingContainer(shape, shapes) {
  return shapes
    .filter((candidate) =>
      candidate.id !== shape.id
      && isContainerShape(candidate)
      && isShapeVisuallyInside(candidate, shape)
    )
    .sort((a, b) => getShapeArea(a) - getShapeArea(b))[0] || null;
}

function getNestedStartPoint(container, child) {
  const childTop = getShapeTopPoint(child);

  if (container.type === SHAPE_TYPES.WHILE) {
    return {
      x: childTop.x,
      y: container.y + Math.min(WHILE_HEADER_HEIGHT, container.height / 2),
    };
  }

  if (container.type === SHAPE_TYPES.IF) {
    return {
      x: childTop.x,
      y: container.y + container.height * IF_ROOF_RATIO + IF_HEADER_ROW_HEIGHT,
    };
  }

  return {
    x: childTop.x,
    y: container.y,
  };
}

function getShapeTopPoint(shape) {
  if (shape.type === SHAPE_TYPES.IF) {
    return { x: shape.x + shape.width / 2, y: shape.y };
  }
  return getShapeAnchorPoint(shape, 'top');
}

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
  if (
    shape.type === SHAPE_TYPES.START
    || shape.type === SHAPE_TYPES.END
    || shape.type === SHAPE_TYPES.START_END
  ) {
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

function getPreferredVerticalSide(from, to, endpoint) {
  const fromC = shapeCenter(from);
  const toC = shapeCenter(to);
  const dx = toC.x - fromC.x;
  const dy = toC.y - fromC.y;

  if (Math.abs(dy) <= Math.abs(dx)) return null;

  if (endpoint === 'from') {
    return dy > 0 ? 'bottom' : 'top';
  }

  return dy > 0 ? 'top' : 'bottom';
}

function trimLineAwayFromShapes(p1, p2, gap = CONNECTION_SHAPE_GAP) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = vectorLength(dx, dy);
  if (length <= gap * 2) {
    return { p1, p2 };
  }

  const ux = dx / length;
  const uy = dy / length;
  return {
    p1: { x: p1.x + ux * gap, y: p1.y + uy * gap },
    p2: { x: p2.x - ux * gap, y: p2.y - uy * gap },
  };
}

function createConnectionLine(p1, p2) {
  const trimmed = trimLineAwayFromShapes(p1, p2);
  return {
    x1: trimmed.p1.x,
    y1: trimmed.p1.y,
    x2: trimmed.p2.x,
    y2: trimmed.p2.y,
  };
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

  if (shape.type === SHAPE_TYPES.IF && side === 'top') {
    return { x: cx, y: shape.y };
  }

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

  if (
    shape.type === SHAPE_TYPES.START
    || shape.type === SHAPE_TYPES.END
    || shape.type === SHAPE_TYPES.START_END
  ) {
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

  if (isContainerShape(from) && isShapeVisuallyInside(from, to)) {
    const p1 = getNestedStartPoint(from, to);
    const p2 = getShapeTopPoint(to);
    return createConnectionLine(p1, p2);
  }

  if (isContainerShape(to) && isShapeVisuallyInside(to, from)) {
    const p1 = getShapeTopPoint(from);
    const p2 = getNestedStartPoint(to, from);
    return createConnectionLine(p1, p2);
  }

  const { fromSide, toSide } = getConnectionSides(from, to);
  const p1 = getShapeAnchorPoint(from, fromSide);
  const p2 = getShapeAnchorPoint(to, toSide);

  return createConnectionLine(p1, p2);
}

function getConnectionLineWithContainers(from, to, fromContainer, toContainer, connection) {
  const fromC = shapeCenter(from);
  const toC = shapeCenter(to);
  if (vectorLength(toC.x - fromC.x, toC.y - fromC.y) === 0) return null;

  if (isContainerShape(from) && isShapeVisuallyInside(from, to)) {
    const p1 = getNestedStartPoint(from, to);
    const p2 = getShapeTopPoint(to);
    return createConnectionLine(p1, p2);
  }

  if (isContainerShape(to) && isShapeVisuallyInside(to, from)) {
    const p1 = getShapeTopPoint(from);
    const p2 = getNestedStartPoint(to, from);
    return createConnectionLine(p1, p2);
  }

  if (connection?.fromSide || connection?.toSide) {
    const fallback = getConnectionSides(from, to);
    const preferredFromSide = getPreferredVerticalSide(from, to, 'from');
    const preferredToSide = getPreferredVerticalSide(from, to, 'to');
    const p1 = fromContainer && !connection.fromSide
      ? getShapeTopPoint(from)
      : getShapeAnchorPoint(from, preferredFromSide || connection.fromSide || fallback.fromSide);
    const p2 = toContainer && !connection.toSide
      ? getShapeTopPoint(to)
      : getShapeAnchorPoint(to, preferredToSide || connection.toSide || fallback.toSide);
    return createConnectionLine(p1, p2);
  }

  if (fromContainer || toContainer) {
    const { fromSide, toSide } = getConnectionSides(from, to);
    const p1 = fromContainer ? getShapeTopPoint(from) : getShapeAnchorPoint(from, fromSide);
    const p2 = toContainer ? getShapeTopPoint(to) : getShapeAnchorPoint(to, toSide);
    return createConnectionLine(p1, p2);
  }

  return getConnectionLine(from, to);
}

/**
 * @param {import('../models/connection.js').Connection} connection
 * @param {Map<string, import('../models/shape.js').Shape>} shapesById
 * @returns {ConnectionLine | null}
 */
/**
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

export function getConnectionLineFromMap(connection, shapesById) {
  const from = resolveShapeFromMap(shapesById, connection.from);
  const to = resolveShapeFromMap(shapesById, connection.to);
  if (!from || !to) return null;
  const shapes = Array.from(shapesById.values());
  return getConnectionLineWithContainers(
    from,
    to,
    getContainingContainer(from, shapes),
    getContainingContainer(to, shapes),
    connection,
  );
}
