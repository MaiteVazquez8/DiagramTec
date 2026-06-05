/** Modal de confirmación reutilizable (diseño Figma: fondo con puntos, botones Si / No). */
import Icon from './Icon.jsx';

export default function ConfirmModal({
  open = false,
  message,
  onConfirm,
  onCancel,
  onClose,
  confirmLabel = 'Si',
  cancelLabel = 'No',
  busy = false,
  titleId = 'confirm-modal-title',
}) {
  if (!open) return null;

  const handleClose = onCancel || onClose;

  return (
    <div
      className="modal-overlay figma-modal-overlay confirm-modal-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="modal confirm-modal figma-dot-pattern"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="modal-close confirm-modal__close"
          onClick={handleClose}
          aria-label="Cerrar"
          disabled={busy}
        >
          <Icon name="close" size={18} />
        </button>
        <p id={titleId} className="confirm-modal__message">
          {message}
        </p>
        <div className="confirm-modal__actions">
          <button
            type="button"
            className="confirm-modal__btn"
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            className="confirm-modal__btn"
            onClick={handleClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
