import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import html2canvas from 'html2canvas';

const palette = [
  { type: 'start', label: 'Inicio' },
  { type: 'end', label: 'Final' },
  { type: 'connect', label: 'Conexión' },
  { type: 'input', label: 'Entrada / Input' },
  { type: 'print', label: 'Salida / Print' },
  { type: 'process', label: 'Proceso / Asignación' },
  { type: 'for', label: 'Ciclo FOR' },
  { type: 'while', label: 'Ciclo WHILE' },
  { type: 'if', label: 'Ciclo IF' },
];

const defaultShape = (type, x, y, id) => ({
  id,
  type,
  title:
    type === 'start' ? 'INICIO' :
    type === 'end' ? 'FINAL' :
    type === 'input' ? 'INPUT' :
    type === 'print' ? 'PRINT' :
    type === 'process' ? 'A = B' :
    type === 'data-store' ? 'ALMACÉN' :
    type === 'for' ? 'PROCESOS' :
    type === 'while' ? 'WHILE' :
    type === 'if' ? 'IF...' :
    'BLOQUE',
  x,
  y,
  width: type === 'if' ? 220 : type === 'for' ? 220 : type === 'while' ? 220 : 140,
  height: type === 'if' ? 180 : type === 'for' ? 120 : type === 'while' ? 160 : 90,
});

function renderShape(shape) {
  if (shape.type === 'start' || shape.type === 'end') {
    return (
      <div className={`shape shape-circle ${shape.type === 'start' ? 'shape-start' : 'shape-end'}`}>
        <div className="editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
      </div>
    );
  }

  if (shape.type === 'input') {
    return (
      <div className="shape shape-input">
        <div className="editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
      </div>
    );
  }

  if (shape.type === 'print') {
    return (
      <div className="shape shape-print">
        <div className="editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
      </div>
    );
  }

  if (shape.type === 'for') {
    return (
      <div className="shape-for-container">
        <div className="shape-for-process">
          <div className="editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
        </div>
        <div className="shape-for-lines">
          <div className="for-loop-circle">
            <div className="editable-text top-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>I</div>
            <div className="line-divider"></div>
            <div className="editable-text bottom-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>1/N</div>
          </div>
        </div>
      </div>
    );
  }

  if (shape.type === 'while') {
    return (
      <div className="shape-while-container">
        <div className="while-header">
          <span className="mientras-text">Mientras</span>
          <div className="while-condition-box">
            <div className="editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>WHILE</div>
            <div className="condition-popup editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>Condición</div>
          </div>
        </div>
        <div className="while-body">
          <div className="internal-placeholder">
            <div className="editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>Arrastra procesos aquí</div>
          </div>
        </div>
      </div>
    );
  }

  if (shape.type === 'if') {
    return (
      <div className="shape-if-container">
        <div className="if-triangle">
          <div className="if-text">IF...</div>
          <div className="editable-text if-condition" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>Condición</div>
        </div>
        <div className="if-columns">
          <div className="if-col si-col">
            <div className="col-header">SI</div>
            <div className="col-body internal-placeholder"></div>
          </div>
          <div className="if-col no-col">
            <div className="col-header">NO</div>
            <div className="col-body internal-placeholder"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shape shape-process">
      <div className="editable-text" contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
    </div>
  );
}

function renderPreview(type) {
  if (type === 'connect') {
    return (
      <div className="connect-preview">
        <svg width="110" height="40" viewBox="0 0 110 40" xmlns="http://www.w3.org/2000/svg">
          <line x1="10" y1="20" x2="90" y2="20" stroke="#111827" strokeWidth="4" markerEnd="url(#arrowhead)" />
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill="#111827" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  }
  return renderShape(defaultShape(type, 0, 0, 0));
}

export default function EditorPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [shapes, setShapes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saveTitle, setSaveTitle] = useState('Mi diagrama');
  const [saveClassId, setSaveClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const shapesById = useMemo(() => new Map(shapes.map((shape) => [shape.id, shape])), [shapes]);

  useEffect(() => {
    if (user) {
      api.get('/classes/available').then((response) => setClasses(response.data.classes)).catch(() => setClasses([]));
    }
    if (id) {
      api.get(`/designs/${id}`).then((response) => {
        const design = response.data.design;
        setSaveTitle(design.title);
        const content = JSON.parse(design.content);
        setShapes(content.shapes || []);
        setConnections(content.connections || []);
        setNextId((content.shapes?.length || 0) + 1);
      }).catch((err) => {
        setError('No se pudo cargar el diseño');
      });
    }
  }, [user, id]);

  const handleDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('shape-type');
    if (!type) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - 20;
    const y = event.clientY - rect.top - 20;
    setShapes((current) => [...current, defaultShape(type, x, y, nextId)]);
    setNextId((value) => value + 1);
  };

  const handleDragStart = (event, type) => {
    event.dataTransfer.setData('shape-type', type);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handlePaletteClick = (type) => {
    if (type === 'connect') {
      setConnectMode((current) => !current);
      setConnectSource(null);
    }
  };

  const handleShapeClick = (event, shape) => {
    if (!connectMode) return;

    event.stopPropagation();
    event.preventDefault();
    if (!connectSource) {
      setConnectSource(shape.id);
    } else if (connectSource !== shape.id) {
      setConnections((current) => [...current, { id: Date.now(), from: connectSource, to: shape.id }]);
      setConnectSource(null);
    } else {
      // Click on the same shape, deselect
      setConnectSource(null);
    }
  };

  const handleMouseDown = (event, shape) => {
    if (connectMode) {
      return;
    }

    event.stopPropagation();
    setSelectedId(shape.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { ...shape };

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setShapes((current) =>
        current.map((item) =>
          item.id === shape.id ? { ...item, x: initial.x + dx, y: initial.y + dy } : item
        )
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const getConnectionLine = (connection) => {
    const from = shapesById.get(connection.from);
    const to = shapesById.get(connection.to);
    if (!from || !to) return null;

    const x1c = from.x + from.width / 2;
    const y1c = from.y + from.height / 2;
    const x2c = to.x + to.width / 2;
    const y2c = to.y + to.height / 2;
    const dx = x2c - x1c;
    const dy = y2c - y1c;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx === 0 && absDy === 0) {
      return null;
    }

    const fromScale = Math.min(
      absDx === 0 ? Infinity : (from.width / 2) / absDx,
      absDy === 0 ? Infinity : (from.height / 2) / absDy
    );
    const toScale = Math.min(
      absDx === 0 ? Infinity : (to.width / 2) / absDx,
      absDy === 0 ? Infinity : (to.height / 2) / absDy
    );

    return {
      x1: x1c + dx * fromScale,
      y1: y1c + dy * fromScale,
      x2: x2c - dx * toScale,
      y2: y2c - dy * toScale,
    };
  };

  const handleClear = () => {
    setShapes([]);
    setConnections([]);
    setSelectedId(null);
    setConnectSource(null);
  };

  const handleSave = async () => {
    setMessage('');
    setError('');
    if (!user) {
      setError('Debes ingresar para guardar diseños');
      return;
    }
    try {
      const data = { title: saveTitle, content: { shapes, connections }, classId: saveClassId || null };
      if (id) {
        await api.put(`/designs/${id}`, data);
      } else {
        await api.post('/designs', data);
      }
      setMessage('Diseño guardado correctamente');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el diseño');
    }
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    setMessage('');
    html2canvas(canvasRef.current, { backgroundColor: '#ffffff', scale: 2 }).then((canvas) => {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'diagrama-dfd.png';
      link.href = url;
      link.click();
    });
  };

  return (
    <section className="page-container editor-page">
      <div className="editor-sidebar">
        <div className="sidebar-header">
          <h2>Diseños DFD</h2>
          <p>Arrastra para usar</p>
        </div>
        <div className="shapes-palette">
          {palette.map((item) => (
            <div key={item.type} className="palette-item">
              <span className="shape-label">{item.label}</span>
              {item.type === 'connect' ? (
                <div className={`shape-wrapper connect-action ${connectMode ? 'active' : ''}`} onClick={() => handlePaletteClick(item.type)}>
                  {renderPreview(item.type)}
                </div>
              ) : (
                <div className="shape-wrapper drag-source" draggable onDragStart={(event) => handleDragStart(event, item.type)}>
                  {renderPreview(item.type)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="canvas-panel">
        <div className="toolbar">
          <input type="text" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} placeholder="Título del diagrama" style={{ marginRight: '1rem', padding: '0.5rem' }} />
          {user?.role === 'teacher' && classes.length > 0 ? (
            <select value={saveClassId} onChange={(e) => setSaveClassId(e.target.value)} style={{ marginRight: '1rem', padding: '0.5rem' }}>
              <option value="">Guardar en mi perfil</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          ) : null}
          <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
          <button className="btn btn-secondary" onClick={handleClear}>Limpiar Lienzo</button>
          <button className="btn btn-secondary" onClick={handleExport}>Exportar como Imagen</button>
        </div>
        <div className={`canvas-container ${connectMode ? 'connect-mode' : ''}`} ref={canvasRef} onDrop={handleDrop} onDragOver={(event) => event.preventDefault()} onClick={() => { setSelectedId(null); setConnectSource(null); }}>
          <svg id="connections-layer">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#111827" />
              </marker>
            </defs>
            {connections.map((connection) => {
              const line = getConnectionLine(connection);
              if (!line) return null;
              return <line key={connection.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className="connection-line" markerEnd="url(#arrowhead)" />;
            })}
          </svg>
          <div className="canvas-bg">
            <p className="canvas-hint">Arrastra formas aquí para comenzar a editar</p>
          </div>
          {shapes.map((shape) => (
            <div
              key={shape.id}
              className={`shape-element ${selectedId === shape.id ? 'selected' : ''} ${connectSource === shape.id ? 'connect-source' : ''}`}
              style={{ left: shape.x, top: shape.y, width: shape.width, height: shape.height }}
              onMouseDown={(event) => handleMouseDown(event, shape)}
              onClick={(event) => handleShapeClick(event, shape)}
            >
              {renderShape(shape)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
