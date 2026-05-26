/**
 * Editor de diagramas de flujo (rutas /editor y /editor/:id).
 * Gestiona formas, conexiones, zoom/pan, historial, guardado y exportación PDF/PNG.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';
import html2canvas from 'html2canvas';

import Icon from '../components/Icon.jsx';
import EditorSidebar from '../components/EditorSidebar';
import EditorToolbar from '../components/EditorToolbar';
import EditorSubToolbar from '../components/EditorSubToolbar';
import RenderShape from '../components/RenderShape';

import {
  CANVAS_SIZE,
  DROP_OFFSET,
  SHAPE_SIZE_LIMITS,
  SHAPE_TYPES,
  PALETTE_DRAG_TYPE_KEY,
  createShape,
  duplicateShape,
  bringShapeToFront,
  shapesToMap,
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
  removeConnection,
  getConnectionLineFromMap,
  screenToCanvas,
  computeCenterPan,
  computePanForZoomChange,
  clientDeltaToCanvas,
  stepZoomIn,
  stepZoomOut,
  captureDiagramPreview,
  captureDiagramHighRes,
  canvasToPngDataUrl,
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
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
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
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [clipboardShape, setClipboardShape] = useState(null);

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
    setPan(computeCenterPan(clientWidth, clientHeight, zoomRef.current));
  }, []);

  const applyZoom = useCallback((getNextZoom, focalX, focalY) => {
    setZoom((currentZoom) => {
      const nextZoom = getNextZoom(currentZoom);
      setPan((currentPan) =>
        computePanForZoomChange(currentPan, currentZoom, nextZoom, focalX, focalY)
      );
      return nextZoom;
    });
  }, []);

  const getZoomFocalPoint = () => {
    if (!canvasWrapperRef.current) return { x: 0, y: 0 };
    const { clientWidth, clientHeight } = canvasWrapperRef.current;
    return { x: clientWidth / 2, y: clientHeight / 2 };
  };

  const zoomIn = () => {
    const { x, y } = getZoomFocalPoint();
    applyZoom(stepZoomIn, x, y);
  };

  const zoomOut = () => {
    const { x, y } = getZoomFocalPoint();
    applyZoom(stepZoomOut, x, y);
  };

  const zoomReset = () => {
    if (!canvasWrapperRef.current) {
      setZoom(1);
      return;
    }
    const { clientWidth, clientHeight } = canvasWrapperRef.current;
    setZoom(1);
    setPan(computeCenterPan(clientWidth, clientHeight, 1));
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
        const rect = wrapper.getBoundingClientRect();
        const focalX = e.clientX - rect.left;
        const focalY = e.clientY - rect.top;
        const step = e.deltaY < 0 ? stepZoomIn : stepZoomOut;
        setZoom((z) => {
          const next = step(z);
          setPan((p) => computePanForZoomChange(p, z, next, focalX, focalY));
          return next;
        });
        return;
      }
      e.preventDefault();
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedConnectionId) {
          handleDeleteConnection(selectedConnectionId);
        } else if (selectedId) {
          handleDeleteShape(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedConnectionId, historyStack, shapes, connections]);

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
    setNextId((v) => Math.max(v, newShape.id + 1));
  };

  const handleCopySelected = () => {
    if (!selectedId) return;
    const original = shapesById.get(selectedId);
    if (original) setClipboardShape({ ...original });
  };

  const handlePasteClipboard = () => {
    if (!clipboardShape) return;
    const newShape = duplicateShape(clipboardShape, { x: 24, y: 24 }, nextId);
    const nextShapes = [...shapes, newShape];
    setShapes(nextShapes);
    commitHistory(nextShapes, connections);
    setSelectedId(newShape.id);
    setNextId((v) => Math.max(v, newShape.id + 1));
  };

  const handleDeleteConnection = (connectionId) => {
    const nextConnections = removeConnection(connections, connectionId);
    setConnections(nextConnections);
    commitHistory(shapes, nextConnections);
    if (selectedConnectionId === connectionId) setSelectedConnectionId(null);
  };

  const handleDeleteSelected = () => {
    if (selectedConnectionId) {
      handleDeleteConnection(selectedConnectionId);
    } else if (selectedId) {
      handleDeleteShape(selectedId);
    }
  };

  const selectConnection = (event, connectionId) => {
    if (connectMode) return;
    event.stopPropagation();
    setSelectedConnectionId(connectionId);
    setSelectedId(null);
    setConnectSource(null);
  };

  const handleBringToFront = (shapeId) => {
    const nextShapes = bringShapeToFront(shapes, shapeId);
    if (nextShapes === shapes) return;
    setShapes(nextShapes);
    commitHistory(nextShapes, connections);
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
    setSelectedConnectionId(null);
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
    if (connectMode || event.target.closest('.resize-handle')) return;
    if (event.target.closest('.editable-text')) return;
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    setSelectedId(shape.id);
    setSelectedConnectionId(null);
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
        imageData = canvasToPngDataUrl(previewCanvas);
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
      setMessage('Diseño guardado');
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

  const shouldClearCanvasSelection = (target) => {
    if (!(target instanceof Element)) return false;
    if (target.closest('.shape-element')) return false;
    if (target.closest('.connection-group')) return false;
    return true;
  };

  const handleCanvasMouseDown = (e) => {
    if (!isCanvasBackgroundTarget(e.target)) return;
    setSelectedId(null);
    setSelectedConnectionId(null);
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
    setSelectedConnectionId(null);
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

      <div className="editor-main-fs figma-editor-main">
        <div className="editor-toast-container">
          {message && <div className="floating-toast success">{message}</div>}
          {error && <div className="floating-toast error">{error}</div>}
        </div>

        <div className="figma-editor-panel">
          <div className="figma-editor-panel-head">
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
              isSaving={isSaving}
              isGuest={!user}
            />
          </div>

          <EditorSubToolbar
            zoom={zoom}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            zoomReset={zoomReset}
            handleClear={handleClear}
            undo={undo}
            redo={redo}
            canUndo={canUndo(historyStack)}
            canRedo={canRedo(historyStack)}
            isSaving={isSaving}
            onBringToFront={() => {
              if (!selectedId) return;
              handleBringToFront(selectedId);
            }}
            onPaste={handlePasteClipboard}
            onDelete={handleDeleteSelected}
            canBringToFront={!!selectedId}
            canPaste={!!clipboardShape}
            canDelete={!!selectedId || !!selectedConnectionId}
          />

          <div className="figma-editor-canvas-area">
        <div
          className={`editor-canvas-fs figma-canvas-panel ${connectMode ? 'connect-mode' : ''} ${isPanning ? 'panning' : ''}`}
          ref={canvasWrapperRef}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          onClick={(event) => {
            if (!shouldClearCanvasSelection(event.target)) return;
            setSelectedId(null);
            setSelectedConnectionId(null);
            setConnectSource(null);
          }}
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
            <svg id="connections-layer" aria-hidden="true">
              {connections.map((connection) => {
                const line = getConnectionLineFromMap(connection, shapesById);
                if (!line) return null;
                const isSelected = selectedConnectionId === connection.id;
                return (
                  <g
                    key={connection.id}
                    className={`connection-group${isSelected ? ' selected' : ''}`}
                    onClick={(event) => selectConnection(event, connection.id)}
                    onMouseDown={(event) => selectConnection(event, connection.id)}
                    onTouchStart={(event) => selectConnection(event, connection.id)}
                  >
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      className="connection-line-hit"
                    />
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      className="connection-line"
                    />
                  </g>
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
                  <div
                    className="resize-handle"
                    onMouseDown={(e) => handleResizeMouseDown(e, shape)}
                    onTouchStart={(e) => handleResizeTouchStart(e, shape)}
                    title="Redimensionar"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
