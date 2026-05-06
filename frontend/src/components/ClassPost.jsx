import Icon from './Icon';

export default function ClassPost({ 
  design, 
  isCollapsed, 
  togglePost, 
  handleCopy, 
  handleDelete,
  currentUser,
  navigate,
  getInitials
}) {
  const isOwner = design.ownerId === currentUser?.id;
  const isAdmin = currentUser?.role === 'superadmin';
  const canDelete = isAdmin || isOwner;
  // componente para mostrar una publicacion de clase con un diagrama
  return (
    <article className="post-card" id={`post-${design.id}`}>
      {/* header de la publicacion con info del autor */}
      <div className="post-header" style={{ paddingBottom: isCollapsed ? '1.15rem' : '0' }}>
        <div className="post-avatar">
          {getInitials(design.ownerName)}
        </div>
        <div className="post-author">
          <div className="post-author-name">{design.ownerName}</div>
          <div className="post-date">
            {new Date(design.createdAt).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
        <div className="post-header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {canDelete && (
            <button 
              className="post-toggle" 
              onClick={() => handleDelete(design.id)}
              title="Eliminar publicación"
              style={{ color: 'rgba(220, 38, 38, 0.4)' }}
            >
              <Icon name="trash" size={18} />
            </button>
          )}
          <button className="post-toggle" onClick={() => togglePost(design.id)}>
            {isCollapsed ? <Icon name="chevronDown" /> : <Icon name="chevronUp" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* cuerpo de la publicacion donde va el titulo */}
          <div className="post-body">
            <p><strong>{design.title}</strong></p>
          </div>

          {/* imagen o vista previa del diagrama guardado */}
          <div className="post-image">
            {design.image ? (
              <img src={design.image} alt={design.title} className="post-img" />
            ) : (
              <div className="post-image-placeholder">
                <Icon name="image" size={48} strokeWidth={1.2} />
              </div>
            )}
          </div>

          {/* acciones disponibles para la publicacion */}
          <div className="post-actions">
            <button
              className="post-action-btn"
              onClick={() => handleCopy(design.id)}
              id={`copy-design-${design.id}`}
            >
              <Icon name="comment" size={16} /> Copiar Diseño
            </button>
            <button
              className="post-action-btn"
              onClick={() => navigate(`/editor/${design.id}`)}
              style={{ background: 'var(--dark)', color: 'var(--cream)', borderColor: 'var(--dark)' }}
            >
              <Icon name="image" size={16} /> Ver Diseño
            </button>
            <div className="post-action-date">
              <Icon name="clock" size={14} />
              {new Date(design.createdAt).toLocaleDateString('es-AR')}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
