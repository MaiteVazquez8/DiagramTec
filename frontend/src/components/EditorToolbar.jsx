import Icon from './Icon';

export default function EditorToolbar({
  saveTitle, setSaveTitle,
  classes, saveClassId, setSaveClassId,
  message, error,
  handleSave, handleClear, handleExport, handleExportPDF,
  zoom, zoomIn, zoomOut, zoomReset,
  sidebarOpen, isSaving
}) {
  // componente de la barra de herramientas del editor
  return (
    <div className="editor-toolbar-fs figma-editor-toolbar">
      <div className="toolbar-left-fs">
        <input
          type="text"
          className="toolbar-title-input figma-toolbar-title"
          value={saveTitle}
          onChange={(e) => setSaveTitle(e.target.value)}
          placeholder="Mi diagrama"
          id="editor-title-input"
        />
      </div>

      <div className="toolbar-center-fs">
        <div className="zoom-controls figma-zoom-controls">
          <button type="button" className="zoom-btn" onClick={zoomOut} title="Alejar" id="btn-zoom-out">
            <Icon name="zoomOut" size={16} />
          </button>
          <button type="button" className="zoom-label" onClick={zoomReset} title="Restablecer zoom" id="btn-zoom-reset">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="zoom-btn" onClick={zoomIn} title="Acercar" id="btn-zoom-in">
            <Icon name="zoomIn" size={16} />
          </button>
        </div>
      </div>

      <div className="toolbar-right-fs">
        <div className="toolbar-actions-group figma-toolbar-actions">
          <button type="button" className="btn btn-primary figma-btn-save" onClick={handleSave} disabled={isSaving} id="btn-save">
            <Icon name="save" size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" className="btn btn-secondary figma-btn-outline" onClick={handleClear} id="btn-clear" disabled={isSaving}>
            <Icon name="trash" size={16} /> Limpiar
          </button>
          <button type="button" className="btn btn-secondary figma-btn-outline" onClick={handleExportPDF} id="btn-export-pdf" disabled={isSaving}>
            <Icon name="download" size={16} /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}
