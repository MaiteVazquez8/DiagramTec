/** Atajos de mensaje para confirmaciones en clases; usa ConfirmModal por debajo. */
import ConfirmModal from './ConfirmModal.jsx';

export function getClassConfirmMessage(variant, highlightName = '') {
  if (variant === 'expel') {
    return (
      <>
        ¿Esta seguro que quiere expulsar a{' '}
        <strong className="confirm-modal__highlight">{highlightName || 'este alumno'}</strong>
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
  const message = getClassConfirmMessage(variant, highlightName);
  if (!message) return null;

  return (
    <ConfirmModal
      open={open}
      message={message}
      onClose={onClose}
      onConfirm={onConfirm}
      busy={busy}
      titleId="class-confirm-modal-title"
    />
  );
}
