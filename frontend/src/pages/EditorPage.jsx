import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import html2canvas from 'html2canvas';

import Icon from '../components/Icon.jsx';
import EditorSidebar from '../components/EditorSidebar';
import EditorToolbar from '../components/EditorToolbar';
import RenderShape from '../components/RenderShape';

import {
  CANVAS_SIZE,
  DROP_OFFSET,
  SHAPE_SIZE_LIMITS,
  SHAPE_TYPES,
  PALETTE_DRAG_TYPE_KEY,
  createShape,
  duplicateShape,
  shapesToMap,
  setShapeFontSize,
  bringShapeToFront,
  parseDiagramContent,
  serializeDiagram,
  emptyDiagramState,
  nextShapeIdFromList,
  initHistoryWithState,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  deleteShapeFromDiagram,
  addShapeToDiagram,
  handleConnectClick,
  getConnectionLineFromMap,
  screenToCanvas,
  computeCenterPan,
  clientDeltaToCanvas,
  stepZoomIn,
  stepZoomOut,
  captureDiagramPreview,
  captureDiagramHighRes,
  canvasToJpegDataUrl,
  buildInlinePdfDataUrl,
  downloadDiagramPdf,
  getDiagramBounds,
  ShapePreview,
} from '../design';

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
  const [historyStack, setHistoryStack] = useState({ entries: [], index: -1 });
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  const diagramState = useMemo(
    () => ({ shapes, connections }),
    [shapes, connections]
  );

  const shapesById = useMemo(() => shapesToMap(shapes), [shapes]);

  const historyIndex = historyStack.index;

  const commitHistory = useCallback((newShapes, newConnections) => {
    const next = pushHistory(
      historyStack,
      { shapes: newShapes, connections: newConnections }
    );
    setHistoryStack(next);
  }, [historyStack]);

  const applyDiagram = useCallback((state) => {
    setShapes(state.shapes);
    setConnections(state.connections);
  }, []);

  const undo = () => {
    const { stack, state } = undoHistory(historyStack);
    if (!state) return;
    setHistoryStack(stack);
    applyDiagram(state);
  };

  const redo = () => {
    const { stack, state } = redoHistory(historyStack);
    if (!state) return;
    setHistoryStack(stack);
    applyDiagram(state);
  };

  const centerView = useCallback(() => {
    if (!canvasWrapperRef.current) return;
    const { clientWidth, clientHeight } = canvasWrapperRef.current;
    if (clientWidth === 0 || clientHeight === 0) {
      setTimeout(centerView, 50);
      return;
    }
    setPan(computeCenterPan(clientWidth, clientHeight, zoom));
  }, [zoom]);

  const zoomIn = () => setZoom(stepZoomIn);
  const zoomOut = () => setZoom(stepZoomOut);

  const zoomReset = () => {
    setZoom(1);
    if (canvasWrapperRef.current) {
      const { clientWidth, clientHeight } = canvasWrapperRef.current;
      setPan(computeCenterPan(clientWidth, clientHeight, 1));
    }
  };

  useEffect(() => {
    centerView();
    const t1 = setTimeout(centerView, 100);
    const t2 = setTimeout(centerView, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [centerView, sidebarOpen]);

  useEffect(() => {
    if (!user && id) {
      setError('Inicia sesión para abrir diseños guardados');
      navigate('/editor', { replace: true });
      return;
    }
    if (!user && !id) {
      const empty = emptyDiagramState();
      setHistoryStack(initHistoryWithState(empty));
      return;
    }
    if (user) {
      api.get('/classes/available').then((r) => setClasses(r.data.classes)).catch(() => setClasses([]));
    }
    if (user && id) {
      api.get(`/designs/${id}`).then((response) => {
        const design = response.data.design;
        setSaveTitle(design.title);
        const content = parseDiagramContent(design.content);
        setShapes(content.shapes);
        setConnections(content.connections);
        setNextId(nextShapeIdFromList(content.shapes));
        setHistoryStack(initHistoryWithState(content));
        setTimeout(centerView, 500);
      }).catch(() => setError('No se pudo cargar el diseño'));
    }
  }, [user, id, centerView, navigate]);

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
        setZoom((z) => (e.deltaY < 0 ? stepZoomIn(z) : stepZoomOut(z)));
      }
    };
    wrapper.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.contentEditable === 'true') return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        handleDeleteShape(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyStack, shapes, connections]);

  const handleDeleteShape = (shapeId) => {
    const next = deleteShapeFromDiagram(diagramState, shapeId);
    setShapes(next.shapes);
    setConnections(next.connections);
    commitHistory(next.shapes, next.connections);
    if (selectedId === shapeId) setSelectedId(null);
  };

  const handleDuplicateShape = (shapeId) => {
    const original = shapesById.get(shapeId);
    if (!original) return;
    const newShape = duplicateShape(original);
    const nextShapes = [...shapes, newShape];
    setShapes(nextShapes);
    commitHistory(nextShapes, connections);
    setSelectedId(newShape.id);
  };

  const handleBringToFront = (shapeId) => {
    const nextShapes = bringShapeToFront(shapes, shapeId);
    setShapes(nextShapes);
    commitHistory(nextShapes, connections);
  };

  const handleFontSizeChange = (event, shapeId) => {
    event.stopPropagation();
    const newSize = parseInt(event.target.value, 10);
    setShapes(setShapeFontSize(shapes, shapeId, newSize));
  };

  const placeShapeAt = (type, clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const { x, y } = screenToCanvas(clientX, clientY, rect, zoom, DROP_OFFSET);
    const newShape = createShape(type, x, y, nextId);
    const next = addShapeToDiagram(diagramState, newShape);
    setShapes(next.shapes);
    commitHistory(next.shapes, next.connections);
    setNextId((v) => v + 1);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData(PALETTE_DRAG_TYPE_KEY);
    if (!type || type === SHAPE_TYPES.CONNECT) return;
    placeShapeAt(type, event.clientX, event.clientY);
  };

  const handleDragStart = (event, type) => {
    event.dataTransfer.setData(PALETTE_DRAG_TYPE_KEY, type);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleTouchEnd = (event, type) => {
    const touch = event.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const canvas = canvasWrapperRef.current;
    if (canvas && (canvas === target || canvas.contains(target))) {
      placeShapeAt(type, touch.clientX, touch.clientY);
    }
  };

  const handlePaletteClick = (type) => {
    if (type === SHAPE_TYPES.CONNECT) {
      setConnectMode((c) => !c);
      setConnectSource(null);
    }
  };

  const handleShapeClick = (event, shape) => {
    if (!connectMode) return;
    event.stopPropagation();
    event.preventDefault();
    const result = handleConnectClick(connections, connectSource, shape.id);
    setConnections(result.connections);
    setConnectSource(result.connectSource);
    if (result.connections.length !== connections.length) {
      commitHistory(shapes, result.connections);
    }
  };

  const handleMouseDown = (event, shape) => {
    if (connectMode || event.target.closest('.resize-handle')) return;
    event.stopPropagation();
    setSelectedId(shape.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { ...shape };

    const onMouseMove = (moveEvent) => {
      const dx = clientDeltaToCanvas(moveEvent.clientX - startX, zoom);
      const dy = clientDeltaToCanvas(moveEvent.clientY - startY, zoom);
      setShapes((current) =>
        current.map((item) =>
          item.id === shape.id
            ? { ...item, x: initial.x + dx, y: initial.y + dy }
            : item
        )
      );
    };
    const onMouseUp = () => {
      commitHistory(shapes, connections);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStartShape = (event, shape) => {
    if (connectMode || event.target.closest('.resize-handle') || event.target.closest('.shape-floating-toolbar')) return;
    if (event.target.closest('.editable-text')) return;
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    setSelectedId(shape.id);
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const initial = { ...shape };

    const onTouchMove = (moveEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      const dx = clientDeltaToCanvas(moveTouch.clientX - startX, zoom);
      const dy = clientDeltaToCanvas(moveTouch.clientY - startY, zoom);
      setShapes((current) =>
        current.map((item) =>
          item.id === shape.id ? { ...item, x: initial.x + dx, y: initial.y + dy } : item
        )
      );
    };
    const cleanup = () => {
      commitHistory(shapes, connections);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', cleanup);
      window.removeEventListener('touchcancel', cleanup);
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', cleanup);
    window.addEventListener('touchcancel', cleanup);
  };

  const handleResizeMouseDown = (event, shape) => {
    event.stopPropagation();
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = shape.width;
    const startHeight = shape.height;

    const onMouseMove = (moveEvent) => {
      const dx = clientDeltaToCanvas(moveEvent.clientX - startX, zoom);
      const dy = clientDeltaToCanvas(moveEvent.clientY - startY, zoom);
      setShapes((current) =>
        current.map((item) =>
          item.id === shape.id
            ? {
                ...item,
                width: Math.max(SHAPE_SIZE_LIMITS.minWidth, startWidth + dx),
                height: Math.max(SHAPE_SIZE_LIMITS.minHeight, startHeight + dy),
              }
            : item
        )
      );
    };
    const onMouseUp = () => {
      commitHistory(shapes, connections);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeTouchStart = (event, shape) => {
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startWidth = shape.width;
    const startHeight = shape.height;

    const onTouchMove = (moveEvent) => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      const dx = clientDeltaToCanvas(moveTouch.clientX - startX, zoom);
      const dy = clientDeltaToCanvas(moveTouch.clientY - startY, zoom);
      setShapes((current) =>
        current.map((item) =>
          item.id === shape.id
            ? {
                ...item,
                width: Math.max(SHAPE_SIZE_LIMITS.minWidth, startWidth + dx),
                height: Math.max(SHAPE_SIZE_LIMITS.minHeight, startHeight + dy),
              }
            : item
        )
      );
    };
    const onTouchEnd = () => {
      commitHistory(shapes, connections);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  const handleClear = () => {
    const empty = emptyDiagramState();
    setShapes(empty.shapes);
    setConnections(empty.connections);
    setSelectedId(null);
    setConnectSource(null);
    centerView();
  };

  const handleSave = async () => {
    if (isSaving) return;
    setMessage('');
    setError('');
    if (!user) {
      setError('Inicia sesión para guardar tus diseños en la nube');
      return;
    }

    setIsSaving(true);
    try {
      let imageData = null;
      let pdfDataString = null;

      if (canvasRef.current) {
        const bounds = getDiagramBounds(shapes);
        const previewCanvas = await captureDiagramPreview(canvasRef.current, shapes);
        imageData = canvasToJpegDataUrl(previewCanvas);
        pdfDataString = buildInlinePdfDataUrl(previewCanvas, bounds.width, bounds.height);
      }

      const data = {
        title: saveTitle,
        content: serializeDiagram(diagramState),
        image: imageData,
        pdf_data: pdfDataString,
        classId: saveClassId || null,
      };

      if (id) {
        await api.put(`/designs/${id}`, data);
      } else {
        const res = await api.post('/designs', data);
        navigate(`/editor/${res.data.design.id}`, { replace: true });
      }
      setMessage('Diseño guardado (con PDF generado)');
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.response?.data?.error || 'No se pudo guardar el diseño');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    setError('');
    setMessage('Generando PDF...');
    try {
      const pdfCanvas = await captureDiagramHighRes(canvasRef.current, shapes);
      const pdfData = downloadDiagramPdf(pdfCanvas, shapes, saveTitle || 'diagrama');
      setMessage('PDF descargado');

      if (id && pdfData) {
        try {
          await api.put(`/designs/${id}`, { pdf_data: pdfData });
        } catch (syncErr) {
          console.warn('PDF descargado; falló guardar copia en servidor:', syncErr);
          setMessage('PDF descargado (no se guardó la copia en la nube)');
        }
      }
    } catch (err) {
      console.error('Error PDF:', err);
      setMessage('');
      setError('Error al generar el PDF');
    }
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    setMessage('');
    html2canvas(canvasRef.current, { backgroundColor: '#ffffff', scale: 2 }).then((canvas) => {
      const link = document.createElement('a');
      link.download = 'diagrama-dfd.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const isCanvasBackgroundTarget = (target) =>
    target.classList.contains('editor-canvas-fs')
    || target.classList.contains('canvas-zoom-layer')
    || target.classList.contains('canvas-bg')
    || target.classList.contains('canvas-hint');

  const handleCanvasMouseDown = (e) => {
    if (!isCanvasBackgroundTarget(e.target)) return;
    setSelectedId(null);
    setConnectSource(null);
    setIsPanning(true);
    const startX = e.clientX - pan.x;
    const startY = e.clientY - pan.y;
    const onMouseMove = (moveEvent) => {
      setPan({ x: moveEvent.clientX - startX, y: moveEvent.clientY - startY });
    };
    const onMouseUp = () => {
      setIsPanning(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleCanvasTouchStart = (e) => {
    if (connectMode || e.touches.length !== 1) return;
    if (!isCanvasBackgroundTarget(e.target)) return;
    if (e.cancelable) e.preventDefault();
    setSelectedId(null);
    setConnectSource(null);
    setIsPanning(true);
    const touch = e.touches[0];
    const startX = touch.clientX - pan.x;
    const startY = touch.clientY - pan.y;
    const onTouchMove = (moveEvent) => {
      if (moveEvent.touches.length !== 1) return;
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      setPan({ x: moveTouch.clientX - startX, y: moveTouch.clientY - startY });
    };
    const cleanup = () => {
      setIsPanning(false);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', cleanup);
      window.removeEventListener('touchcancel', cleanup);
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', cleanup);
    window.addEventListener('touchcancel', cleanup);
  };

  return (
    <div className="editor-fullscreen figma-editor" id="editor-page">
      <EditorSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleDragStart={handleDragStart}
        handleTouchEnd={handleTouchEnd}
        renderPreview={(type) => <ShapePreview type={type} />}
        handlePaletteClick={handlePaletteClick}
        connectMode={connectMode}
      />

      <div className="editor-main-fs">
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
          handleExportPDF={handleExportPDF}
          zoom={zoom}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          zoomReset={zoomReset}
          sidebarOpen={sidebarOpen}
          isSaving={isSaving}
          isGuest={!user}
        />

        <div
          className={`editor-canvas-fs ${connectMode ? 'connect-mode' : ''} ${isPanning ? 'panning' : ''}`}
          ref={canvasWrapperRef}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          onClick={() => { setSelectedId(null); setConnectSource(null); }}
          onMouseDown={handleCanvasMouseDown}
          onTouchStart={handleCanvasTouchStart}
        >
          <div
            ref={canvasRef}
            className="canvas-zoom-layer"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: `${CANVAS_SIZE.width}px`,
              height: `${CANVAS_SIZE.height}px`,
              position: 'relative',
            }}
          >
            <svg id="connections-layer">
              {connections.map((connection) => {
                const line = getConnectionLineFromMap(connection, shapesById);
                if (!line) return null;
                return (
                  <line
                    key={connection.id}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    className="connection-line"
                  />
                );
              })}
            </svg>
            {shapes.length === 0 && !connectMode && (
              <div className="canvas-bg">
                <p className="canvas-hint">Arrastra formas aquí para comenzar a editar</p>
              </div>
            )}

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
                    <div
                      className="shape-floating-toolbar"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button type="button" className="toolbar-tool-btn" onClick={() => handleDuplicateShape(shape.id)} title="Duplicar"><Icon name="copy" /></button>
                      <button type="button" className="toolbar-tool-btn" onClick={() => handleBringToFront(shape.id)} title="Traer al frente"><Icon name="layers" /></button>
                      <button type="button" className="toolbar-tool-btn" onClick={() => handleDeleteShape(shape.id)} title="Eliminar"><Icon name="trash" /></button>
                      <div className="toolbar-divider" />
                      <button type="button" className="toolbar-tool-btn" onClick={undo} disabled={!canUndo(historyStack)} title="Deshacer (Ctrl+Z)"><Icon name="undo" /></button>
                      <button type="button" className="toolbar-tool-btn" onClick={redo} disabled={!canRedo(historyStack)} title="Rehacer (Ctrl+Y)"><Icon name="redo" /></button>
                      <div className="toolbar-divider" />
                      <select className="font-size-select" value={shape.fontSize || 16} onChange={(e) => handleFontSizeChange(e, shape.id)} title="Tamaño de texto">
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
