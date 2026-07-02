/**
 * Definición visual de cada tipo de forma del diagrama
 * (inicio/fin, proceso, entrada/salida, for, while, if).
 */
import React from 'react';
import EditableShapeText from './EditableShapeText.jsx';

const textProps = (shape, fsContext, preview, onTextChange, onTextCommit) => ({
  text: shape.title,
  style: fsContext,
  editable: !preview,
  onTextChange: preview ? undefined : onTextChange,
  onTextCommit: preview ? undefined : onTextCommit,
});

// figura para el inicio y el final del diagrama
export const StartEndShape = ({ shape, fsContext, preview = false, onTextChange, onTextCommit }) => (
  <div className={`shape shape-circle ${shape.type === 'start' ? 'shape-start' : 'shape-end'}`}>
    <EditableShapeText {...textProps(shape, fsContext, preview, onTextChange, onTextCommit)} />
  </div>
);

// figura para la entrada de datos o input
export const InputShape = ({ shape, fsContext, preview = false, onTextChange, onTextCommit }) => (
  <div className="shape-input">
    <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="0,0 100,0 85,100 15,100" />
    </svg>
    <EditableShapeText {...textProps(shape, fsContext, preview, onTextChange, onTextCommit)} />
  </div>
);

// figura para la salida de datos o impresion
export const PrintShape = ({ shape, fsContext, preview = false, onTextChange, onTextCommit }) => (
  <div className="shape-print">
    <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="15,0 85,0 100,100 0,100" />
    </svg>
    <EditableShapeText {...textProps(shape, fsContext, preview, onTextChange, onTextCommit)} />
  </div>
);

// figura para representar el ciclo for
export const ForShape = ({ shape, fsContext, preview = false, onTextChange, onTextCommit }) => (
  <div className="shape-for-layout">
    <div className="shape shape-process for-process-box">
      <EditableShapeText {...textProps(shape, fsContext, preview, onTextChange, onTextCommit)} />
    </div>
    <div className="for-loop-arm">
      <div className="for-loop-circle">
        <EditableShapeText
          text={preview ? 'I' : ''}
          style={fsContext}
          className="top-text"
          editable={!preview}
        />
        <div className="line-divider"></div>
        <EditableShapeText
          text={preview ? '1/N' : ''}
          style={fsContext}
          className="bottom-text"
          editable={!preview}
        />
      </div>
    </div>
  </div>
);

// figura para representar el ciclo while
export const WhileShape = ({ shape, fsContext, preview = false, onTextChange, onTextCommit }) => (
  <div className="shape-while-container">
    <div className="while-header">
      <EditableShapeText
        {...textProps(shape, fsContext, preview, onTextChange, onTextCommit)}
        text={preview ? 'WHILE' : shape.title}
      />
    </div>
    <div className="while-body">
      <EditableShapeText
        text={preview ? 'Procesos' : ''}
        style={fsContext}
        className="internal-placeholder"
        editable={!preview}
      />
    </div>
  </div>
);

// figura para representar la condicion if
export const IfShape = ({ shape, fsContext, preview = false, onTextChange, onTextCommit }) => (
  <div className="shape-if-house">
    <div className="if-roof">
      <svg className="roof-triangle-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,0 100,100 0,100" fill="white" stroke="black" />
      </svg>
      <div className="if-text-overlay">
        <EditableShapeText
          {...textProps(shape, fsContext, preview, onTextChange, onTextCommit)}
          className="if-condition"
        />
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
export const ProcessShape = ({ shape, fsContext, preview = false, onTextChange, onTextCommit }) => (
  <div className="shape shape-process">
    <EditableShapeText {...textProps(shape, fsContext, preview, onTextChange, onTextCommit)} />
  </div>
);
