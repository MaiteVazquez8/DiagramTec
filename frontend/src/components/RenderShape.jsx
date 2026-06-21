/** Despacha el componente SVG/HTML correcto según shape.type. */
import React from 'react';
import { 
  StartEndShape, InputShape, PrintShape, ForShape, WhileShape, IfShape, ProcessShape 
} from './DiagramShapes.jsx';

/**
 * Factory de renderizado: elige el componente visual según shape.type.
 * @param {{ shape: object }} props - shape contiene type, title, fontSize, etc.
 */
export default function RenderShape({ shape }) {
  // Contexto de estilo compartido para el tamaño de fuente del texto editable
  const fsContext = { fontSize: `${shape.fontSize || 16}px` };

  // Switch por tipo de forma del diagrama de flujo
  switch (shape.type) {
    case 'start':
    case 'end':
      return <StartEndShape shape={shape} fsContext={fsContext} />;
    case 'input':
      return <InputShape shape={shape} fsContext={fsContext} />;
    case 'print':
      return <PrintShape shape={shape} fsContext={fsContext} />;
    case 'for':
      return <ForShape shape={shape} fsContext={fsContext} />;
    case 'while':
      return <WhileShape shape={shape} fsContext={fsContext} />;
    case 'if':
      return <IfShape shape={shape} fsContext={fsContext} />;
    default:
      // Cualquier otro tipo cae en proceso genérico (rectángulo)
      return <ProcessShape shape={shape} fsContext={fsContext} />;
  }
}
