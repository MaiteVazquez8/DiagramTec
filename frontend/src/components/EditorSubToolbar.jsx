/** Subtoolbar: traer al frente, pegar, eliminar forma o conexión seleccionada. */
import Icon from './Icon';

export default function EditorSubToolbar({
  zoom,
  zoomIn,
  zoomOut,
  zoomReset,
  handleClear,
  undo,
  redo,
  canUndo,
  canRedo,
  isSaving,
  onBringToFront,
  onPaste,
  onDelete,
  canBringToFront,
  canPaste,
  canDelete,
}) {
  return (
    <div className="editor-subtoolbar figma-editor-subtoolbar">
      <div className="figma-subtoolbar-group figma-subtoolbar-edit">
        <button
          type="button"
          className="figma-subtool-btn figma-subtool-btn--circle"
          title="Traer al frente"
          onClick={onBringToFront}
          disabled={!canBringToFront || isSaving}
        >
          <Icon name="bringToFront" size={22} />
        </button>
        <button
          type="button"
          className="figma-subtool-btn figma-subtool-btn--circle"
          title="Pegar"
          onClick={onPaste}
          disabled={!canPaste || isSaving}
        >
          <Icon name="paste" size={22} />
        </button>
        <button
          type="button"
          className="figma-subtool-btn figma-subtool-btn--circle"
          title="Eliminar"
          onClick={onDelete}
          disabled={!canDelete || isSaving}
        >
          <Icon name="delete" size={22} />
        </button>
        <button
          type="button"
          className="figma-subtool-btn figma-subtool-btn--circle"
          title="Deshacer"
          onClick={undo}
          disabled={!canUndo || isSaving}
        >
          <Icon name="undo" size={22} />
        </button>
        <button
          type="button"
          className="figma-subtool-btn figma-subtool-btn--circle"
          title="Rehacer"
          onClick={redo}
          disabled={!canRedo || isSaving}
        >
          <Icon name="redo" size={22} />
        </button>
      </div>

      <div className="figma-zoom-group" role="group" aria-label="Zoom">
        <button type="button" className="figma-zoom-group-btn" onClick={zoomIn} title="Acercar" id="btn-sub-zoom-in">
          <Icon name="plus" size={20} />
        </button>
        <button type="button" className="figma-zoom-group-label" onClick={zoomReset} id="btn-sub-zoom-reset">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="figma-zoom-group-btn" onClick={zoomOut} title="Alejar" id="btn-sub-zoom-out">
          <Icon name="minus" size={20} />
        </button>
      </div>

      <div className="figma-subtoolbar-group figma-subtoolbar-actions">
        <button
          type="button"
          className="figma-clear-canvas-btn"
          onClick={handleClear}
          disabled={isSaving}
          id="btn-clear-canvas"
        >
          <Icon name="trash" size={22} />
          Limpiar Lienzo
        </button>
      </div>
    </div>
  );
}
