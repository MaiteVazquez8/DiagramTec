import React from 'react';
import { 
  StartEndShape, InputShape, PrintShape, ForShape, WhileShape, IfShape, ProcessShape 
} from './DiagramShapes.jsx';

// funcion para renderizar la figura correcta segun su tipo
export default function RenderShape({ shape }) {
  // definimos el tamaño de fuente segun la propiedad de la figura
  const fsContext = { fontSize: `${shape.fontSize || 16}px` };
  // selector para retornar el componente grafico correspondiente
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
      return <ProcessShape shape={shape} fsContext={fsContext} />;
  }
}
