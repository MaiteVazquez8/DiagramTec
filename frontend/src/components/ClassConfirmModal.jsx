/** Atajos de mensaje para confirmaciones en clases; usa ConfirmModal por debajo. */
import ConfirmModal from './ConfirmModal.jsx';

/**
 * Genera el mensaje JSX según el tipo de confirmación en contexto de clases.
 * @param {'expel'|'deletePost'|'deleteClass'|'deleteComment'} variant
 * @param {string} [highlightName=''] - Nombre a resaltar (p. ej. alumno a expulsar)
 */
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

/**
 * Modal de confirmación especializado para acciones en páginas de clase.
 * @param {boolean} open - Visibilidad del modal
 * @param {string} variant - Tipo de acción (ver getClassConfirmMessage)
 * @param {string} [highlightName] - Nombre destacado en el mensaje
 * @param {Function} onClose - Cierra sin confirmar
 * @param {Function} onConfirm - Ejecuta la acción confirmada
 * @param {boolean} [busy=false] - Bloquea botones durante la petición
 */
export default function ClassConfirmModal({
  open,
  variant,
  highlightName = '',
  onClose,
  onConfirm,
  busy = false,
}) {
  const message = getClassConfirmMessage(variant, highlightName);
  // Variante desconocida: no muestra modal
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
