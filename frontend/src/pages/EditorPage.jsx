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
import { useToast } from '../ToastContext.jsx';
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
  const { showError, showMessage } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Estado del diagrama y UI del editor ──
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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [historyStack, setHistoryStack] = useState({ entries: [], index: -1 });
  const [isSaving, setIsSaving] = useState(false);
  const [paletteTouchDrag, setPaletteTouchDrag] = useState(null);
  const [paletteDragOverCanvas, setPaletteDragOverCanvas] = useState(false);

  // ── Referencias al DOM y sesiones de arrastre ──
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const paletteDragSessionRef = useRef(null);
  const shapeConnectHandledByTouchRef = useRef(false);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const [clipboardShape, setClipboardShape] = useState(null);

  // ── Estado derivado y mapa de formas por id ──
  const diagramState = useMemo(
    () => ({ shapes, connections }),
    [shapes, connections]
  );

  const shapesById = useMemo(() => shapesToMap(shapes), [shapes]);

  const historyIndex = historyStack.index;

  // ── Historial (deshacer / rehacer) ──
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

  // ── Zoom, pan y centrado del canvas ──
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

  // ── Efectos: centrado inicial, carga de diseño y clases ──
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
    // Invitado intentando abrir diseño guardado → redirige al editor vacío
    if (!user && id) {
      showError('Inicia sesión para abrir diseños guardados');
      navigate('/editor', { replace: true });
      return;
    }
    // Modo invitado sin id: diagrama vacío
    if (!user && !id) {
      const empty = emptyDiagramState();
      setHistoryStack(initHistoryWithState(empty));
      return;
    }
    // Usuario autenticado: clases disponibles para asociar al guardar
    if (user) {
      api.get('/classes/available').then((r) => setClasses(r.data.classes)).catch(() => setClasses([]));
    }
    // Carga diseño existente por id desde el API
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
      }).catch(() => {});
    }
  }, [user, id, centerView, navigate]);

  // Zoom con rueda (Ctrl) y desplazamiento con scroll
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

  // Atajos de teclado: Ctrl+Z/Y, Delete/Backspace
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

  // ── Operaciones sobre formas y conexiones ──
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

  // ── Colocar formas desde paleta (drop o tap) ──
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

  const PALETTE_DRAG_THRESHOLD = 6;

  // ── Arrastre táctil/ratón desde la paleta lateral ──
  const endPaletteDragSession = useCallback(() => {
    const session = paletteDragSessionRef.current;
    if (!session) return;
    window.removeEventListener('touchmove', session.onMove);
    window.removeEventListener('touchend', session.onEnd);
    window.removeEventListener('touchcancel', session.onEnd);
    window.removeEventListener('mousemove', session.onMove);
    window.removeEventListener('mouseup', session.onEnd);
    paletteDragSessionRef.current = null;
    setPaletteTouchDrag(null);
    setPaletteDragOverCanvas(false);
  }, []);

  useEffect(() => () => endPaletteDragSession(), [endPaletteDragSession]);

  const handlePaletteDragStart = (event, type, onPlaced) => {
    if (type === SHAPE_TYPES.CONNECT) return;

    const isTouch = event.type === 'touchstart';
    const startPoint = isTouch ? event.touches?.[0] : event;
    if (!startPoint) return;

    if (!isTouch && event.button !== 0) return;

    event.stopPropagation();
    if (!isTouch) event.preventDefault();

    endPaletteDragSession();

    const startX = startPoint.clientX;
    const startY = startPoint.clientY;
    let dragging = false;

    const isOverCanvas = (clientX, clientY) => {
      const canvas = canvasWrapperRef.current;
      if (!canvas) return false;
      const target = document.elementFromPoint(clientX, clientY);
      return target && (canvas === target || canvas.contains(target));
    };

    const onMove = (moveEvent) => {
      if (!paletteDragSessionRef.current) return;

      const point = isTouch
        ? moveEvent.touches[0]
        : moveEvent;
      if (!point) return;

      if (isTouch && moveEvent.cancelable) moveEvent.preventDefault();

      const dx = point.clientX - startX;
      const dy = point.clientY - startY;

      if (!dragging) {
        if (Math.hypot(dx, dy) < PALETTE_DRAG_THRESHOLD) return;
        dragging = true;
      }

      setPaletteTouchDrag({ type, x: point.clientX, y: point.clientY });
      setPaletteDragOverCanvas(isOverCanvas(point.clientX, point.clientY));
    };

    const onEnd = (endEvent) => {
      const placedType = paletteDragSessionRef.current?.type;
      const wasDragging = dragging;
      endPaletteDragSession();

      if (!wasDragging || !placedType) return;

      const endPoint = isTouch ? endEvent.changedTouches[0] : endEvent;
      if (!endPoint) return;

      if (isOverCanvas(endPoint.clientX, endPoint.clientY)) {
        placeShapeAt(placedType, endPoint.clientX, endPoint.clientY);
        onPlaced?.();
      }
    };

    paletteDragSessionRef.current = { type, onMove, onEnd };
    if (isTouch) {
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    } else {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
    }
  };

  const handlePaletteTapPlace = (type) => {
    placeShapeAt(type, window.innerWidth / 2, window.innerHeight / 2);
  };

  const handlePaletteClick = (type) => {
    if (type === SHAPE_TYPES.CONNECT) {
      setConnectMode((c) => !c);
      setConnectSource(null);
    }
  };

  // ── Modo conectar: enlazar formas con flechas ──
  const handleShapeConnect = (event, shape) => {
    if (!connectMode) return;
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    const result = handleConnectClick(connections, connectSource, shape.id);
    setConnections(result.connections);
    setConnectSource(result.connectSource);
    if (result.message) showMessage(result.message);
    if (result.created || result.removed) {
      commitHistory(shapes, result.connections);
    }
  };

  const handleShapeClick = (event, shape) => {
    if (!connectMode) return;
    if (shapeConnectHandledByTouchRef.current) {
      shapeConnectHandledByTouchRef.current = false;
      return;
    }
    handleShapeConnect(event, shape);
  };

  const handleShapeTouchStart = (event, shape) => {
    if (connectMode) {
      event.stopPropagation();
      return;
    }
    handleTouchStartShape(event, shape);
  };

  const handleShapeTouchEndConnect = (event, shape) => {
    if (!connectMode) return;
    if (event.target.closest('.resize-handle')) return;
    shapeConnectHandledByTouchRef.current = true;
    handleShapeConnect(event, shape);
  };

  // ── Interacción: mover formas (mouse y touch) ──
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

  // ── Redimensionar formas seleccionadas ──
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

  // Vacía el lienzo y recentra la vista
  const handleClear = () => {
    const empty = emptyDiagramState();
    setShapes(empty.shapes);
    setConnections(empty.connections);
    setSelectedId(null);
    setConnectSource(null);
    centerView();
  };

  // ── Guardar diseño en la nube (POST o PUT) con preview PNG/PDF ──
  const handleSave = async () => {
    if (isSaving) return;
    if (!user) {
      showError('Inicia sesión para guardar tus diseños en la nube');
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
        pdfDataString = await buildInlinePdfDataUrl(previewCanvas, bounds.width, bounds.height);
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
      showMessage('Diseño guardado');
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Exportación: PDF de alta resolución ──
  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    showMessage('Generando PDF...');
    try {
      const pdfCanvas = await captureDiagramHighRes(canvasRef.current, shapes);
      const pdfData = await downloadDiagramPdf(pdfCanvas, shapes, saveTitle || 'diagrama');
      showMessage('PDF descargado');

      if (id && pdfData) {
        try {
          await api.put(`/designs/${id}`, { pdf_data: pdfData });
        } catch (syncErr) {
          console.warn('PDF descargado; falló guardar copia en servidor:', syncErr);
          showMessage('PDF descargado (no se guardó la copia en la nube)');
        }
      }
    } catch (err) {
      console.error('Error PDF:', err);
      showError('Error al generar el PDF');
    }
  };

  // ── Exportación: PNG vía html2canvas ──
  const handleExport = () => {
    if (!canvasRef.current) return;
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

  // ── Pan del canvas y deselección al clic en fondo ──
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
    if (connectMode) return;
    if (e.touches.length !== 1) return;
    if (!isCanvasBackgroundTarget(e.target)) return;
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

  // ── JSX: layout del editor (sidebar, toolbars, canvas) ──
  return (
    <div
      className={`editor-fullscreen figma-editor${paletteTouchDrag ? ' is-palette-dragging' : ''}`}
      id="editor-page"
    >
      {/* Paleta lateral de formas */}
      <EditorSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onPaletteDragStart={handlePaletteDragStart}
        onPaletteTapPlace={handlePaletteTapPlace}
        renderPreview={(type) => <ShapePreview type={type} />}
        handlePaletteClick={handlePaletteClick}
        connectMode={connectMode}
      />

      <div className="editor-main-fs figma-editor-main">
        <div className="figma-editor-panel">
          {/* Barra superior: título, guardar, exportar */}
          <div className="figma-editor-panel-head">
            <EditorToolbar
              saveTitle={saveTitle}
              setSaveTitle={setSaveTitle}
              classes={classes}
              saveClassId={saveClassId}
              setSaveClassId={setSaveClassId}
              handleSave={handleSave}
              handleClear={handleClear}
              handleExport={handleExport}
              handleExportPDF={handleExportPDF}
              isSaving={isSaving}
              isGuest={!user}
            />
          </div>

          {/* Sub-barra: zoom, undo/redo, acciones sobre selección */}
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

          {/* Área del canvas con capas SVG (conexiones) y formas HTML */}
          <div className="figma-editor-canvas-area">
        <div
          className={`editor-canvas-fs figma-canvas-panel ${connectMode ? 'connect-mode' : ''} ${isPanning ? 'panning' : ''} ${paletteTouchDrag ? 'palette-touch-active' : ''} ${paletteDragOverCanvas ? 'palette-drop-target' : ''}`}
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
            {/* Capa SVG de flechas entre formas */}
            <svg
              id="connections-layer"
              className="connection-layer"
              width={CANVAS_SIZE.width}
              height={CANVAS_SIZE.height}
              viewBox={`0 0 ${CANVAS_SIZE.width} ${CANVAS_SIZE.height}`}
              aria-hidden="true"
            >
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
                onTouchStart={(event) => handleShapeTouchStart(event, shape)}
                onTouchEnd={(event) => handleShapeTouchEndConnect(event, shape)}
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

      {/* Fantasma visual al arrastrar forma desde paleta en touch */}
      {paletteTouchDrag && (
        <div
          className="palette-touch-drag-ghost"
          style={{
            left: paletteTouchDrag.x,
            top: paletteTouchDrag.y,
          }}
          aria-hidden
        >
          <div className="palette-touch-drag-ghost-inner">
            <ShapePreview type={paletteTouchDrag.type} />
          </div>
        </div>
      )}
    </div>
  );
}
