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
  [SHAPE_TYPES.START]: '',
  [SHAPE_TYPES.END]: '',
  [SHAPE_TYPES.INPUT]: '',
  [SHAPE_TYPES.PRINT]: '',
  [SHAPE_TYPES.PROCESS]: '',
  [SHAPE_TYPES.FOR]: '',
  [SHAPE_TYPES.WHILE]: '',
  [SHAPE_TYPES.IF]: '',
};

/** Textos solo en la paleta lateral (no se copian al lienzo). */
const PALETTE_PREVIEW_TITLES = {
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
  return DEFAULT_TITLES[type] ?? '';
}

/**
 * @param {string} type
 * @returns {string}
 */
export function getPalettePreviewTitle(type) {
  return PALETTE_PREVIEW_TITLES[type] ?? '';
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
 * @param {{ preview?: boolean }} [options]
 * @returns {Shape}
 */
export function createShape(type, x, y, id, options = {}) {
  const size = getDefaultSize(type);
  const title = options.preview ? getPalettePreviewTitle(type) : getDefaultTitle(type);
  return {
    id: id ?? Date.now().toString(),
    type,
    title,
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

const TEXT_FIT = {
  horizontalPad: 32,
  verticalPad: 28,
  maxTextWidth: 420,
};

const FOR_LOOP_ARM_WIDTH = 65;
const WHILE_BODY_MIN_HEIGHT = 96;

/**
 * Mide el texto renderizado con los mismos estilos del elemento editable.
 * @param {HTMLElement} textEl
 * @param {number} [maxWidth]
 * @returns {{ width: number, height: number }}
 */
export function measureEditableText(textEl, maxWidth = TEXT_FIT.maxTextWidth) {
  if (typeof document === 'undefined') {
    return { width: 80, height: 20 };
  }

  const styles = window.getComputedStyle(textEl);
  const probe = document.createElement('div');
  Object.assign(probe.style, {
    position: 'absolute',
    left: '-9999px',
    top: '0',
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: styles.fontFamily,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing,
    width: 'max-content',
    maxWidth: `${maxWidth}px`,
    padding: '0',
    border: '0',
  });
  probe.textContent = textEl.innerText || textEl.textContent || '';
  document.body.appendChild(probe);
  const size = {
    width: probe.offsetWidth,
    height: probe.offsetHeight,
  };
  document.body.removeChild(probe);
  return size;
}

/**
 * Calcula width/height de la forma según el texto escrito.
 * @param {Shape} shape
 * @param {HTMLElement} textEl
 * @returns {{ width: number, height: number }}
 */
export function fitShapeToTextContent(shape, textEl) {
  const defaults = getDefaultSize(shape.type);
  const { width: textWidth, height: textHeight } = measureEditableText(textEl);
  const hasText = Boolean((textEl.innerText || textEl.textContent || '').trim());

  if (!hasText) {
    return clampShapeDimensions(shape, defaults.width, defaults.height);
  }

  let width = textWidth + TEXT_FIT.horizontalPad * 2;
  let height = textHeight + TEXT_FIT.verticalPad * 2;

  if (shape.type === SHAPE_TYPES.START || shape.type === SHAPE_TYPES.END) {
    width = Math.max(width, height * 1.35);
  }

  if (shape.type === SHAPE_TYPES.FOR) {
    width += FOR_LOOP_ARM_WIDTH;
  }

  if (shape.type === SHAPE_TYPES.WHILE) {
    height = Math.max(height + WHILE_BODY_MIN_HEIGHT, defaults.height);
  }

  if (shape.type === SHAPE_TYPES.IF) {
    const roofHeight = textHeight + 36;
    height = Math.max(defaults.height, Math.round(roofHeight / 0.45));
  }

  return clampShapeDimensions(
    shape,
    Math.max(defaults.width, width),
    Math.max(defaults.height, height),
  );
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
  return bringShapesToFront(shapes, [shapeId]);
}

/**
 * @param {Shape[]} shapes
 * @param {(string|number)[]} shapeIds
 * @returns {Shape[]}
 */
export function bringShapesToFront(shapes, shapeIds) {
  if (!shapeIds?.length) return shapes;
  const idSet = new Set(shapeIds);
  const picked = shapes.filter((s) => idSet.has(s.id));
  const rest = shapes.filter((s) => !idSet.has(s.id));
  if (picked.length === 0) return shapes;
  return [...rest, ...picked];
}

/**
 * @param {Shape[]} shapes
 * @returns {Map<string|number, Shape>}
 */
export function shapesToMap(shapes) {
  const map = new Map();
  for (const shape of shapes) {
    map.set(shape.id, shape);
    map.set(String(shape.id), shape);
    const numericId = Number(shape.id);
    if (!Number.isNaN(numericId)) {
      map.set(numericId, shape);
    }
  }
  return map;
}
