/** Conversión pantalla↔lienzo, pasos de zoom y cálculo de pan (desplazamiento). */
import { CANVAS_CENTER_OFFSET, ZOOM_LIMITS } from '../constants/canvas.js';

/**
 * Restringe el valor de zoom dentro de los límites mínimo y máximo.
 * @param {number} zoom
 * @returns {number}
 */
export function clampZoom(zoom) {
  return Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, zoom));
}

/**
 * Aumenta el zoom un paso y lo acota a los límites permitidos.
 * @param {number} zoom
 * @returns {number}
 */
export function stepZoomIn(zoom) {
  return +clampZoom(zoom + ZOOM_LIMITS.step).toFixed(2);
}

/**
 * Disminuye el zoom un paso y lo acota a los límites permitidos.
 * @param {number} zoom
 * @returns {number}
 */
export function stepZoomOut(zoom) {
  return +clampZoom(zoom - ZOOM_LIMITS.step).toFixed(2);
}

/**
 * Convierte coordenadas del ratón (clientX/clientY) a coordenadas del lienzo.
 * Tiene en cuenta el rect del canvas, el zoom y un offset opcional.
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
 * Calcula el pan (desplazamiento) para centrar el origen del lienzo en el viewport.
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
 * Ajusta el pan al cambiar zoom para que el mismo punto del lienzo
 * permanezca bajo el cursor/foco en pantalla (zoom hacia el punto focal).
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
 * Convierte un delta de movimiento en píxeles de pantalla a unidades del lienzo.
 * @param {number} deltaClient  Delta en píxeles de pantalla
 * @param {number} zoom
 */
export function clientDeltaToCanvas(deltaClient, zoom) {
  return deltaClient / zoom;
}
