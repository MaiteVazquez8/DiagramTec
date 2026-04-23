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
  id: id || Date.now().toString(),
  type,
  title:
    type === 'start' ? 'inicio' :
    type === 'end' ? 'FINAL' :
    type === 'input' ? 'INPUT' :
    type === 'print' ? 'PRINT' :
    type === 'process' ? 'A = B' :
    type === 'data-store' ? 'ALMACÉN' :
    type === 'for' ? 'PROCESOS' :
    type === 'while' ? 'WHILE' :
    type === 'if' ? 'IF......' :
    'BLOQUE',
  x,
  y,
  width: type === 'if' ? 220 : type === 'for' ? 220 : type === 'while' ? 220 : 140,
  height: type === 'if' ? 180 : type === 'for' ? 120 : type === 'while' ? 160 : 90,
  fontSize: 16,
});

function renderShape(shape) {
  const fsContext = { fontSize: `${shape.fontSize || 16}px` };

  if (shape.type === 'start' || shape.type === 'end') {
    return (
      <div className={`shape shape-circle ${shape.type === 'start' ? 'shape-start' : 'shape-end'}`}>
        <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
      </div>
    );
  }

  if (shape.type === 'input') {
    return (
      <div className="shape-input">
        <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="0,0 100,0 85,100 15,100" />
        </svg>
        <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
      </div>
    );
  }

  if (shape.type === 'print') {
    return (
      <div className="shape-print">
        <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="15,0 85,0 100,100 0,100" />
        </svg>
        <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
      </div>
    );
  }

  if (shape.type === 'for') {
    return (
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
  }

  if (shape.type === 'while') {
    return (
      <div className="shape-while-container">
        <div className="while-header">
          <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>WHILE</div>
        </div>
        <div className="while-body">
          <div className="editable-text internal-placeholder" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>Arrastra procesos aquí</div>
        </div>
      </div>
    );
  }

  if (shape.type === 'if') {
    return (
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
  }

  return (
    <div className="shape shape-process">
      <div className="editable-text" style={fsContext} contentEditable suppressContentEditableWarning onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{shape.title}</div>
    </div>
  );
}

function renderPreview(type) {
  if (type === 'connect') {
    return (
      <div className="connect-preview">
        <svg width="110" height="40" viewBox="0 0 110 40" xmlns="http://www.w3.org/2000/svg">
          <line x1="10" y1="20" x2="100" y2="20" stroke="#1B1717" strokeWidth="3" />
        </svg>
      </div>
    );
  }
  return renderShape(defaultShape(type, 0, 0, 0));
}

/* ── SVG Icons ── */
const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);


const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const ZoomResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <text x="7" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="700">1:1</text>
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

const LayersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
  </svg>
);

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = (newShapes, newConnections) => {
    const newState = JSON.parse(JSON.stringify({ shapes: newShapes, connections: newConnections }));
    setHistory(prev => {
      const updated = prev.slice(0, historyIndex + 1);
      const nextHistory = [...updated, newState].slice(-30);
      setHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const prevState = history[historyIndex - 1];
    setShapes(prevState.shapes);
    setConnections(prevState.connections);
    setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextState = history[historyIndex + 1];
    setShapes(nextState.shapes);
    setConnections(nextState.connections);
    setHistoryIndex(historyIndex + 1);
  };

  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 0.15;

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

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
        const initialShapes = content.shapes || [];
        const initialConnections = content.connections || [];
        setShapes(initialShapes);
        setConnections(initialConnections);
        setNextId((initialShapes?.length || 0) + 1);
        
        // Initial history state
        setHistory([{ shapes: initialShapes, connections: initialConnections }]);
        setHistoryIndex(0);
      }).catch((err) => {
        setError('No se pudo cargar el diseño');
      });
    }
  }, [user, id]);

  /* Clear message after 3s */
  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => { setMessage(''); setError(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

  /* Mouse wheel zoom */
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
        } else {
          setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
        }
      }
    };

    wrapper.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', handleWheel);
  }, []);
  
  /* Keyboard listeners for deletion */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't delete if user is typing in a contentEditable
      if (document.activeElement.contentEditable === 'true') return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          handleDeleteShape(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes]);

  const handleDeleteShape = (sid) => {
    const newShapes = shapes.filter(s => s.id !== sid);
    const newConnections = connections.filter(c => c.from !== sid && c.to !== sid);
    setShapes(newShapes);
    setConnections(newConnections);
    saveToHistory(newShapes, newConnections);
    if (selectedId === sid) setSelectedId(null);
  };

  const handleDuplicateShape = (sid) => {
    const original = shapesById.get(sid);
    if (!original) return;
    const newShape = {
      ...original,
      id: Date.now().toString(),
      x: original.x + 30,
      y: original.y + 30
    };
    const nextShapes = [...shapes, newShape];
    setShapes(nextShapes);
    saveToHistory(nextShapes, connections);
    setSelectedId(newShape.id);
  };

  const handleBringToFront = (sid) => {
    const target = shapes.find(s => s.id === sid);
    if (!target) return;
    const nextShapes = [...shapes.filter(s => s.id !== sid), target];
    setShapes(nextShapes);
    saveToHistory(nextShapes, connections);
  };

  const handleSendToBack = (sid) => {
    const target = shapes.find(s => s.id === sid);
    if (!target) return;
    const nextShapes = [target, ...shapes.filter(s => s.id !== sid)];
    setShapes(nextShapes);
    saveToHistory(nextShapes, connections);
  };

  const handleFontSizeChange = (event, sid) => {
    event.stopPropagation();
    const newSize = parseInt(event.target.value, 10);
    setShapes(prev => prev.map(s => s.id === sid ? { ...s, fontSize: newSize } : s));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('shape-type');
    if (!type) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom - 20;
    const y = (event.clientY - rect.top) / zoom - 20;
    const newShape = defaultShape(type, x, y, nextId);
    const nextShapes = [...shapes, newShape];
    setShapes(nextShapes);
    saveToHistory(nextShapes, connections);
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
      const newConnections = [...connections, { id: Date.now(), from: connectSource, to: shape.id }];
      setConnections(newConnections);
      saveToHistory(shapes, newConnections);
      setConnectSource(null);
    } else {
      setConnectSource(null);
    }
  };

  const handleMouseDown = (event, shape) => {
    if (connectMode || event.target.closest('.resize-handle') || event.target.closest('.delete-btn')) {
      return;
    }

    event.stopPropagation();
    setSelectedId(shape.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { ...shape };

    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      setShapes((current) =>
        current.map((item) =>
          item.id === shape.id ? { ...item, x: initial.x + dx, y: initial.y + dy } : item
        )
      );
    };

    const onMouseUp = () => {
      saveToHistory(shapes, connections);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeMouseDown = (event, shape) => {
    event.stopPropagation();
    event.preventDefault();
    
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = shape.width;
    const startHeight = shape.height;

    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      
      setShapes((current) =>
        current.map((item) =>
          item.id === shape.id 
            ? { ...item, width: Math.max(80, startWidth + dx), height: Math.max(50, startHeight + dy) } 
            : item
        )
      );
    };

    const onMouseUp = () => {
      saveToHistory(shapes, connections);
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
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return null;

    const getScale = (s) => {
      if (s.type === 'start' || s.type === 'end') {
        const angle = Math.atan2(dy, dx);
        const rx = s.width / 2;
        const ry = s.height / 2;
        // Ellipse intersection: r = (ab) / sqrt((b*cos)^2 + (a*sin)^2)
        const r = (rx * ry) / Math.sqrt(Math.pow(ry * Math.cos(angle), 2) + Math.pow(rx * Math.sin(angle), 2));
        return r / dist;
      }
      // Boxes / Trapezoids (simple AABB intersection for now)
      return Math.min(
        absDx === 0 ? Infinity : (s.width / 2) / absDx,
        absDy === 0 ? Infinity : (s.height / 2) / absDy
      );
    };

    const fromScale = getScale(from);
    const toScale = getScale(to);

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

  const handleCanvasMouseDown = (e) => {
    // Only pan if we click the wrapper directly or the pan-friendly background
    if (e.target.classList.contains('editor-canvas-fs') || e.target.classList.contains('canvas-zoom-layer')) {
      setIsPanning(true);
      const startX = e.clientX - pan.x;
      const startY = e.clientY - pan.y;

      const onMouseMove = (moveEvent) => {
        setPan({
          x: moveEvent.clientX - startX,
          y: moveEvent.clientY - startY
        });
      };

      const onMouseUp = () => {
        setIsPanning(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  return (
    <div className="editor-fullscreen" id="editor-page">
      {/* ── Sidebar ── */}
      <aside className={`editor-sidebar-fs ${sidebarOpen ? 'open' : 'collapsed'}`}>
        {/* Sidebar toggle */}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
          id="btn-toggle-sidebar"
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>

        <div className="sidebar-content-scroll">
          <div className="sidebar-header-fs">
            <h2>Diseños DFD</h2>
            <p>Arrastra para usar</p>
          </div>
          <div className="shapes-palette-fs">
            {palette.map((item) => (
              <div key={item.type} className="palette-item-fs">
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
      </aside>

      {/* ── Main Canvas Area ── */}
      <div className="editor-main-fs">
        {/* Top toolbar */}
        <div className="editor-toolbar-fs">
          <div className="toolbar-left-fs">
            {!sidebarOpen && (
              <div style={{ width: '40px' }} /> 
            )}
            <input
              type="text"
              className="toolbar-title-input"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Título del diagrama"
              id="editor-title-input"
            />
          </div>

          <div className="toolbar-center-fs">
            {classes.length > 0 && (
              <select
                className="toolbar-select"
                value={saveClassId}
                onChange={(e) => setSaveClassId(e.target.value)}
                id="editor-class-select"
              >
                <option value="">Guardar en mi perfil</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
          </div>

          <div className="toolbar-right-fs">
            {/* Toast messages */}
            {message && <span className="toolbar-toast success">{message}</span>}
            {error && <span className="toolbar-toast error">{error}</span>}

            <button className="btn btn-primary" onClick={handleSave} id="btn-save">
              <SaveIcon /> Guardar
            </button>
            <button className="btn btn-secondary" onClick={handleClear} id="btn-clear">
              <TrashIcon /> Limpiar
            </button>
            <button className="btn btn-secondary" onClick={handleExport} id="btn-export">
              <DownloadIcon /> Exportar
            </button>

            {/* Zoom controls */}
            <div className="zoom-controls">
              <button className="zoom-btn" onClick={zoomOut} title="Alejar" id="btn-zoom-out">
                <ZoomOutIcon />
              </button>
              <button className="zoom-label" onClick={zoomReset} title="Restablecer zoom" id="btn-zoom-reset">
                {Math.round(zoom * 100)}%
              </button>
              <button className="zoom-btn" onClick={zoomIn} title="Acercar" id="btn-zoom-in">
                <ZoomInIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas wrapper (handles scroll & wheel zoom) */}
        <div
          className={`editor-canvas-fs ${connectMode ? 'connect-mode' : ''} ${isPanning ? 'panning' : ''}`}
          ref={canvasWrapperRef}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          onClick={() => { setSelectedId(null); setConnectSource(null); }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Zoomable & Pannable inner layer */}
          <div
            ref={canvasRef}
            className="canvas-zoom-layer"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '2000px',
              height: '2000px',
              position: 'relative',
            }}
          >
          <svg id="connections-layer">
            {connections.map((connection) => {
              const line = getConnectionLine(connection);
              if (!line) return null;
              return <line key={connection.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className="connection-line" />;
            })}
          </svg>

          {shapes.length === 0 && !connectMode && (
            <div className="canvas-bg">
              <p className="canvas-hint">Arrastra formas aquí para comenzar a editar</p>
            </div>
          )}

          {connectMode && (
            <div className="connection-hint">
              {connectSource 
                ? "Ahora haz clic en la forma de destino" 
                : "Haz clic en la primera forma para comenzar la unión"}
            </div>
          )}

          {shapes.map((shape) => (
            <div
              key={shape.id}
              className={`shape-element ${selectedId === shape.id ? 'selected' : ''} ${connectSource === shape.id ? 'connect-source' : ''}`}
              style={{ left: shape.x, top: shape.y, width: shape.width, height: shape.height }}
              onMouseDown={(event) => handleMouseDown(event, shape)}
              onClick={(event) => handleShapeClick(event, shape)}
            >
              {renderShape(shape)}
              
              {selectedId === shape.id && (
                <>
                  {/* Floating Toolbar */}
                  <div className="shape-floating-toolbar" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <button className="toolbar-tool-btn" onClick={() => handleDuplicateShape(shape.id)} title="Duplicar">
                      <CopyIcon />
                    </button>
                    <button className="toolbar-tool-btn" onClick={() => handleBringToFront(shape.id)} title="Traer al frente">
                      <LayersIcon />
                    </button>
                    <button className="toolbar-tool-btn danger" onClick={() => handleDeleteShape(shape.id)} title="Eliminar">
                      <TrashIcon />
                    </button>
                    <div className="toolbar-divider" />
                    <button className="toolbar-tool-btn" onClick={undo} disabled={historyIndex <= 0} title="Deshacer (Ctrl+Z)">
                      <UndoIcon />
                    </button>
                    <button className="toolbar-tool-btn" onClick={redo} disabled={historyIndex >= history.length - 1} title="Rehacer (Ctrl+Y)">
                      <RedoIcon />
                    </button>
                    <div className="toolbar-divider" />
                    <select
                      className="font-size-select"
                      value={shape.fontSize || 16}
                      onChange={(e) => handleFontSizeChange(e, shape.id)}
                      title="Tamaño de texto"
                    >
                      <option value="12">12px</option>
                      <option value="14">14px</option>
                      <option value="16">16px</option>
                      <option value="20">20px</option>
                      <option value="24">24px</option>
                      <option value="32">32px</option>
                    </select>
                  </div>

                  <div 
                    className="resize-handle" 
                    onMouseDown={(e) => handleResizeMouseDown(e, shape)}
                    title="Redimensionar"
                  />
                </>
              )}
            </div>
          ))}
          </div>{/* end canvas-zoom-layer */}
        </div>{/* end editor-canvas-fs */}
      </div>
    </div>
  );
}
