/** Límites del lienzo, zoom, historial y opciones por defecto de exportación. */

// Tamaño del lienzo virtual en píxeles (área de dibujo ampliable)
export const CANVAS_SIZE = { width: 2000, height: 2000 };

// Offset del centro del lienzo; usado para centrar el origen (0,0) en el viewport
export const CANVAS_CENTER_OFFSET = 1000;

// Restricciones del zoom: mínimo, máximo e incremento por paso (rueda o botones)
export const ZOOM_LIMITS = {
  min: 0.25,   // Zoom mínimo (25 %)
  max: 3,      // Zoom máximo (300 %)
  step: 0.15,  // Incremento por cada acción de zoom
};

// Dimensiones mínimas al redimensionar figuras genéricas (no IF)
export const SHAPE_SIZE_LIMITS = {
  minWidth: 80,
  minHeight: 50,
};

// Desplazamiento por defecto al soltar una figura arrastrada desde la paleta
export const DROP_OFFSET = { x: 20, y: 20 };

// Cantidad máxima de snapshots en la pila de historial (undo/redo)
export const HISTORY_MAX_ENTRIES = 30;

// Valores por defecto para capturas de imagen y generación de PDF
export const EXPORT_DEFAULTS = {
  padding: 60,              // Margen alrededor del contenido en capturas preview
  pdfPadding: 100,          // Margen extra en exportación PDF
  minCaptureWidth: 800,     // Ancho mínimo si el diagrama está vacío
  minCaptureHeight: 600,    // Alto mínimo si el diagrama está vacío
  previewScale: 0.8,        // Escala html2canvas para vista previa
  pdfScale: 2,              // Escala html2canvas para PDF (mayor resolución)
  previewBackground: null,  // Fondo transparente en preview PNG
  pdfBackground: '#ffffff', // Fondo blanco en PDF
  jpegQuality: 0.6,         // Calidad de compresión JPEG (0–1)
};
