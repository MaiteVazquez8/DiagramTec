/** Tarjeta de publicación en detalle de clase: preview del diagrama, expandir/colapsar, acciones. */
import Icon from './Icon';

export default function ClassPost({
  design,
  isCollapsed,
  togglePost,
  handleCopy,
  handleDelete,
  handleView,
  currentUser,
  getInitials,
}) {
  const isOwner = design.ownerId === currentUser?.id;
  const isAdmin = currentUser?.role === 'superadmin';
  const canDelete = isAdmin || isOwner;

  const formattedDate = new Date(design.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className={`figma-class-post${isCollapsed ? ' is-collapsed' : ''}`} id={`post-${design.id}`}>
      <header className="figma-class-post__head">
        <div className="figma-class-post__avatar">{getInitials(design.ownerName)}</div>
        <div className="figma-class-post__meta">
          <div className="figma-class-post__name">
            {isCollapsed ? design.title : design.ownerName}
          </div>
          <div className="figma-class-post__date">{formattedDate}</div>
        </div>
        <div className="figma-class-post__head-actions">
          {canDelete && (
            <button
              type="button"
              className="figma-class-post__icon-btn"
              onClick={() => handleDelete(design.id)}
              title="Eliminar publicación"
              aria-label="Eliminar publicación"
            >
              <Icon name="trash" size={17} />
            </button>
          )}
          <button
            type="button"
            className="figma-class-post__icon-btn"
            onClick={() => togglePost(design.id)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expandir publicación' : 'Contraer publicación'}
          >
            {isCollapsed ? <Icon name="chevronDown" size={20} /> : <Icon name="chevronUp" size={20} />}
          </button>
        </div>
      </header>

      {!isCollapsed && (
        <div className="figma-class-post__body">
          <h3 className="figma-class-post__title">{design.title}</h3>
          {design.description && (
            <p className="figma-class-post__description">{design.description}</p>
          )}

          <div className="figma-class-post__preview figma-dot-pattern">
            {design.image ? (
              <img src={design.image} alt={design.title} className="figma-class-post__preview-img" />
            ) : (
              <div className="figma-class-post__preview-placeholder" aria-hidden>
                <Icon name="image" size={40} strokeWidth={1.2} />
              </div>
            )}
          </div>

          {design.pdf_data && (
            <button
              type="button"
              className="figma-class-post__pdf-link"
              onClick={() => {
                const link = document.createElement('a');
                link.href = design.pdf_data;
                link.download = `${design.title}.pdf`;
                link.click();
              }}
            >
              <Icon name="download" size={14} />
              Descargar PDF
            </button>
          )}

          <footer className="figma-class-post__footer">
            <Icon name="comment" size={18} className="figma-class-post__footer-icon" />
            <button
              type="button"
              className="figma-class-post__footer-cta"
              onClick={() => document.getElementById('class-comment-input')?.focus()}
            >
              Subir comentario / diseño
            </button>
            <div className="figma-class-post__footer-aside">
              <button type="button" className="figma-class-post__footer-link" onClick={() => handleView(design.id)}>
                Ver diseño
              </button>
              <button type="button" className="figma-class-post__footer-link" onClick={() => handleCopy(design.id)}>
                Copiar diseño
              </button>
            </div>
          </footer>
        </div>
      )}
    </article>
  );
}
