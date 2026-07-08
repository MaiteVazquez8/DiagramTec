/** Despacha el componente SVG/HTML correcto según shape.type. */
import React from 'react';
import {
  StartEndShape, InputShape, PrintShape, ForShape, WhileShape, IfShape, ProcessShape,
} from './DiagramShapes.jsx';

const shapeCommonProps = (shape, preview, onTextChange, onTextCommit) => ({
  shape,
  preview,
  onTextChange,
  onTextCommit,
});

// funcion para renderizar la figura correcta segun su tipo
export default function RenderShape({ shape, preview = false, onTextChange, onTextCommit }) {
  const fsContext = { fontSize: `${shape.fontSize || 16}px` };
  const common = shapeCommonProps(shape, preview, onTextChange, onTextCommit);

  switch (shape.type) {
    case 'start':
    case 'end':
    case 'startEnd':
      return <StartEndShape {...common} fsContext={fsContext} />;
    case 'input':
      return <InputShape {...common} fsContext={fsContext} />;
    case 'print':
      return <PrintShape {...common} fsContext={fsContext} />;
    case 'for':
      return <ForShape {...common} fsContext={fsContext} />;
    case 'while':
      return <WhileShape {...common} fsContext={fsContext} />;
    case 'if':
      return <IfShape {...common} fsContext={fsContext} />;
    default:
      return <ProcessShape {...common} fsContext={fsContext} />;
  }
}
