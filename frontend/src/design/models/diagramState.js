/**
 * diagramState — estado completo del diagrama (shapes + connections).
 * Parse desde JSON de la API, serialización para guardar, clonado y generación de IDs.
 */
import { normalizeConnection } from './connection.js';

/**
 * Serialización JSON del diagrama (shapes + connections) para API y localStorage.
 * @typedef {Object} DiagramContent
 * @property {import('./shape.js').Shape[]} shapes
 * @property {import('./connection.js').Connection[]} connections
 */

/**
 * Estado en memoria del diagrama (misma estructura que DiagramContent).
 * @typedef {Object} DiagramState
 * @property {import('./shape.js').Shape[]} shapes
 * @property {import('./connection.js').Connection[]} connections
 */

/**
 * Convierte datos crudos (string JSON u objeto) en un DiagramContent válido.
 * Normaliza conexiones y devuelve arrays vacíos si el input es inválido.
 * @param {DiagramContent | string | null | undefined} raw
 * @returns {DiagramContent}
 */
export function parseDiagramContent(raw) {
  // Sin datos: diagrama vacío
  if (!raw) return { shapes: [], connections: [] };
  // String JSON desde API o localStorage
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return {
        shapes: parsed.shapes ?? [],
        // Normaliza IDs de extremos (string → number cuando aplica)
        connections: (parsed.connections ?? []).map(normalizeConnection),
      };
    } catch {
      // JSON corrupto: estado vacío seguro
      return { shapes: [], connections: [] };
    }
  }
  // Objeto ya parseado
  return {
    shapes: raw.shapes ?? [],
    connections: (raw.connections ?? []).map(normalizeConnection),
  };
}

/**
 * Extrae la forma serializable del estado para persistir (API, localStorage).
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
 * Copia profunda del estado mediante JSON (inmutable para undo/redo).
 * @param {DiagramState} state
 * @returns {DiagramState}
 */
export function cloneDiagramState(state) {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Devuelve un diagrama vacío sin figuras ni conexiones.
 * @returns {DiagramState}
 */
export function emptyDiagramState() {
  return { shapes: [], connections: [] };
}

/**
 * Calcula el siguiente ID numérico basado en la cantidad actual de figuras.
 * @param {import('./shape.js').Shape[]} shapes
 * @returns {number}
 */
export function nextShapeIdFromList(shapes) {
  return (shapes?.length ?? 0) + 1;
}
