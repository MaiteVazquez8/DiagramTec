/** Tipos de figura disponibles en la paleta DFD y configuración de arrastre. */

// Mapa de identificadores internos para cada tipo de bloque del diagrama de flujo
export const SHAPE_TYPES = {
  START: 'start',       // Terminador de inicio (óvalo)
  END: 'end',           // Terminador de fin (óvalo)
  CONNECT: 'connect',   // Herramienta de conexión (no es una figura en el lienzo)
  INPUT: 'input',       // Entrada de datos (paralelogramo)
  PRINT: 'print',       // Salida / impresión (paralelogramo invertido)
  PROCESS: 'process',   // Proceso o asignación (rectángulo)
  FOR: 'for',           // Ciclo FOR (forma en L)
  WHILE: 'while',       // Ciclo WHILE (forma en U)
  IF: 'if',             // Condicional IF (forma de casa/techo)
};

// Elementos mostrados en la paleta lateral: tipo interno + etiqueta visible para el usuario
export const palette = [
  { type: SHAPE_TYPES.START, label: 'Inicio' },
  { type: SHAPE_TYPES.END, label: 'Final' },
  { type: SHAPE_TYPES.CONNECT, label: 'Conexión' },
  { type: SHAPE_TYPES.INPUT, label: 'Entrada / Input' },
  { type: SHAPE_TYPES.PRINT, label: 'Salida / Print' },
  { type: SHAPE_TYPES.PROCESS, label: 'Proceso / Variable' },
  { type: SHAPE_TYPES.FOR, label: 'Ciclo FOR' },
  { type: SHAPE_TYPES.WHILE, label: 'Ciclo WHILE' },
  { type: SHAPE_TYPES.IF, label: 'Ciclo IF' },
];

// Clave usada en dataTransfer.setData al arrastrar una figura desde la paleta al lienzo
export const PALETTE_DRAG_TYPE_KEY = 'shape-type';
