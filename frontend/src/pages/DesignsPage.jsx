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
  const [contextDesign, setContextDesign] = useState(null);

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
    <section className="figma-sector" id="designs-page">
      <div className="figma-sector-inner">
        <header className="figma-sector-hero">
          <h1>Mis diseños</h1>
          <p>
            Crea, organiza y edita tus diagramas de flujo. Cada proyecto se guarda en una tarjeta
            para que puedas retomarlo cuando quieras.
          </p>
          {user && (
            <div className="figma-sector-toolbar">
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
                <Icon name="plus" /> Crear diseño
              </Link>
            </div>
          )}
        </header>

        {!user && (
          <div className="figma-empty-panel figma-dot-pattern">
            <Icon name="empty" size={64} strokeWidth={1} />
            <h3>Modo invitado</h3>
            <p>Para guardar y ver tus diseños, inicia sesión o crea una cuenta.</p>
            <Link className="primary-button" to="/login">+ Iniciar sesión</Link>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {user && (
          <div className="figma-cards-grid">
            {filteredDesigns.length === 0 ? (
              <div className="figma-empty-panel figma-dot-pattern">
                <Icon name="empty" size={64} strokeWidth={1} />
                <h3>No hay diseños guardados</h3>
                <p>Crea un nuevo proyecto para que aparezca en tu lista.</p>
                <Link className="primary-button" to="/editor">
                  <Icon name="plus" /> Crear diseño
                </Link>
              </div>
            ) : (
              filteredDesigns.map((design) => {
                const tag = getDesignTag(design);
                return (
                  <article
                    key={design.id}
                    className="figma-card design-card"
                    id={`design-card-${design.id}`}
                  >
                    <div
                      className="figma-card-media figma-dot-pattern"
                      onClick={() => navigate(`/editor/${design.id}`)}
                    >
                      {design.image ? (
                        <img src={design.image} alt={design.title} className="design-thumb-img" />
                      ) : (
                        <span className="figma-card-placeholder">Tarjeta - Img</span>
                      )}
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
                        <Icon name="dots" />
                      </button>
                    </div>

                    <div
                      className="figma-card-body"
                      onClick={() => navigate(`/editor/${design.id}`)}
                    >
                      <h3 className="figma-card-title">{design.title}</h3>
                      <div className="figma-card-meta">
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

                    <button
                      type="button"
                      className="figma-card-action"
                      onClick={() => navigate(`/editor/${design.id}`)}
                    >
                      + Abrir diseño
                    </button>
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
