import Icon from './Icon.jsx';

export default function EditorLeaveModal({
  open,
  variant,
  onSave,
  onLeaveWithoutSaving,
  onCancel,
  onWaitSaving,
  onAbortSaving,
  busy = false,
}) {
  if (!open) return null;

  const isSaving = variant === 'saving';

  return (
    <div
      className="modal-overlay figma-modal-overlay confirm-modal-overlay"
      onClick={isSaving ? onWaitSaving : onCancel}
      role="presentation"
    >
      <div
        className="modal confirm-modal editor-leave-modal figma-dot-pattern"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-leave-modal-title"
      >
        <button
          type="button"
          className="modal-close confirm-modal__close"
          onClick={isSaving ? onWaitSaving : onCancel}
          aria-label="Cerrar"
          disabled={busy}
        >
          <Icon name="close" size={18} />
        </button>
        <p id="editor-leave-modal-title" className="confirm-modal__message">
          {isSaving
            ? 'Se está guardando el diseño. ¿Querés esperar a que termine o cancelar el guardado?'
            : '¿Querés guardar los cambios antes de salir del editor?'}
        </p>

        {isSaving ? (
          <div className="editor-leave-modal__actions">
            <div className="editor-leave-modal__row">
              <button
                type="button"
                className="editor-leave-modal__btn editor-leave-modal__btn--primary"
                onClick={onWaitSaving}
                disabled={busy}
              >
                Esperar
              </button>
              <button
                type="button"
                className="editor-leave-modal__btn editor-leave-modal__btn--secondary"
                onClick={onAbortSaving}
                disabled={busy}
              >
                Cancelar guardado
              </button>
            </div>
          </div>
        ) : (
          <div className="editor-leave-modal__actions">
            <div className="editor-leave-modal__row">
              <button
                type="button"
                className="editor-leave-modal__btn editor-leave-modal__btn--primary"
                onClick={onSave}
                disabled={busy}
              >
                Guardar
              </button>
              <button
                type="button"
                className="editor-leave-modal__btn editor-leave-modal__btn--secondary"
                onClick={onLeaveWithoutSaving}
                disabled={busy}
              >
                Salir sin guardar
              </button>
            </div>
            <div className="editor-leave-modal__row editor-leave-modal__row--center">
              <button
                type="button"
                className="editor-leave-modal__btn editor-leave-modal__btn--cancel"
                onClick={onCancel}
                disabled={busy}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
