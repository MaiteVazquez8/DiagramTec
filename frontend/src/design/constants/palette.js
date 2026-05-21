/** Tipos de figura disponibles en la paleta DFD */

export const SHAPE_TYPES = {
  START: 'start',
  END: 'end',
  CONNECT: 'connect',
  INPUT: 'input',
  PRINT: 'print',
  PROCESS: 'process',
  FOR: 'for',
  WHILE: 'while',
  IF: 'if',
};

export const palette = [
  { type: SHAPE_TYPES.START, label: 'Inicio' },
  { type: SHAPE_TYPES.END, label: 'Final' },
  { type: SHAPE_TYPES.CONNECT, label: 'Conexión' },
  { type: SHAPE_TYPES.INPUT, label: 'Entrada / Input' },
  { type: SHAPE_TYPES.PRINT, label: 'Salida / Print' },
  { type: SHAPE_TYPES.PROCESS, label: 'Proceso / Asignación' },
  { type: SHAPE_TYPES.FOR, label: 'Ciclo FOR' },
  { type: SHAPE_TYPES.WHILE, label: 'Ciclo WHILE' },
  { type: SHAPE_TYPES.IF, label: 'Ciclo IF' },
];

export const PALETTE_DRAG_TYPE_KEY = 'shape-type';
