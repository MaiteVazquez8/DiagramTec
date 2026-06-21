/** Barra superior del editor: título, guardar, exportar PDF, zoom. */
import { Link } from 'react-router-dom';
import Icon from './Icon';

/**
 * Barra de herramientas principal del editor de diagramas.
 * Props de estado y handlers vienen del contenedor padre (EditorPage).
 */
export default function EditorToolbar({
  saveTitle, setSaveTitle,
  classes, saveClassId, setSaveClassId,
  handleSave, handleClear, handleExport, handleExportPDF,
  isSaving,
  isGuest = false,
}) {
  return (
    <div className="editor-toolbar-fs figma-editor-toolbar">
      {/* Zona izquierda: input editable con el título del diagrama */}
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

      {/* Zona derecha: acciones de guardado y exportación */}
      <div className="toolbar-right-fs">
        <div className="toolbar-actions-group figma-toolbar-actions">
          {isGuest ? (
            /* Invitado: redirige al login conservando la ruta /editor en state */
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
            /* Usuario autenticado: guarda en la API; deshabilitado mientras isSaving */
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
