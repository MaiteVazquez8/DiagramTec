/** Operaciones de alto nivel: alta, baja y movimiento de figuras en el diagrama. */
import { removeConnectionsForShape } from '../models/connection.js';

/**
 * Elimina una figura del array shapes por su ID (sin tocar conexiones).
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {string|number} shapeId
 * @returns {import('../models/shape.js').Shape[]}
 */
export function removeShape(shapes, shapeId) {
  return shapes.filter((s) => s.id !== shapeId);
}

/**
 * Desplaza una figura por ID sumando dx/dy a su posición.
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {string|number} shapeId
 * @param {number} dx
 * @param {number} dy
 * @returns {import('../models/shape.js').Shape[]}
 */
export function moveShapeById(shapes, shapeId, dx, dy) {
  return shapes.map((s) =>
    s.id === shapeId ? { ...s, x: s.x + dx, y: s.y + dy } : s
  );
}

/**
 * Cambia ancho y alto de una figura por ID en el array.
 * @param {import('../models/shape.js').Shape[]} shapes
 * @param {string|number} shapeId
 * @param {number} width
 * @param {number} height
 * @returns {import('../models/shape.js').Shape[]}
 */
export function resizeShapeById(shapes, shapeId, width, height) {
  return shapes.map((s) =>
    s.id === shapeId ? { ...s, width, height } : s
  );
}

/**
 * Elimina una figura y todas sus conexiones del estado completo del diagrama.
 * @param {import('../models/diagramState.js').DiagramState} state
 * @param {string|number} shapeId
 * @returns {import('../models/diagramState.js').DiagramState}
 */
export function deleteShapeFromDiagram(state, shapeId) {
  return {
    shapes: removeShape(state.shapes, shapeId),
    connections: removeConnectionsForShape(state.connections, shapeId),
  };
}

/**
 * Añade una figura nueva al estado del diagrama (sin modificar conexiones).
 * @param {import('../models/diagramState.js').DiagramState} state
 * @param {import('../models/shape.js').Shape} shape
 * @returns {import('../models/diagramState.js').DiagramState}
 */
export function addShapeToDiagram(state, shape) {
  return {
    shapes: [...state.shapes, shape],
    connections: state.connections,
  };
}
