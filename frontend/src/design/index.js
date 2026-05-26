/**
 * Librería del sector Diseño (editor DFD).
 * Importar desde: import { createShape, getConnectionLine, ... } from '../design';
 */

// Constantes
export {
  CANVAS_SIZE,
  CANVAS_CENTER_OFFSET,
  ZOOM_LIMITS,
  SHAPE_SIZE_LIMITS,
  DROP_OFFSET,
  HISTORY_MAX_ENTRIES,
  EXPORT_DEFAULTS,
} from './constants/canvas.js';

export {
  SHAPE_TYPES,
  palette,
  PALETTE_DRAG_TYPE_KEY,
} from './constants/palette.js';

// Matemática
export {
  shapeCenter,
  vectorLength,
  ellipseBorderScale,
  rectBorderScale,
  polygonBorderScale,
  getShapeOutlineVertices,
  rectExtents,
} from './math/geometry.js';

export {
  clampZoom,
  stepZoomIn,
  stepZoomOut,
  screenToCanvas,
  computeCenterPan,
  computePanForZoomChange,
  clientDeltaToCanvas,
} from './math/zoom.js';

export {
  getConnectionLine,
  getConnectionLineFromMap,
} from './math/connections.js';

export {
  getDiagramBounds,
  captureRegionFromBounds,
} from './math/bounds.js';

// Modelos
export {
  createShape,
  duplicateShape,
  translateShape,
  resizeShape,
  setShapeFontSize,
  bringShapeToFront,
  shapesToMap,
  getDefaultTitle,
  getDefaultSize,
  clampIfDimensions,
  clampShapeDimensions,
} from './models/shape.js';

export {
  createConnection,
  removeConnectionsForShape,
  handleConnectClick,
} from './models/connection.js';

export {
  parseDiagramContent,
  serializeDiagram,
  cloneDiagramState,
  emptyDiagramState,
  nextShapeIdFromList,
} from './models/diagramState.js';

// Operaciones
export {
  removeShape,
  moveShapeById,
  resizeShapeById,
  deleteShapeFromDiagram,
  addShapeToDiagram,
} from './operations/shapes.js';

export {
  createHistoryStack,
  pushHistory,
  undoHistory,
  redoHistory,
  initHistoryWithState,
  canUndo,
  canRedo,
} from './operations/history.js';

// Exportación
export {
  captureDiagramPreview,
  captureDiagramHighRes,
  canvasToJpegDataUrl,
  canvasToPngDataUrl,
  resetZoomLayerInClone,
} from './export/capture.js';

export {
  buildInlinePdfDataUrl,
  downloadDiagramPdf,
} from './export/pdf.js';

export { default as ShapePreview } from './components/ShapePreview.jsx';
