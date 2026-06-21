/**
 * Definición visual de cada tipo de forma del diagrama
 * (inicio/fin, proceso, entrada/salida, for, while, if).
 */
import React from 'react';

/** Handlers comunes en texto editable: evitan que el drag del lienzo capture el evento. */
const stopPointer = (e) => e.stopPropagation();

/**
 * Forma ovalada de inicio o fin del flujo.
 * @param {{ shape: object, fsContext: object }} props
 */
export const StartEndShape = ({ shape, fsContext }) => (
  <div className={`shape shape-circle ${shape.type === 'start' ? 'shape-start' : 'shape-end'}`}>
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>{shape.title}</div>
  </div>
);

/** Paralelogramo de entrada de datos (input). */
export const InputShape = ({ shape, fsContext }) => (
  <div className="shape-input">
    <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="0,0 100,0 85,100 15,100" />
    </svg>
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>{shape.title}</div>
  </div>
);

/** Paralelogramo invertido para salida/impresión (print). */
export const PrintShape = ({ shape, fsContext }) => (
  <div className="shape-print">
    <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="15,0 85,0 100,100 0,100" />
    </svg>
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>{shape.title}</div>
  </div>
);

/** Estructura for: cuerpo del proceso + brazo con contador I y fracción 1/N. */
export const ForShape = ({ shape, fsContext }) => (
  <div className="shape-for-layout">
    <div className="shape shape-process for-process-box">
      <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>{shape.title}</div>
    </div>
    <div className="for-loop-arm">
      <div className="for-loop-circle">
        <div className="editable-text top-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>I</div>
        <div className="line-divider"></div>
        <div className="editable-text bottom-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>1/N</div>
      </div>
    </div>
  </div>
);

/** Estructura while: cabecera con condición y cuerpo para procesos anidados. */
export const WhileShape = ({ shape, fsContext }) => (
  <div className="shape-while-container">
    <div className="while-header">
      <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>WHILE</div>
    </div>
    <div className="while-body">
      <div className="editable-text internal-placeholder" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>Arrastra procesos aquí</div>
    </div>
  </div>
);

/** Estructura if: techo triangular con condición y columnas SI / NO. */
export const IfShape = ({ shape, fsContext }) => (
  <div className="shape-if-house">
    <div className="if-roof">
      <svg className="roof-triangle-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,0 100,100 0,100" fill="white" stroke="black" />
      </svg>
      <div className="if-text-overlay">
        <div
          className="editable-text if-condition"
          style={fsContext}
          contentEditable
          suppressContentEditableWarning
          onPointerDown={stopPointer}
          onPointerUp={stopPointer}
          onClick={stopPointer}
        >
          {shape.title}
        </div>
      </div>
    </div>
    <div className="if-body">
      <div className="if-header-row">
        <div className="if-header-si">SI</div>
        <div className="if-header-no">NO</div>
      </div>
      {/* Zonas internas reservadas para subprocesos (placeholders visuales) */}
      <div className="if-content-row">
        <div className="if-col-si internal-placeholder" />
        <div className="if-col-no internal-placeholder" />
      </div>
    </div>
  </div>
);

/** Rectángulo de proceso genérico (asignación u operación). */
export const ProcessShape = ({ shape, fsContext }) => (
  <div className="shape shape-process">
    <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={stopPointer} onPointerUp={stopPointer} onClick={stopPointer}>{shape.title}</div>
  </div>
);
