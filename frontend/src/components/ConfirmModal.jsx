/** Modal de confirmación reutilizable (diseño Figma: fondo con puntos, botones Si / No). */
import Icon from './Icon.jsx';

/**
 * Diálogo modal genérico de confirmación/cancelación.
 * @param {boolean} [open=false] - Controla visibilidad
 * @param {React.ReactNode} message - Texto o JSX del mensaje
 * @param {Function} onConfirm - Acción al confirmar (botón Si)
 * @param {Function} [onCancel] - Acción al cancelar (prioridad sobre onClose)
 * @param {Function} [onClose] - Cierre alternativo si no hay onCancel
 * @param {string} [confirmLabel='Si'] - Etiqueta del botón confirmar
 * @param {string} [cancelLabel='No'] - Etiqueta del botón cancelar
 * @param {boolean} [busy=false] - Deshabilita botones durante operación async
 * @param {string} [titleId='confirm-modal-title'] - id del mensaje para aria-labelledby
 */
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

  // onCancel tiene prioridad; si no existe, usa onClose
  const handleClose = onCancel || onClose;

  return (
    /* Overlay: clic fuera del modal cierra/cancela */
    <div
      className="modal-overlay figma-modal-overlay confirm-modal-overlay"
      onClick={handleClose}
      role="presentation"
    >
      {/* Panel del modal: stopPropagation evita cerrar al clicar dentro */}
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
