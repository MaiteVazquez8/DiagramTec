import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

/* ── SVG Icons ─────────────────────────────── */
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14"/><path d="M5 12h14"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const ExportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

const EmptyIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 18v-1"/><path d="M14 18v-3"/>
  </svg>
);

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
            <SearchIcon />
            <input
              type="text"
              placeholder="Buscar diseño..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-designs"
            />
          </div>
          <Link className="primary-button" to="/editor" id="btn-create-design">
            <PlusIcon /> Crear Diseño
          </Link>
        </div>
      </div>

      {/* ── Guest message ── */}
      {!user && (
        <div className="designs-empty">
          <EmptyIcon />
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
              <EmptyIcon />
              <h3>No hay diseños guardados</h3>
              <p>Crea un nuevo proyecto para que aparezca en tu lista.</p>
              <Link className="primary-button" to="/editor">
                <PlusIcon /> Crear mi primer diseño
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
                    <ImageIcon />
                    {design.isClassDesign && (
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
                      <DotsIcon />
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
                  <EditIcon /> Editar
                </button>
                <button
                  className="context-action danger"
                  onClick={() => handleDelete(contextDesign.id)}
                  id="ctx-delete"
                >
                  <TrashIcon /> Eliminar
                </button>
                <button className="context-action" id="ctx-export">
                  <ExportIcon /> Exportar
                </button>
                <button
                  className="context-action"
                  onClick={() => handleCopy(contextDesign.id)}
                  id="ctx-copy"
                >
                  <CopyIcon /> Copiar
                </button>
              </div>

              {/* Preview */}
              <div className="design-context-preview">
                <div className="design-context-thumb">
                  <ImageIcon />
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
