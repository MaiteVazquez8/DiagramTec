/** Pila undo/redo del estado completo del diagrama (snapshots inmutables). */
import { cloneDiagramState } from '../models/diagramState.js';
import { HISTORY_MAX_ENTRIES } from '../constants/canvas.js';

/**
 * @typedef {import('../models/diagramState.js').DiagramState} DiagramState
 */

/**
 * Estructura de la pila de historial: entradas + índice del snapshot actual.
 * @typedef {Object} HistoryStack
 * @property {DiagramState[]} entries
 * @property {number} index
 */

/**
 * Crea una pila de historial vacía (sin entradas, índice -1).
 * @returns {HistoryStack}
 */
export function createHistoryStack() {
  return { entries: [], index: -1 };
}

/**
 * Guarda un snapshot del estado actual en la pila.
 * Descarta entradas futuras si se editó después de un undo.
 * @param {HistoryStack} stack
 * @param {DiagramState} state
 * @param {number} [maxEntries]
 * @returns {HistoryStack}
 */
export function pushHistory(stack, state, maxEntries = HISTORY_MAX_ENTRIES) {
  const snapshot = cloneDiagramState(state);
  // Mantener solo entradas hasta el índice actual (descartar redo)
  const trimmed = stack.entries.slice(0, stack.index + 1);
  const entries = [...trimmed, snapshot].slice(-maxEntries);
  return { entries, index: entries.length - 1 };
}

/**
 * Retrocede un paso en el historial y devuelve el estado anterior.
 * @param {HistoryStack} stack
 * @returns {{ stack: HistoryStack, state: DiagramState | null }}
 */
export function undoHistory(stack) {
  if (stack.index <= 0) return { stack, state: null };
  const index = stack.index - 1;
  return {
    stack: { ...stack, index },
    state: cloneDiagramState(stack.entries[index]),
  };
}

/**
 * Avanza un paso en el historial y devuelve el estado siguiente.
 * @param {HistoryStack} stack
 * @returns {{ stack: HistoryStack, state: DiagramState | null }}
 */
export function redoHistory(stack) {
  if (stack.index >= stack.entries.length - 1) return { stack, state: null };
  const index = stack.index + 1;
  return {
    stack: { ...stack, index },
    state: cloneDiagramState(stack.entries[index]),
  };
}

/**
 * Inicializa la pila con el estado actual como única entrada (índice 0).
 * @param {DiagramState} state
 * @returns {HistoryStack}
 */
export function initHistoryWithState(state) {
  return { entries: [cloneDiagramState(state)], index: 0 };
}

/** Indica si hay al menos un paso anterior disponible para undo. */
export function canUndo(stack) {
  return stack.index > 0;
}

/** Indica si hay pasos posteriores disponibles para redo. */
export function canRedo(stack) {
  return stack.index < stack.entries.length - 1;
}
