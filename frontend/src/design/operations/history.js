/** Pila undo/redo del estado completo del diagrama. */
import { cloneDiagramState } from '../models/diagramState.js';
import { HISTORY_MAX_ENTRIES } from '../constants/canvas.js';

/**
 * @typedef {import('../models/diagramState.js').DiagramState} DiagramState
 */

/**
 * @typedef {Object} HistoryStack
 * @property {DiagramState[]} entries
 * @property {number} index
 */

/**
 * @returns {HistoryStack}
 */
export function createHistoryStack() {
  return { entries: [], index: -1 };
}

/**
 * @param {HistoryStack} stack
 * @param {DiagramState} state
 * @param {number} [maxEntries]
 * @returns {HistoryStack}
 */
export function pushHistory(stack, state, maxEntries = HISTORY_MAX_ENTRIES) {
  const snapshot = cloneDiagramState(state);
  const trimmed = stack.entries.slice(0, stack.index + 1);
  const entries = [...trimmed, snapshot].slice(-maxEntries);
  return { entries, index: entries.length - 1 };
}

/**
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
 * @param {DiagramState} state
 * @returns {HistoryStack}
 */
export function initHistoryWithState(state) {
  return { entries: [cloneDiagramState(state)], index: 0 };
}

export function canUndo(stack) {
  return stack.index > 0;
}

export function canRedo(stack) {
  return stack.index < stack.entries.length - 1;
}
