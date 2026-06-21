/**
 * Tarjeta Figma reutilizable (diseños, clases, previews).
 * media: contenido de la zona superior; foot: título + acciones.
 */
export default function Card({
  title,
  compact = true,
  onClick,
  onKeyDown,
  media,
  foot,
  animationDelay,
  className = '',
  id,
  tabIndex,
  role,
}) {
  const interactive = typeof onClick === 'function';

  return (
    <article
      id={id}
      className={`figma-card ui-card${compact ? ' figma-card--compact' : ''}${interactive ? ' ui-card--interactive' : ''} ${className}`.trim()}
      style={animationDelay != null ? { animationDelay: `${animationDelay}s` } : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role ?? (interactive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
    >
      {media ? <div className="figma-card-media figma-dot-pattern">{media}</div> : null}
      <div className="figma-card-foot">
        {title ? (
          <h3 className="figma-card-title" title={typeof title === 'string' ? title : undefined}>
            {title}
          </h3>
        ) : null}
        {foot}
      </div>
    </article>
  );
}
