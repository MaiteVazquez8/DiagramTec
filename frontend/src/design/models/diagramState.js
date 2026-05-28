import { normalizeConnection } from './connection.js';

/**
 * Serialización JSON del diagrama (shapes + connections) para API y localStorage.
 * @typedef {Object} DiagramContent
 * @property {import('./shape.js').Shape[]} shapes
 * @property {import('./connection.js').Connection[]} connections
 */

/**
 * @typedef {Object} DiagramState
 * @property {import('./shape.js').Shape[]} shapes
 * @property {import('./connection.js').Connection[]} connections
 */

/**
 * @param {DiagramContent | string | null | undefined} raw
 * @returns {DiagramContent}
 */
export function parseDiagramContent(raw) {
  if (!raw) return { shapes: [], connections: [] };
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return {
        shapes: parsed.shapes ?? [],
        connections: (parsed.connections ?? []).map(normalizeConnection),
      };
    } catch {
      return { shapes: [], connections: [] };
    }
  }
  return {
    shapes: raw.shapes ?? [],
    connections: (raw.connections ?? []).map(normalizeConnection),
  };
}

/**
 * @param {DiagramState} state
 * @returns {DiagramContent}
 */
export function serializeDiagram(state) {
  return {
    shapes: state.shapes,
    connections: state.connections,
  };
}

/**
 * @param {DiagramState} state
 * @returns {DiagramState}
 */
export function cloneDiagramState(state) {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Estado vacío del diagrama.
 * @returns {DiagramState}
 */
export function emptyDiagramState() {
  return { shapes: [], connections: [] };
}

/**
 * @param {import('./shape.js').Shape[]} shapes
 * @returns {number}
 */
export function nextShapeIdFromList(shapes) {
  return (shapes?.length ?? 0) + 1;
}
