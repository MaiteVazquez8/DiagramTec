import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import html2canvas from 'html2canvas';

import Icon from '../components/Icon.jsx';
import { palette } from '../components/EditorUI.jsx';
import EditorSidebar from '../components/EditorSidebar';
import EditorToolbar from '../components/EditorToolbar';

import RenderShape from '../components/RenderShape';

// funcion que define las propiedades iniciales de cada figura
const defaultShape = (type, x, y, id) => ({
  id: id || Date.now().toString(),
  type,
  title:
    type === 'start' ? 'inicio' :
    type === 'end' ? 'FINAL' :
    type === 'input' ? 'INPUT' :
    type === 'print' ? 'PRINT' :
    type === 'process' ? 'A = B' :
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


// renderiza una vista previa de la figura para la paleta
function renderPreview(type) {
  if (type === 'connect') {
    return (
      <div className="connect-preview">
        <Icon name="connect" size={40} strokeWidth={3} style={{ color: '#000' }} />
      </div>
    );
  }
  return <RenderShape shape={defaultShape(type, 0, 0, 0)} />;
}

import { jsPDF } from 'jspdf';

// componente principal de la pagina del editor de diagramas
export default function EditorPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // guarda el estado actual en el historial para deshacer o rehacer
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
  const centerView = useCallback(() => {
    if (!canvasWrapperRef.current) return;
    const { clientWidth, clientHeight } = canvasWrapperRef.current;
    
    // Si aun no tiene dimensiones (ej: montando), reintentar en el proximo frame
    if (clientWidth === 0 || clientHeight === 0) {
      setTimeout(centerView, 50);
      return;
    }

    setPan({
      x: clientWidth / 2 - 1000 * zoom,
      y: clientHeight / 2 - 1000 * zoom
    });
  }, [zoom]);

  const zoomReset = () => { 
    setZoom(1); 
    // centerView se ejecutara por el useEffect de zoom o podemos llamarlo aqui con zoom=1
    if (canvasWrapperRef.current) {
      const { clientWidth, clientHeight } = canvasWrapperRef.current;
      setPan({
        x: clientWidth / 2 - 1000,
        y: clientHeight / 2 - 1000
      });
    }
  };

  // Centrar al montar o al cambiar el estado del sidebar o el zoom inicial
  useEffect(() => {
    centerView(); // Intento inmediato
    const t1 = setTimeout(centerView, 100);
    const t2 = setTimeout(centerView, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [centerView, sidebarOpen]);

  const shapesById = useMemo(() => new Map(shapes.map((shape) => [shape.id, shape])), [shapes]);

  // efecto para cargar clases y datos del diseño al iniciar
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
        setHistory([{ shapes: initialShapes, connections: initialConnections }]);
        setHistoryIndex(0);
        setTimeout(centerView, 500);
      }).catch((err) => {
        setError('No se pudo cargar el diseño');
      });
    }
  }, [user, id]);

  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => { setMessage(''); setError(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

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
  
  useEffect(() => {
    const handleKeyDown = (e) => {
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
    const newShape = { ...original, id: Date.now().toString(), x: original.x + 30, y: original.y + 30 };
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

  const handleFontSizeChange = (event, sid) => {
    event.stopPropagation();
    const newSize = parseInt(event.target.value, 10);
    setShapes(prev => prev.map(s => s.id === sid ? { ...s, fontSize: newSize } : s));
  };

  // maneja cuando se suelta una figura en el lienzo
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

  // maneja el final del toque para simular drag and drop en moviles
  const handleTouchEnd = (event, type) => {
    const touch = event.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const canvas = canvasWrapperRef.current;
    
    // verificamos si el punto donde se solto esta dentro del lienzo
    if (canvas && (canvas === target || canvas.contains(target))) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / zoom - 20;
      const y = (touch.clientY - rect.top) / zoom - 20;
      const newShape = defaultShape(type, x, y, nextId);
      const nextShapes = [...shapes, newShape];
      setShapes(nextShapes);
      saveToHistory(nextShapes, connections);
      setNextId((value) => value + 1);
    }
  };

  const handlePaletteClick = (type) => {
    if (type === 'connect') {
      setConnectMode((current) => !current);
      setConnectSource(null);
    }
  };

  // maneja el click en una figura especialmente para conexiones
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
    if (connectMode || event.target.closest('.resize-handle') || event.target.closest('.delete-btn')) return;
    event.stopPropagation();
    setSelectedId(shape.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { ...shape };
    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      setShapes((current) => current.map((item) => item.id === shape.id ? { ...item, x: initial.x + dx, y: initial.y + dy } : item));
    };
    const onMouseUp = () => {
      saveToHistory(shapes, connections);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // maneja el movimiento de figuras mediante touch en moviles
  const handleTouchStartShape = (event, shape) => {
    if (connectMode || event.target.closest('.resize-handle') || event.target.closest('.delete-btn') || event.target.closest('.shape-floating-toolbar')) return;
    
    setSelectedId(shape.id);
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const initial = { ...shape };

    const onTouchMove = (moveEvent) => {
      // prevenimos el scroll de la pagina mientras movemos la figura
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      const dx = (moveTouch.clientX - startX) / zoom;
      const dy = (moveTouch.clientY - startY) / zoom;
      setShapes((current) => current.map((item) => item.id === shape.id ? { ...item, x: initial.x + dx, y: initial.y + dy } : item));
    };

    const onTouchEnd = () => {
      saveToHistory(shapes, connections);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
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
      setShapes((current) => current.map((item) => item.id === shape.id ? { ...item, width: Math.max(80, startWidth + dx), height: Math.max(50, startHeight + dy) } : item));
    };
    const onMouseUp = () => {
      saveToHistory(shapes, connections);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // maneja el redimensionamiento de figuras mediante touch en moviles
  const handleResizeTouchStart = (event, shape) => {
    event.stopPropagation();
    // prevenimos el scroll mientras redimensionamos
    if (event.cancelable) event.preventDefault();
    
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startWidth = shape.width;
    const startHeight = shape.height;

    const onTouchMove = (moveEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      const dx = (moveTouch.clientX - startX) / zoom;
      const dy = (moveTouch.clientY - startY) / zoom;
      setShapes((current) => current.map((item) => item.id === shape.id ? { ...item, width: Math.max(80, startWidth + dx), height: Math.max(50, startHeight + dy) } : item));
    };

    const onTouchEnd = () => {
      saveToHistory(shapes, connections);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  // calcula las coordenadas de las lineas de conexion entre figuras
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
        const r = (rx * ry) / Math.sqrt(Math.pow(ry * Math.cos(angle), 2) + Math.pow(rx * Math.sin(angle), 2));
        return r / dist;
      }
      return Math.min(absDx === 0 ? Infinity : (s.width / 2) / absDx, absDy === 0 ? Infinity : (s.height / 2) / absDy);
    };
    const fromScale = getScale(from);
    const toScale = getScale(to);
    return { x1: x1c + dx * fromScale, y1: y1c + dy * fromScale, x2: x2c - dx * toScale, y2: y2c - dy * toScale };
  };

  const handleClear = () => {
    setShapes([]);
    setConnections([]);
    setSelectedId(null);
    setConnectSource(null);
    centerView();
  };

  // guarda el diagrama actual generando una miniatura y un PDF
  const handleSave = async () => {
    setMessage('');
    setError('');
    if (!user) { setError('Debes ingresar para guardar diseños'); return; }
    
    try {
      // Generar miniatura (preview)
      let imageData = null;
      let pdfData = null;

      if (canvasRef.current) {
        // 1. Generar imagen para previsualización (pequeña)
        const previewCanvas = await html2canvas(canvasRef.current, { 
          backgroundColor: '#ffffff', 
          scale: 0.4,
          logging: false,
          useCORS: true,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('.canvas-zoom-layer');
            if (el) {
              el.style.transform = 'none';
              el.style.width = '1200px';
              el.style.height = '800px';
            }
          }
        });
        imageData = previewCanvas.toDataURL('image/jpeg', 0.5);

        // 2. Generar PDF (Alta calidad)
        const pdfCanvas = await html2canvas(canvasRef.current, { 
          backgroundColor: '#ffffff', 
          scale: 2.0, // Alta resolución para el PDF
          logging: false,
          useCORS: true,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('.canvas-zoom-layer');
            if (el) {
              el.style.transform = 'none';
              el.style.width = '2000px';
              el.style.height = '1500px';
            }
          }
        });
        
        const highResImg = pdfCanvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgProps = pdf.getImageProperties(highResImg);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(highResImg, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdfData = pdf.output('datauristring');
      }

      const data = { 
        title: saveTitle, 
        content: { shapes, connections }, 
        image: imageData,
        pdf_data: pdfData,
        classId: saveClassId || null 
      };

      if (id) { 
        await api.put(`/designs/${id}`, data); 
      } else { 
        const res = await api.post('/designs', data);
        navigate(`/editor/${res.data.design.id}`, { replace: true });
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
    if (e.target.classList.contains('editor-canvas-fs') || e.target.classList.contains('canvas-zoom-layer')) {
      setIsPanning(true);
      const startX = e.clientX - pan.x;
      const startY = e.clientY - pan.y;
      const onMouseMove = (moveEvent) => { setPan({ x: moveEvent.clientX - startX, y: moveEvent.clientY - startY }); };
      const onMouseUp = () => { setIsPanning(false); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  return (
    <div className="editor-fullscreen" id="editor-page">
      <EditorSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleDragStart={handleDragStart}
        handleTouchEnd={handleTouchEnd}
        renderPreview={renderPreview}
        handlePaletteClick={handlePaletteClick}
        connectMode={connectMode}
      />

      <div className="editor-main-fs">
        {/* Notificaciones flotantes */}
        <div className="editor-toast-container">
          {message && <div className="floating-toast success">{message}</div>}
          {error && <div className="floating-toast error">{error}</div>}
        </div>

        <EditorToolbar 
          saveTitle={saveTitle}
          setSaveTitle={setSaveTitle}
          classes={classes}
          saveClassId={saveClassId}
          setSaveClassId={setSaveClassId}
          message={message}
          error={error}
          handleSave={handleSave}
          handleClear={handleClear}
          handleExport={handleExport}
          zoom={zoom}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          zoomReset={zoomReset}
          sidebarOpen={sidebarOpen}
        />

        <div className={`editor-canvas-fs ${connectMode ? 'connect-mode' : ''} ${isPanning ? 'panning' : ''}`} ref={canvasWrapperRef} onDrop={handleDrop} onDragOver={(event) => event.preventDefault()} onClick={() => { setSelectedId(null); setConnectSource(null); }} onMouseDown={handleCanvasMouseDown}>
          <div ref={canvasRef} className="canvas-zoom-layer" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '2000px', height: '2000px', position: 'relative' }}>
            <svg id="connections-layer">
              {connections.map((connection) => {
                const line = getConnectionLine(connection);
                if (!line) return null;
                return <line key={connection.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} className="connection-line" />;
              })}
            </svg>
            {shapes.length === 0 && !connectMode && <div className="canvas-bg"><p className="canvas-hint">Arrastra formas aquí para comenzar a editar</p></div>}

            {shapes.map((shape) => (
              <div 
                key={shape.id} 
                className={`shape-element ${selectedId === shape.id ? 'selected' : ''} ${connectSource === shape.id ? 'connect-source' : ''}`} 
                style={{ left: shape.x, top: shape.y, width: shape.width, height: shape.height }} 
                onMouseDown={(event) => handleMouseDown(event, shape)} 
                onTouchStart={(event) => handleTouchStartShape(event, shape)}
                onClick={(event) => handleShapeClick(event, shape)}
              >
                <RenderShape shape={shape} />
                {selectedId === shape.id && (
                  <>
                    <div className="shape-floating-toolbar" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <button className="toolbar-tool-btn" onClick={() => handleDuplicateShape(shape.id)} title="Duplicar"><Icon name="copy" /></button>
                      <button className="toolbar-tool-btn" onClick={() => handleBringToFront(shape.id)} title="Traer al frente"><Icon name="layers" /></button>
                      <button className="toolbar-tool-btn" onClick={() => handleDeleteShape(shape.id)} title="Eliminar"><Icon name="trash" /></button>
                      <div className="toolbar-divider" />
                      <button className="toolbar-tool-btn" onClick={undo} disabled={historyIndex <= 0} title="Deshacer (Ctrl+Z)"><Icon name="undo" /></button>
                      <button className="toolbar-tool-btn" onClick={redo} disabled={historyIndex >= history.length - 1} title="Rehacer (Ctrl+Y)"><Icon name="redo" /></button>
                      <div className="toolbar-divider" />
                      <select className="font-size-select" value={shape.fontSize || 16} onChange={(e) => handleFontSizeChange(e, shape.id)} title="Tamaño de texto">
                        <option value="12">12px</option><option value="14">14px</option><option value="16">16px</option><option value="20">20px</option><option value="24">24px</option><option value="32">32px</option>
                      </select>
                    </div>
                    <div 
                      className="resize-handle" 
                      onMouseDown={(e) => handleResizeMouseDown(e, shape)} 
                      onTouchStart={(e) => handleResizeTouchStart(e, shape)}
                      title="Redimensionar" 
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
