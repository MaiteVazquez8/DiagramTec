/** Barra superior del editor: título, guardar, exportar PDF, zoom. */
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

export default function EditorToolbar({
  saveTitle, setSaveTitle,
  classes, saveClassId, setSaveClassId,
  handleSave, handleClear, handleExport, handleExportPDF,
  isSaving,
  isGuest = false,
  readOnly = false,
  onGuestSaveNavigate,
  onCopyDesign,
  canCopyDesign = false,
  alreadyCopiedDesign = false,
  isCopyingDesign = false,
  isSharedOwner = false,
}) {
  const location = useLocation();

  return (
    <div className="editor-toolbar-fs figma-editor-toolbar">
      <div className="toolbar-left-fs">
        {readOnly ? (
          <div className="toolbar-title-input figma-toolbar-title toolbar-title-readonly" id="editor-title-input">
            {saveTitle || 'Diagrama compartido'}
          </div>
        ) : (
        <input
          type="text"
          className="toolbar-title-input figma-toolbar-title"
          value={saveTitle}
          onChange={(e) => setSaveTitle(e.target.value)}
          placeholder="Mi diagrama"
          id="editor-title-input"
        />
        )}
      </div>

      <div className="toolbar-right-fs">
        <div className="toolbar-actions-group figma-toolbar-actions">
          {readOnly ? (
            <>
              <span className="figma-view-only-badge">Solo lectura</span>
              {isGuest ? (
                <Link
                  className="btn btn-primary figma-btn-save figma-btn-copy-design"
                  to="/login"
                  state={{ from: location.pathname }}
                  id="btn-login-to-copy"
                >
                  <Icon name="copy" size={18} /> Iniciar sesión para copiar
                </Link>
              ) : canCopyDesign ? (
                <button
                  type="button"
                  className="btn btn-primary figma-btn-save figma-btn-copy-design"
                  onClick={onCopyDesign}
                  disabled={isCopyingDesign}
                  id="btn-copy-shared-design"
                >
                  <Icon name="copy" size={18} />
                  {isCopyingDesign ? 'Copiando...' : 'Copiar diseño'}
                </button>
              ) : alreadyCopiedDesign ? (
                <span className="figma-view-only-badge figma-view-only-badge--muted">
                  Ya copiaste este diagrama
                </span>
              ) : isSharedOwner ? null : null}
            </>
          ) : isGuest ? (
            <button
              type="button"
              className="btn btn-primary figma-btn-save"
              onClick={onGuestSaveNavigate}
              id="btn-save"
              title="Inicia sesión para guardar tu diseño"
            >
              <Icon name="save" size={18} /> Guardar
            </button>
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
