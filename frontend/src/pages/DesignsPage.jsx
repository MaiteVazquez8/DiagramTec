/** Biblioteca personal de diseños (ruta /designs). Grilla Figma y menú contextual por diseño. */
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

import Icon from '../components/Icon.jsx';

function normalizeDesign(raw) {
  return {
    ...raw,
    isClassDesign: Boolean(raw.classId),
    title: raw.title || 'Sin título',
  };
}

export default function DesignsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState('');
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [contextDesign, setContextDesign] = useState(null);

  const loadDesigns = useCallback(async () => {
    setIsLoadingDesigns(true);
    setError('');
    try {
      const response = await api.get('/designs');
      const list = Array.isArray(response.data?.designs) ? response.data.designs : [];
      setDesigns(list.map(normalizeDesign));
    } catch (err) {
      setDesigns([]);
      const status = err.response?.status;
      if (status === 401) {
        setError('Tu sesión expiró. Vuelve a iniciar sesión.');
      } else {
        setError('No se pudieron cargar los diseños. Comprueba que el servidor esté activo.');
      }
    } finally {
      setIsLoadingDesigns(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadDesigns();
    }
    if (!authLoading && !user) {
      setDesigns([]);
      setError('');
      setIsLoadingDesigns(false);
    }
  }, [user, authLoading, location.key, loadDesigns]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user) {
        loadDesigns();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, loadDesigns]);

  const filteredDesigns = designs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    try {
      await api.delete(`/designs/${id}`);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      setContextDesign(null);
    } catch (err) {
      setError('No se pudo eliminar el diseño');
    }
  };

  const handleCopy = async (id) => {
    try {
      await api.post(`/designs/${id}/copy`);
      loadDesigns();
      setContextDesign(null);
    } catch (err) {
      setError('No se pudo copiar el diseño');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <section className="figma-sector" id="designs-page">
      <div className="figma-sector-inner">
        <header className="figma-sector-hero">
          <h1>Mis diseños</h1>
          <div className="figma-sector-toolbar">
            {user ? (
              <>
                <div className={`search-toggle ${searchOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="search-circle"
                    onClick={() => setSearchOpen((v) => !v)}
                    aria-label="Buscar diseño"
                    id="btn-search-toggle"
                  >
                    <Icon name="search" size={18} strokeWidth={2.5} />
                  </button>
                  {searchOpen && (
                    <input
                      type="text"
                      className="search-expand"
                      placeholder="Buscar diseño..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      id="search-designs"
                      autoFocus
                    />
                  )}
                </div>
                <Link className="primary-button" to="/editor" id="btn-create-design">
                  <Icon name="plus" size={18} strokeWidth={2.5} />
                  Crear diseño
                </Link>
              </>
            ) : (
              <>
                <Link className="primary-button" to="/editor" id="btn-create-design">
                  <Icon name="plus" size={18} strokeWidth={2.5} />
                  Crear diseño
                </Link>
                <Link className="secondary-button" to="/login" id="btn-guest-login">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </header>

        {authLoading && (
          <div className="figma-empty-panel figma-dot-pattern" aria-busy="true">
            <p className="figma-loading-text">Cargando tu sesión…</p>
          </div>
        )}

        {!authLoading && !user && (
          <div className="figma-empty-panel figma-dot-pattern">
            <Icon name="image" size={64} strokeWidth={1} />
            <h3>Modo invitado</h3>
            <p>
              Crea y edita diagramas libremente. Para guardarlos en tu cuenta y ver tu biblioteca,
              inicia sesión o regístrate.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to="/editor" id="btn-guest-create">
                <Icon name="plus" size={18} strokeWidth={2.5} />
                Crear diseño
              </Link>
              <Link className="secondary-button" to="/login">Iniciar sesión</Link>
              <Link className="secondary-button" to="/signup">Crear cuenta</Link>
            </div>
          </div>
        )}

        {error && (
          <div className="figma-designs-error">
            <p className="error-text">{error}</p>
            {user ? (
              <button type="button" className="secondary-button" onClick={loadDesigns}>
                Reintentar
              </button>
            ) : null}
          </div>
        )}

        {!authLoading && user && (
          <div className="figma-cards-grid">
            {isLoadingDesigns ? (
              <div className="figma-empty-panel figma-dot-pattern" aria-busy="true">
                <p className="figma-loading-text">Cargando tus diseños…</p>
              </div>
            ) : filteredDesigns.length === 0 ? (
              <div className="figma-empty-panel figma-dot-pattern">
                <Icon name="empty" size={64} strokeWidth={1} />
                <h3>No hay diseños guardados</h3>
                <p>
                  {search.trim()
                    ? 'No hay resultados para tu búsqueda. Prueba con otro nombre.'
                    : 'Crea un diagrama en el editor y pulsa Guardar para que aparezca aquí.'}
                </p>
                <Link className="primary-button" to="/editor" id="btn-empty-create-design">
                  <Icon name="plus" size={18} strokeWidth={2.5} />
                  Crear diseño
                </Link>
              </div>
            ) : (
              filteredDesigns.map((design, index) => (
                <article
                  key={design.id}
                  className="figma-card figma-card--compact"
                  id={`design-card-${design.id}`}
                  style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                >
                  <button
                    type="button"
                    className="figma-card-media figma-dot-pattern"
                    onClick={() => navigate(`/editor/${design.id}`)}
                  >
                    {design.image ? (
                      <img src={design.image} alt="" className="design-thumb-img" />
                    ) : (
                      <Icon name="image" size={36} strokeWidth={1.25} />
                    )}
                  </button>
                  <div className="figma-card-foot">
                    <h3 className="figma-card-title" title={design.title}>{design.title}</h3>
                    <button
                      type="button"
                      className="figma-card-menu-btn"
                      title="Opciones"
                      onClick={() => setContextDesign(design)}
                      id={`design-menu-${design.id}`}
                    >
                      <Icon name="dots" size={18} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {contextDesign && (
          <div
            className="design-context-overlay"
            onClick={() => setContextDesign(null)}
            id="design-context-overlay"
          >
            <div
              className="design-context-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="design-context-close"
                type="button"
                onClick={() => setContextDesign(null)}
                id="close-context-modal"
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div className="design-context-header">
                <h3>
                  <span className="avatar-icon">{getInitials(contextDesign.ownerName)}</span>
                  {contextDesign.ownerName || 'Usuario'}
                </h3>
              </div>

              <div className="design-context-body">
                <div className="design-context-actions">
                  <button
                    type="button"
                    className="context-action"
                    onClick={() => {
                      setContextDesign(null);
                      navigate(`/editor/${contextDesign.id}`);
                    }}
                    id="ctx-edit"
                  >
                    <Icon name="edit" size={16} /> Editar diseño
                  </button>
                  <button
                    type="button"
                    className="context-action"
                    onClick={() => handleDelete(contextDesign.id)}
                    id="ctx-delete"
                  >
                    <Icon name="trash" size={16} /> Eliminar diseño
                  </button>
                  <button
                    type="button"
                    className="context-action"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${contextDesign.title || 'diagrama'}.pdf`;
                      link.href = contextDesign.pdf_data || contextDesign.image;
                      link.click();
                    }}
                    id="ctx-export"
                  >
                    <Icon name="export" size={16} /> Exportar diseño
                  </button>
                  <button
                    type="button"
                    className="context-action"
                    onClick={() => handleCopy(contextDesign.id)}
                    id="ctx-copy"
                  >
                    <Icon name="copy" size={16} /> Copiar diseño
                  </button>
                </div>

                <div className="design-context-preview">
                  <div className="design-context-thumb figma-dot-pattern">
                    {contextDesign.image ? (
                      <img src={contextDesign.image} alt="" className="design-thumb-img-large" />
                    ) : (
                      <Icon name="image" size={48} strokeWidth={1} />
                    )}
                  </div>
                </div>
              </div>

              <div className="design-context-footer">
                <div className="design-context-details">
                  <strong>{contextDesign.title}</strong>
                  {new Date(contextDesign.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <button type="button" className="context-action design-context-share">
                  <Icon name="share" size={16} /> Compartir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
