/** Tarjeta de publicación en detalle de clase (mock Figma). */
import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

/** Compara IDs numéricos tolerando string/number de la API. */
function sameId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

/**
 * Tarjeta de un diseño publicado dentro de una clase.
 * Muestra autor, fecha, preview, menú contextual y acciones rápidas.
 */
export default function ClassPost({
  design,
  isCollapsed,
  togglePost,
  handleCopy,
  handleDelete,
  handleView,
  handleExpel,
  canExpelStudent,
  currentUser,
  getInitials,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Permisos derivados del usuario actual y del dueño del diseño
  const isOwner = sameId(design.ownerId, currentUser?.id);
  const isAdmin = currentUser?.role === 'superadmin';
  const canDelete = isAdmin || isOwner;
  // Publicación de alumno ajeno al dueño de la clase (candidata a expulsión)
  const isStudentPost =
    design.ownerRole === 'student'
    && !sameId(design.ownerId, design.classOwnerId);
  const showExpel = Boolean(canExpelStudent && isStudentPost && handleExpel);

  const formattedDate = new Date(design.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const bodyText = design.description?.trim() || design.title;

  /** Descarga el PDF embebido en base64 si existe en design.pdf_data */
  const handleDownloadPdf = () => {
    if (!design.pdf_data) return;
    const link = document.createElement('a');
    link.href = design.pdf_data;
    link.download = `${design.title || 'diagrama'}.pdf`;
    link.click();
  };

  // Cierra el menú popover al hacer clic fuera
  useEffect(() => {
    if (!showMenu) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showMenu]);

  return (
    <article className={`figma-class-post${isCollapsed ? ' is-collapsed' : ''}`} id={`post-${design.id}`}>
      {/* Cabecera: avatar, autor, fecha y controles expandir/menú */}
      <header className="figma-class-post__head">
        <div className="figma-class-post__avatar" aria-hidden>
          {getInitials(design.ownerName)}
        </div>
        <div className="figma-class-post__meta">
          <div className="figma-class-post__name">{design.ownerName}</div>
          <div className="figma-class-post__date">{formattedDate}</div>
        </div>
        <div className="figma-class-post__head-actions">
          <button
            type="button"
            className="figma-class-post__icon-btn"
            onClick={() => togglePost(design.id)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expandir publicación' : 'Contraer publicación'}
          >
            <Icon name={isCollapsed ? 'chevronDown' : 'chevronUp'} size={20} />
          </button>
          <div className="figma-class-post__menu-wrap" ref={menuRef}>
            <button
              type="button"
              className={`figma-class-post__icon-btn figma-class-post__menu-btn${showMenu ? ' figma-class-post__menu-btn--open' : ''}`}
              onClick={() => setShowMenu((v) => !v)}
              aria-expanded={showMenu}
              aria-haspopup="menu"
              aria-label="Opciones de la publicación"
            >
              <Icon name="dots" size={18} />
            </button>
            {showMenu && (
              <div className="figma-class-post__popover" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="figma-class-post__popover-btn"
                  onClick={() => { setShowMenu(false); handleView(design.id); }}
                >
                  Ver diseño
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="figma-class-post__popover-btn"
                  onClick={() => { setShowMenu(false); handleCopy(design.id); }}
                >
                  Copiar diseño
                </button>
                {canDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    className="figma-class-post__popover-btn"
                    onClick={() => { setShowMenu(false); handleDelete(design.id); }}
                  >
                    Eliminar publicación
                  </button>
                )}
                {showExpel && (
                  <button
                    type="button"
                    role="menuitem"
                    className="figma-class-post__popover-btn"
                    onClick={() => {
                      setShowMenu(false);
                      handleExpel(design.ownerId, design.ownerName);
                    }}
                  >
                    Expulsar estudiante
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cuerpo expandible: descripción, preview y acciones */}
      {!isCollapsed && (
        <div className="figma-class-post__body">
          {bodyText && <p className="figma-class-post__description">{bodyText}</p>}

          <div className="figma-class-post__preview-wrap">
            <div className="figma-class-post__preview-actions" aria-label="Acciones del diseño">
              <button
                type="button"
                className="figma-class-post__action-btn"
                onClick={() => handleView(design.id)}
                title="Ver diseño"
                aria-label="Ver diseño"
              >
                <Icon name="eye" size={22} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="figma-class-post__action-btn"
                onClick={() => handleCopy(design.id)}
                title="Copiar diseño"
                aria-label="Copiar diseño"
              >
                <Icon name="copy" size={22} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="figma-class-post__action-btn"
                onClick={handleDownloadPdf}
                disabled={!design.pdf_data}
                title={design.pdf_data ? 'Descargar PDF' : 'PDF no disponible'}
                aria-label="Descargar PDF"
              >
                <Icon name="download" size={22} strokeWidth={2} />
              </button>
            </div>
            <div className="figma-class-post__preview figma-dot-pattern">
              {design.image ? (
                <img src={design.image} alt={design.title} className="figma-class-post__preview-img" />
              ) : (
                <div className="figma-class-post__preview-placeholder" aria-hidden>
                  <Icon name="image" size={40} strokeWidth={1.2} />
                </div>
              )}
            </div>
          </div>

          <footer className="figma-class-post__footer">
            <Icon name="comment" size={18} className="figma-class-post__footer-icon" />
            <span className="figma-class-post__footer-label">Comentarios / diseños recibidos</span>
          </footer>
        </div>
      )}
    </article>
  );
}
