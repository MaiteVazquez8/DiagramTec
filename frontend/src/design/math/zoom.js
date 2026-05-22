import { CANVAS_CENTER_OFFSET, ZOOM_LIMITS } from '../constants/canvas.js';

/**
 * @param {number} zoom
 * @returns {number}
 */
export function clampZoom(zoom) {
  return Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, zoom));
}

/**
 * @param {number} zoom
 * @returns {number}
 */
export function stepZoomIn(zoom) {
  return +clampZoom(zoom + ZOOM_LIMITS.step).toFixed(2);
}

/**
 * @param {number} zoom
 * @returns {number}
 */
export function stepZoomOut(zoom) {
  return +clampZoom(zoom - ZOOM_LIMITS.step).toFixed(2);
}

/**
 * Convierte coordenadas de pantalla a coordenadas del lienzo (sin pan).
 * @param {number} clientX
 * @param {number} clientY
 * @param {DOMRect} canvasRect
 * @param {number} zoom
 * @param {{ x?: number, y?: number }} [offset]
 * @returns {{ x: number, y: number }}
 */
export function screenToCanvas(clientX, clientY, canvasRect, zoom, offset = { x: 20, y: 20 }) {
  return {
    x: (clientX - canvasRect.left) / zoom - (offset.x ?? 0),
    y: (clientY - canvasRect.top) / zoom - (offset.y ?? 0),
  };
}

/**
 * Pan para centrar el origen del lienzo en el viewport.
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} [zoom]
 * @param {number} [centerOffset]
 * @returns {{ x: number, y: number }}
 */
export function computeCenterPan(
  viewportWidth,
  viewportHeight,
  zoom = 1,
  centerOffset = CANVAS_CENTER_OFFSET
) {
  return {
    x: viewportWidth / 2 - centerOffset * zoom,
    y: viewportHeight / 2 - centerOffset * zoom,
  };
}

/**
 * Ajusta el pan al cambiar zoom para que el mismo punto del lienzo quede bajo el foco en pantalla.
 * focalX/focalY son relativos al viewport del contenedor del canvas.
 * @param {{ x: number, y: number }} pan
 * @param {number} zoom
 * @param {number} nextZoom
 * @param {number} focalX
 * @param {number} focalY
 */
export function computePanForZoomChange(pan, zoom, nextZoom, focalX, focalY) {
  if (zoom === 0) return pan;
  return {
    x: focalX - ((focalX - pan.x) / zoom) * nextZoom,
    y: focalY - ((focalY - pan.y) / zoom) * nextZoom,
  };
}

/**
 * Delta de movimiento en espacio del lienzo.
 * @param {number} deltaClient
 * @param {number} zoom
 */
export function clientDeltaToCanvas(deltaClient, zoom) {
  return deltaClient / zoom;
}
