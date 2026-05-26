/** Barra superior del editor: título, guardar, exportar PDF, zoom. */
import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function EditorToolbar({
  saveTitle, setSaveTitle,
  classes, saveClassId, setSaveClassId,
  message, error,
  handleSave, handleClear, handleExport, handleExportPDF,
  isSaving,
  isGuest = false,
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

      <div className="toolbar-right-fs">
        <div className="toolbar-actions-group figma-toolbar-actions">
          {isGuest ? (
            <Link
              className="btn btn-primary figma-btn-save"
              to="/login"
              state={{ from: '/editor' }}
              id="btn-save"
              title="Inicia sesión para guardar tu diseño"
            >
              <Icon name="save" size={18} /> Guardar
            </Link>
          ) : (
            <button type="button" className="btn btn-primary figma-btn-save" onClick={handleSave} disabled={isSaving} id="btn-save">
              <Icon name="save" size={18} /> {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          )}
          <button type="button" className="btn btn-primary figma-btn-save figma-btn-pdf" onClick={handleExportPDF} id="btn-export-pdf" disabled={isSaving}>
            <Icon name="download" size={18} /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}
