import Icon from './Icon';
import { Link } from 'react-router-dom';

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
    <div className="editor-toolbar-fs">
      {/* area izquierda para el titulo del diagrama */}
      <div className="toolbar-left-fs">
        <Link to="/" className="toolbar-back-btn" title="Volver al inicio">
          <Icon name="chevronLeft" />
        </Link>
        <input
          type="text"
          className="toolbar-title-input"
          value={saveTitle}
          onChange={(e) => setSaveTitle(e.target.value)}
          placeholder="Título"
          id="editor-title-input"
        />
        {/* controles para manejar el zoom del lienzo */}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomOut} title="Alejar" id="btn-zoom-out"><Icon name="zoomOut" size={16} /></button>
          <button className="zoom-label" onClick={zoomReset} title="Restablecer zoom" id="btn-zoom-reset">{Math.round(zoom * 100)}%</button>
          <button className="zoom-btn" onClick={zoomIn} title="Acercar" id="btn-zoom-in"><Icon name="zoomIn" size={16} /></button>
        </div>
      </div>
      <div className="toolbar-center-fs">
      </div>
      {/* area derecha para acciones y controles */}
      <div className="toolbar-right-fs">
        {/* grupo de botones para guardar borrar y exportar */}
        <div className="toolbar-actions-group">
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} id="btn-save">
            <Icon name="save" size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn btn-secondary" onClick={handleClear} id="btn-clear" disabled={isSaving}>
            <Icon name="trash" size={16} /> Limpiar
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} id="btn-export-pdf" disabled={isSaving}>
            <Icon name="download" size={16} /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}
