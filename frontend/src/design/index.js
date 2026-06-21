/**
 * Punto de entrada de la librería del sector Diseño (editor DFD).
 * Reexporta constantes, matemática, modelos, operaciones, exportación y componentes.
 * Importar desde: import { createShape, getConnectionLine, ... } from '../design';
 */

// --- Constantes del lienzo, zoom, historial y exportación ---
export {
  CANVAS_SIZE,           // Dimensiones totales del lienzo virtual
  CANVAS_CENTER_OFFSET,  // Desplazamiento del origen para centrar el diagrama
  ZOOM_LIMITS,           // Límites mínimo, máximo e incremento del zoom
  SHAPE_SIZE_LIMITS,     // Ancho y alto mínimos al redimensionar figuras
  DROP_OFFSET,           // Desplazamiento al soltar una figura desde la paleta
  HISTORY_MAX_ENTRIES,   // Máximo de estados guardados en undo/redo
  EXPORT_DEFAULTS,       // Padding, escala y calidad por defecto al exportar
} from './constants/canvas.js';

// --- Tipos de figura DFD y configuración de la paleta lateral ---
export {
  SHAPE_TYPES,           // Identificadores de cada tipo de bloque DFD
  palette,               // Lista de figuras disponibles con etiqueta visible
  PALETTE_DRAG_TYPE_KEY, // Clave del dataTransfer al arrastrar desde la paleta
} from './constants/palette.js';

// --- Geometría: centros, bordes y contornos de figuras ---
export {
  shapeCenter,              // Centro geométrico de una figura
  vectorLength,             // Longitud de un vector (distancia euclidiana)
  ellipseBorderScale,       // Factor de escala hasta el borde de una elipse
  rectBorderScale,          // Factor de escala hasta el borde de un rectángulo
  polygonBorderScale,       // Factor de escala hasta el borde de un polígono convexo
  getShapeOutlineVertices,  // Vértices del contorno visible (input, print, if)
  rectExtents,              // Límites min/max de un rectángulo
} from './math/geometry.js';

// --- Zoom y conversión de coordenadas pantalla ↔ lienzo ---
export {
  clampZoom,                 // Restringe el zoom dentro de los límites permitidos
  stepZoomIn,                // Aumenta el zoom un paso y lo acota
  stepZoomOut,               // Disminuye el zoom un paso y lo acota
  screenToCanvas,            // Convierte coordenadas del ratón a coordenadas del lienzo
  computeCenterPan,          // Calcula el pan para centrar el origen en el viewport
  computePanForZoomChange,   // Ajusta el pan al cambiar zoom manteniendo el foco
  clientDeltaToCanvas,       // Convierte un delta de píxeles de pantalla a espacio lienzo
} from './math/zoom.js';

// --- Líneas de conexión entre figuras (puntos de anclaje SVG) ---
export {
  getConnectionLine,         // Segmento entre dos figuras (borde a borde)
  getConnectionLineFromMap,  // Igual que getConnectionLine pero resuelve IDs desde un Map
} from './math/connections.js';

// --- Límites del diagrama para recortar capturas ---
export {
  getDiagramBounds,          // Caja envolvente de todas las figuras con padding
  captureRegionFromBounds,   // Región x/y/ancho/alto para html2canvas
} from './math/bounds.js';

// --- Modelo de figura: crear, mover, redimensionar y duplicar ---
export {
  createShape,            // Crea una figura nueva con tamaño y título por defecto
  duplicateShape,         // Copia una figura con desplazamiento y nuevo ID
  translateShape,         // Mueve una figura sumando dx/dy a su posición
  resizeShape,            // Cambia ancho/alto respetando límites del tipo
  setShapeFontSize,       // Actualiza el tamaño de fuente de una figura en el array
  bringShapeToFront,      // Reordena el array poniendo la figura al final (z-index)
  shapesToMap,            // Indexa figuras por id (string, number) para búsqueda rápida
  getDefaultTitle,        // Título inicial según el tipo de figura
  getDefaultSize,         // Dimensiones iniciales según el tipo de figura
  clampIfDimensions,      // Ajusta proporciones del bloque IF
  clampShapeDimensions,     // Aplica límites de tamaño según el tipo de figura
} from './models/shape.js';

// --- Modelo de conexiones entre figuras ---
export {
  createConnection,           // Crea un enlace dirigido entre dos figuras
  removeConnectionsForShape,  // Elimina todas las conexiones de una figura
  removeConnection,             // Elimina una conexión por su ID
  getPairKey,                   // Clave única para un par de figuras (sin dirección)
  hasConnectionBetween,         // Comprueba si ya existe enlace entre dos figuras
  handleConnectClick,           // Lógica de clic: seleccionar origen, crear o quitar enlace
} from './models/connection.js';

// --- Estado completo del diagrama (serialización y clonado) ---
export {
  parseDiagramContent,   // Parsea JSON/string de la API a { shapes, connections }
  serializeDiagram,      // Prepara el estado para guardar en API o localStorage
  cloneDiagramState,     // Copia profunda del estado (undo, snapshots)
  emptyDiagramState,     // Estado inicial vacío
  nextShapeIdFromList,   // Genera el siguiente ID numérico según la cantidad de figuras
} from './models/diagramState.js';

// --- Operaciones de alto nivel sobre el diagrama ---
export {
  removeShape,            // Quita una figura del array shapes
  moveShapeById,          // Desplaza una figura por ID en el array
  resizeShapeById,        // Cambia dimensiones de una figura por ID
  deleteShapeFromDiagram, // Elimina figura y sus conexiones del estado completo
  addShapeToDiagram,      // Añade una figura nueva al estado
} from './operations/shapes.js';

// --- Historial undo/redo del diagrama ---
export {
  createHistoryStack,    // Crea una pila de historial vacía
  pushHistory,           // Guarda un snapshot del estado actual
  undoHistory,           // Retrocede un paso y devuelve el estado anterior
  redoHistory,           // Avanza un paso y devuelve el estado siguiente
  initHistoryWithState,  // Inicializa la pila con el estado actual como base
  canUndo,               // Indica si hay pasos anteriores disponibles
  canRedo,               // Indica si hay pasos posteriores disponibles
} from './operations/history.js';

// --- Captura del lienzo como imagen (preview y alta resolución) ---
export {
  captureDiagramPreview,   // Captura PNG/JPEG de baja escala para vista previa
  captureDiagramHighRes,   // Captura de alta resolución para PDF
  canvasToJpegDataUrl,     // Convierte canvas a data URL JPEG comprimido
  canvasToPngDataUrl,      // Convierte canvas a data URL PNG sin pérdida
  resetZoomLayerInClone,   // Normaliza el clon DOM de html2canvas (quita zoom/fondo)
} from './export/capture.js';

// --- Generación y descarga de PDF ---
export {
  buildInlinePdfDataUrl, // PDF embebido como data URI (para guardar en API)
  downloadDiagramPdf,    // Descarga PDF ajustado al contenido con marca de agua
} from './export/pdf.js';

// --- Componente React: miniatura de figura en la paleta ---
export { default as ShapePreview } from './components/ShapePreview.jsx';
