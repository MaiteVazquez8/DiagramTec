import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

import Icon from '../components/Icon.jsx';


export default function DesignsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [contextDesign, setContextDesign] = useState(null); // for the modal

  const loadDesigns = async () => {
    try {
      const response = await api.get('/designs');
      setDesigns(response.data.designs);
    } catch (err) {
      setError('No se pudieron cargar los diseños');
    }
  };

  useEffect(() => {
    if (user) {
      loadDesigns();
    }
  }, [user]);

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
    <section className="page-container" id="designs-page">
      {/* ── Header ── */}
      <div className="designs-page-header">
        <h1>Mis Diseños</h1>
        <div className="designs-header-actions">
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
          <Link className="primary-button" to="/editor" id="btn-create-design">
            <Icon name="plus" /> Crear Diseño
          </Link>
        </div>
      </div>

      {/* ── Guest message ── */}
      {!user && (
        <div className="designs-empty">
          <Icon name="empty" size={64} strokeWidth={1} />
          <h3>Modo invitado</h3>
          <p>Para guardar y ver tus diseños, inicia sesión o crea una cuenta.</p>
          <Link className="primary-button" to="/login">Ingresar</Link>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {/* ── Design Cards Grid ── */}
      {user && (
        <div className="designs-grid">
          {filteredDesigns.length === 0 ? (
            <div className="designs-empty">
              <Icon name="empty" size={64} strokeWidth={1} />
              <h3>No hay diseños guardados</h3>
              <p>Crea un nuevo proyecto para que aparezca en tu lista.</p>
              <Link className="primary-button" to="/editor">
                <Icon name="plus" /> Crear mi primer diseño
              </Link>
            </div>
          ) : (
            filteredDesigns.map((design) => {
              const tag = getDesignTag(design);
              return (
                <article
                  key={design.id}
                  className="design-card"
                  id={`design-card-${design.id}`}
                >
                  {/* Thumbnail */}
                  <div
                    className="design-card-thumb"
                    onClick={() => navigate(`/editor/${design.id}`)}
                  >
                    {design.image ? (
                      <img src={design.image} alt={design.title} className="design-thumb-img" />
                    ) : (
                      <Icon name="image" size={48} strokeWidth={1.2} />
                    )}
                    {!!design.isClassDesign && (
                      <span className="design-card-badge">Clase</span>
                    )}
                    <button
                      className="design-card-menu-btn"
                      title="Opciones"

                      onClick={(e) => {
                        e.stopPropagation();
                        setContextDesign(design);
                      }}
                      id={`design-menu-${design.id}`}
                    >
                      <Icon name="dots" />
                    </button>
                  </div>

                  {/* Info */}
                  <div
                    className="design-card-info"
                    onClick={() => navigate(`/editor/${design.id}`)}
                  >
                    <div className="design-card-title">{design.title}</div>
                    <div className="design-card-meta">
                      <span className={`design-card-tag ${tag.cls}`}>{tag.label}</span>
                      <span>
                        {new Date(design.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ── Context / Options Modal ── */}
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
            {/* Header */}
            <div className="design-context-header">
              <h3>
                <span className="avatar-icon">
                  {getInitials(contextDesign.ownerName)}
                </span>
                Usuario
              </h3>
              <button
                className="design-context-close"
                onClick={() => setContextDesign(null)}
                id="close-context-modal"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="design-context-body">
              {/* Actions */}
              <div className="design-context-actions">
                <button
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
                  className="context-action danger"
                  onClick={() => handleDelete(contextDesign.id)}
                  id="ctx-delete"
                >
                  <Icon name="trash" /> Eliminar
                </button>
                <button className="context-action" id="ctx-export">
                  <Icon name="export" /> Exportar
                </button>
                <button
                  className="context-action"
                  onClick={() => handleCopy(contextDesign.id)}
                  id="ctx-copy"
                >
                  <Icon name="copy" /> Copiar
                </button>
              </div>

              {/* Preview */}
              <div className="design-context-preview">
                <div className="design-context-thumb">
                  {contextDesign.image ? (
                    <img src={contextDesign.image} alt={contextDesign.title} className="design-thumb-img-large" />
                  ) : (
                    <Icon name="image" size={48} strokeWidth={1.2} />
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
    </section>
  );
}
