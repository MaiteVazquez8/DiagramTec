/** Modal con overlay, animación y cierre al clic fuera. */
export default function Modal({
  open,
  onClose,
  children,
  overlayClassName = 'modal-overlay figma-modal-overlay ui-modal-overlay',
  className = 'modal ui-modal',
  ariaLabelledby,
  id,
}) {
  if (!open) return null;

  return (
    <div
      className={overlayClassName}
      onClick={onClose}
      id={id ? `${id}-overlay` : undefined}
    >
      <div
        className={className}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        id={id}
      >
        {children}
      </div>
    </div>
  );
}
