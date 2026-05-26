/** Límites del lienzo, zoom, exportación (padding, escala, fondo preview PNG). */

export const CANVAS_SIZE = { width: 2000, height: 2000 };

export const CANVAS_CENTER_OFFSET = 1000;

export const ZOOM_LIMITS = {
  min: 0.25,
  max: 3,
  step: 0.15,
};

export const SHAPE_SIZE_LIMITS = {
  minWidth: 80,
  minHeight: 50,
};

export const DROP_OFFSET = { x: 20, y: 20 };

export const HISTORY_MAX_ENTRIES = 30;

export const EXPORT_DEFAULTS = {
  padding: 60,
  pdfPadding: 100,
  minCaptureWidth: 800,
  minCaptureHeight: 600,
  previewScale: 0.8,
  pdfScale: 2,
  previewBackground: null,
  pdfBackground: '#ffffff',
  jpegQuality: 0.6,
};
