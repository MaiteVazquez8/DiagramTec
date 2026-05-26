/** Modelo de forma: crear, duplicar, redimensionar, títulos por defecto. */
import { SHAPE_TYPES } from '../constants/palette.js';
import { SHAPE_SIZE_LIMITS } from '../constants/canvas.js';

/**
 * @typedef {Object} Shape
 * @property {string|number} id
 * @property {string} type
 * @property {string} title
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} [fontSize]
 */

const DEFAULT_TITLES = {
  [SHAPE_TYPES.START]: 'inicio',
  [SHAPE_TYPES.END]: 'FINAL',
  [SHAPE_TYPES.INPUT]: 'INPUT',
  [SHAPE_TYPES.PRINT]: 'PRINT',
  [SHAPE_TYPES.PROCESS]: 'A = B',
  [SHAPE_TYPES.FOR]: 'PROCESOS',
  [SHAPE_TYPES.WHILE]: 'WHILE',
  [SHAPE_TYPES.IF]: 'IF',
};

const DEFAULT_SIZES = {
  [SHAPE_TYPES.IF]: { width: 220, height: 180 },
  [SHAPE_TYPES.FOR]: { width: 220, height: 120 },
  [SHAPE_TYPES.WHILE]: { width: 220, height: 160 },
  default: { width: 140, height: 90 },
};

/** Proporciones del IF: evita triángulo aplastado o demasiado ancho */
export const IF_SIZE_LIMITS = {
  minWidth: 160,
  minHeight: 120,
  maxWidthRatio: 2.2,
  minWidthRatio: 0.65,
};

/**
 * @param {number} width
 * @param {number} height
 * @returns {{ width: number, height: number }}
 */
export function clampIfDimensions(width, height) {
  let w = Math.max(IF_SIZE_LIMITS.minWidth, width);
  let h = Math.max(IF_SIZE_LIMITS.minHeight, height);
  const ratio = w / h;
  if (ratio > IF_SIZE_LIMITS.maxWidthRatio) {
    w = Math.round(h * IF_SIZE_LIMITS.maxWidthRatio);
  }
  if (ratio < IF_SIZE_LIMITS.minWidthRatio) {
    h = Math.round(w / IF_SIZE_LIMITS.minWidthRatio);
  }
  return { width: w, height: h };
}

/**
 * @param {Shape} shape
 * @param {number} width
 * @param {number} height
 * @returns {{ width: number, height: number }}
 */
export function clampShapeDimensions(shape, width, height) {
  if (shape.type === SHAPE_TYPES.IF) {
    return clampIfDimensions(width, height);
  }
  return {
    width: Math.max(SHAPE_SIZE_LIMITS.minWidth, width),
    height: Math.max(SHAPE_SIZE_LIMITS.minHeight, height),
  };
}

/**
 * @param {string} type
 * @returns {string}
 */
export function getDefaultTitle(type) {
  return DEFAULT_TITLES[type] ?? 'BLOQUE';
}

/**
 * @param {string} type
 * @returns {{ width: number, height: number }}
 */
export function getDefaultSize(type) {
  return DEFAULT_SIZES[type] ?? DEFAULT_SIZES.default;
}

/**
 * Crea una figura nueva en el lienzo.
 * @param {string} type
 * @param {number} x
 * @param {number} y
 * @param {string|number} [id]
 * @returns {Shape}
 */
export function createShape(type, x, y, id) {
  const size = getDefaultSize(type);
  return {
    id: id ?? Date.now().toString(),
    type,
    title: getDefaultTitle(type),
    x,
    y,
    width: size.width,
    height: size.height,
    fontSize: 16,
  };
}

/**
 * @param {Shape} shape
 * @param {{ x?: number, y?: number }} [offset]
 * @param {string|number} [newId]
 * @returns {Shape}
 */
export function duplicateShape(shape, offset = { x: 30, y: 30 }, newId) {
  return {
    ...shape,
    id: newId ?? Date.now().toString(),
    x: shape.x + (offset.x ?? 0),
    y: shape.y + (offset.y ?? 0),
  };
}

/**
 * @param {Shape} shape
 * @param {number} dx
 * @param {number} dy
 * @returns {Shape}
 */
export function translateShape(shape, dx, dy) {
  return { ...shape, x: shape.x + dx, y: shape.y + dy };
}

/**
 * @param {Shape} shape
 * @param {number} width
 * @param {number} height
 * @returns {Shape}
 */
export function resizeShape(shape, width, height) {
  const size = clampShapeDimensions(shape, width, height);
  return { ...shape, ...size };
}

/**
 * @param {Shape[]} shapes
 * @param {string|number} shapeId
 * @param {number} fontSize
 * @returns {Shape[]}
 */
export function setShapeFontSize(shapes, shapeId, fontSize) {
  return shapes.map((s) =>
    s.id === shapeId ? { ...s, fontSize } : s
  );
}

/**
 * @param {Shape[]} shapes
 * @param {string|number} shapeId
 * @returns {Shape[]}
 */
export function bringShapeToFront(shapes, shapeId) {
  const target = shapes.find((s) => s.id === shapeId);
  if (!target) return shapes;
  return [...shapes.filter((s) => s.id !== shapeId), target];
}

/**
 * @param {Shape[]} shapes
 * @returns {Map<string|number, Shape>}
 */
export function shapesToMap(shapes) {
  return new Map(shapes.map((shape) => [shape.id, shape]));
}
