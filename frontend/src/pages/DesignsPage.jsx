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

  const getDesignTag = (design) => {
    if (design.isClassDesign) return { label: 'Compartido', cls: 'tag-shared' };
    if (design.isCopy) return { label: 'Copia', cls: 'tag-copied' };
    return { label: 'Privado', cls: 'tag-private' };
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
          <p>
            {user
              ? 'Crea, organiza y edita tus diagramas de flujo. Cada proyecto se guarda en una tarjeta para que puedas retomarlo cuando quieras.'
              : 'Puedes crear diagramas sin registrarte. Tus diseños no se guardan hasta que inicies sesión.'}
          </p>
          <div className="figma-sector-toolbar">
            {user ? (
              <div className="search-box">
                <Icon name="search" />
                <input
                  type="text"
                  placeholder="Buscar diseño..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="search-designs"
                />
              </div>
            ) : null}
            <Link className="primary-button" to="/editor" id="btn-create-design">
              <Icon name="plus" size={18} strokeWidth={2.5} />
              Crear diseño
            </Link>
            {!user ? (
              <Link className="secondary-button" to="/login" id="btn-guest-login">
                Iniciar sesión
              </Link>
            ) : null}
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
              filteredDesigns.map((design, index) => {
                const tag = getDesignTag(design);
                const formattedDate = new Date(design.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <article
                    key={design.id}
                    className="figma-card"
                    id={`design-card-${design.id}`}
                    style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                  >
                    <div
                      className="figma-card-media"
                      onClick={() => navigate(`/editor/${design.id}`)}
                    >
                      <div className="figma-card-preview">
                        {design.image ? (
                          <img src={design.image} alt={design.title} className="design-thumb-img" />
                        ) : (
                          <div className="figma-card-placeholder">
                            <Icon name="image" size={32} strokeWidth={1.25} />
                            <span>Sin vista previa</span>
                          </div>
                        )}
                      </div>
                      <div className="figma-card-media-overlay" aria-hidden>
                        <span>Abrir diseño</span>
                      </div>
                      {!!design.isClassDesign && (
                        <span className="figma-card-badge">Clase</span>
                      )}
                      <button
                        className="figma-card-menu-btn"
                        title="Opciones"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextDesign(design);
                        }}
                        id={`design-menu-${design.id}`}
                      >
                        <Icon name="dots" size={16} />
                      </button>
                    </div>

                    <div
                      className="figma-card-body"
                      onClick={() => navigate(`/editor/${design.id}`)}
                    >
                      <h3 className="figma-card-title" title={design.title}>
                        {design.title}
                      </h3>
                      <div className="figma-card-meta">
                        <span className={`design-card-tag ${tag.cls}`}>{tag.label}</span>
                        <span className="figma-card-meta-dot" aria-hidden />
                        <time className="figma-card-date" dateTime={design.createdAt}>
                          <Icon name="clock" size={13} strokeWidth={1.75} />
                          {formattedDate}
                        </time>
                      </div>
                    </div>

                    <div className="figma-card-footer">
                      <button
                        type="button"
                        className="figma-card-action"
                        onClick={() => navigate(`/editor/${design.id}`)}
                      >
                        <Icon name="edit" size={16} />
                        Abrir diseño
                      </button>
                    </div>
                  </article>
                );
              })
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
              <div className="design-context-header">
                <h3>
                  <span className="avatar-icon">
                    {getInitials(contextDesign.ownerName)}
                  </span>
                  Usuario
                </h3>
                <button
                  className="design-context-close"
                  type="button"
                  onClick={() => setContextDesign(null)}
                  id="close-context-modal"
                >
                  ✕
                </button>
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
                    <Icon name="edit" /> Editar
                  </button>
                  <button
                    type="button"
                    className="context-action danger"
                    onClick={() => handleDelete(contextDesign.id)}
                    id="ctx-delete"
                  >
                    <Icon name="trash" /> Eliminar
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
                    <Icon name="export" /> Exportar PDF
                  </button>
                  <button
                    type="button"
                    className="context-action"
                    onClick={() => handleCopy(contextDesign.id)}
                    id="ctx-copy"
                  >
                    <Icon name="copy" /> Copiar
                  </button>
                </div>

                <div className="design-context-preview">
                  <div className="design-context-thumb figma-dot-pattern">
                    {contextDesign.image ? (
                      <img src={contextDesign.image} alt={contextDesign.title} className="design-thumb-img-large" />
                    ) : (
                      <span className="figma-card-placeholder">Tarjeta - Img</span>
                    )}
                  </div>
                  <div className="design-context-details">
                    <strong>{contextDesign.title}</strong>
                    <br />
                    {contextDesign.isClassDesign
                      ? 'Compartido'
                      : contextDesign.isCopy
                        ? 'Copia'
                        : 'Privado'}
                    <br />
                    {new Date(contextDesign.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
