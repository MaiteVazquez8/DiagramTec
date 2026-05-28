/** Modal de confirmación Figma para acciones en clase (expulsar, eliminar publicación/clase). */
import Icon from './Icon.jsx';

function ConfirmMessage({ variant, highlightName }) {
  if (variant === 'expel') {
    return (
      <>
        ¿Esta seguro que quiere expulsar a{' '}
        <strong className="class-confirm-modal__highlight">{highlightName || 'este alumno'}</strong>
        {' '}de la clase?
      </>
    );
  }
  if (variant === 'deletePost') {
    return <>¿Esta seguro que quiere eliminar la publicación?</>;
  }
  if (variant === 'deleteClass') {
    return <>¿Esta seguro que quiere eliminar la clase?</>;
  }
  if (variant === 'deleteComment') {
    return <>¿Esta seguro que quiere eliminar el comentario?</>;
  }
  return null;
}

export default function ClassConfirmModal({
  open,
  variant,
  highlightName = '',
  onClose,
  onConfirm,
  busy = false,
}) {
  if (!open || !variant) return null;

  return (
    <div
      className="modal-overlay figma-modal-overlay class-confirm-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal class-confirm-modal figma-dot-pattern"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-confirm-modal-title"
      >
        <button
          type="button"
          className="modal-close class-confirm-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <Icon name="close" size={18} />
        </button>
        <p id="class-confirm-modal-title" className="class-confirm-modal__message">
          <ConfirmMessage variant={variant} highlightName={highlightName} />
        </p>
        <div className="class-confirm-modal__actions">
          <button
            type="button"
            className="class-confirm-modal__btn"
            onClick={onConfirm}
            disabled={busy}
          >
            Si
          </button>
          <button
            type="button"
            className="class-confirm-modal__btn"
            onClick={onClose}
            disabled={busy}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
