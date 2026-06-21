/** Panel vacío con icono, texto y acción opcional (estilo figma-empty-panel). */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`figma-empty-panel figma-dot-pattern ui-empty-state ui-fade-in ${className}`.trim()}>
      {icon}
      {title ? <h3>{title}</h3> : null}
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
