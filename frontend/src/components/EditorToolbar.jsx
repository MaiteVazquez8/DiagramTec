import Icon from './Icon';
import { Link } from 'react-router-dom';

export default function EditorToolbar({
  saveTitle, setSaveTitle,
  classes, saveClassId, setSaveClassId,
  message, error,
  handleSave, handleClear, handleExport,
  zoom, zoomIn, zoomOut, zoomReset,
  sidebarOpen
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
        {classes.length > 0 && (
          <select
            className="toolbar-select"
            value={saveClassId}
            onChange={(e) => setSaveClassId(e.target.value)}
            id="editor-class-select"
            style={{ marginRight: '0.25rem' }}
          >
            <option value="">Guardar en mi perfil</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
        {/* grupo de botones para guardar borrar y exportar */}
        <div className="toolbar-actions-group">
          <button className="btn btn-primary" onClick={handleSave} id="btn-save"><Icon name="save" size={16} /> Guardar</button>
          <button className="btn btn-secondary" onClick={handleClear} id="btn-clear"><Icon name="trash" size={16} /> Limpiar</button>
          <button className="btn btn-secondary" onClick={handleExport} id="btn-export"><Icon name="download" size={16} /> Exportar</button>
        </div>
      </div>
    </div>
  );
}
