/** Mensajes de confirmación reutilizables (eliminar, expulsar, abandonar, etc.). */
import ConfirmModal from './ConfirmModal.jsx';

export function getConfirmMessage(variant, highlightName = '') {
  if (variant === 'expel') {
    return (
      <>
        ¿Está seguro que quiere expulsar a{' '}
        <strong className="confirm-modal__highlight">{highlightName || 'este alumno'}</strong>
        {' '}de la clase?
      </>
    );
  }
  if (variant === 'deletePost') {
    return <>¿Está seguro que quiere eliminar la publicación?</>;
  }
  if (variant === 'deleteClass') {
    return (
      <>
        ¿Está seguro que quiere eliminar la clase{' '}
        <strong className="confirm-modal__highlight">{highlightName || 'esta clase'}</strong>
        {' '}y todo su contenido?
      </>
    );
  }
  if (variant === 'deleteComment') {
    return <>¿Está seguro que quiere eliminar el comentario?</>;
  }
  if (variant === 'deleteDesign') {
    return (
      <>
        ¿Está seguro que quiere eliminar el diseño{' '}
        <strong className="confirm-modal__highlight">{highlightName || 'seleccionado'}</strong>
        ?
      </>
    );
  }
  if (variant === 'leaveClass') {
    return (
      <>
        ¿Está seguro que quiere abandonar la clase{' '}
        <strong className="confirm-modal__highlight">{highlightName || 'esta clase'}</strong>
        ?
      </>
    );
  }
  if (variant === 'deleteAccount') {
    return <>¿Está seguro que quiere eliminar su cuenta?</>;
  }
  if (variant === 'deleteUser') {
    const [roleLabel = 'usuario', name = 'este usuario'] = String(highlightName || '').split('|');
    return (
      <>
        ¿Está seguro que quiere eliminar al{' '}
        <strong className="confirm-modal__highlight">{roleLabel}</strong>
        {' '}
        <strong className="confirm-modal__highlight">{name}</strong>
        ?
      </>
    );
  }
  if (variant === 'logout') {
    return <>¿Está seguro que quiere cerrar sesión?</>;
  }
  return null;
}

export default function AppConfirmModal({
  open,
  variant,
  highlightName = '',
  onClose,
  onConfirm,
  busy = false,
  titleId = 'app-confirm-modal-title',
}) {
  const message = getConfirmMessage(variant, highlightName);
  if (!message) return null;

  return (
    <ConfirmModal
      open={open}
      message={message}
      onClose={onClose}
      onConfirm={onConfirm}
      busy={busy}
      titleId={titleId}
    />
  );
}
