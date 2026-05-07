
import React from 'react';

// figura para el inicio y el final del diagrama
export const StartEndShape = ({ shape, fsContext }) => (
  <div className={`shape shape-circle ${shape.type === 'start' ? 'shape-start' : 'shape-end'}`}>
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
  </div>
);

// figura para la entrada de datos o input
export const InputShape = ({ shape, fsContext }) => (
  <div className="shape-input">
    <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="0,0 100,0 85,100 15,100" />
    </svg>
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
  </div>
);

// figura para la salida de datos o impresion
export const PrintShape = ({ shape, fsContext }) => (
  <div className="shape-print">
    <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="15,0 85,0 100,100 0,100" />
    </svg>
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
  </div>
);

// figura para representar el ciclo for
export const ForShape = ({ shape, fsContext }) => (
  <div className="shape-for-layout">
    <div className="shape shape-process for-process-box">
      <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
    </div>
    <div className="for-loop-arm">
      <div className="for-loop-circle">
        <div className="editable-text top-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>I</div>
        <div className="line-divider"></div>
        <div className="editable-text bottom-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>1/N</div>
      </div>
    </div>
  </div>
);

// figura para representar el ciclo while
export const WhileShape = ({ shape, fsContext }) => (
  <div className="shape-while-container">
    <div className="while-header">
      <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>WHILE</div>
    </div>
    <div className="while-body">
      <div className="editable-text internal-placeholder" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>Arrastra procesos aquí</div>
    </div>
  </div>
);

// figura para representar la condicion if
export const IfShape = ({ shape, fsContext }) => (
  <div className="shape-if-house">
    <div className="if-roof">
      <svg className="roof-triangle-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,0 100,100 0,100" fill="white" stroke="black" />
      </svg>
      <div className="if-text-overlay">
        <div className="editable-text if-condition" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>Condición</div>
      </div>
    </div>
    <div className="if-body">
      <div className="if-header-row">
        <div className="if-header-si">SI</div>
        <div className="if-header-no">NO</div>
      </div>
      <div className="if-content-row">
        <div className="if-col-si internal-placeholder" />
        <div className="if-col-no internal-placeholder" />
      </div>
    </div>
  </div>
);

// figura para representar un proceso o asignacion
export const ProcessShape = ({ shape, fsContext }) => (
  <div className="shape shape-process">
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
  </div>
);
