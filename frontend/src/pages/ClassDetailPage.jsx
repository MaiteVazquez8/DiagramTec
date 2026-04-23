import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

/* ── SVG Icons ─────────────────────────────── */
const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const SmallImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const ChevronUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

export default function ClassDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [comments, setComments] = useState([]);
  const [userDesigns, setUserDesigns] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [collapsedPosts, setCollapsedPosts] = useState(new Set());

  const loadClassData = async () => {
    try {
      // Load all classes to find this one and its joined status
      const classesRes = await api.get('/classes');
      const found = classesRes.data.classes.find((c) => c.id === Number(id));
      if (found) setClassInfo(found);

      // Load class designs and comments
      const designsRes = await api.get(`/classes/${id}/designs`);
      setDesigns(designsRes.data.designs);
      setComments(designsRes.data.comments || []);
    } catch (err) {
      setError('No se pudo cargar la información de la clase');
    }
  };

  const loadUserDesigns = async () => {
    try {
      const res = await api.get('/designs');
      setUserDesigns(res.data.designs.filter((d) => d.ownerId === user?.id));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadClassData();
    if (user) loadUserDesigns();
  }, [id, user]);

  const handleShareDesign = async () => {
    if (!selectedDesignId) return;
    try {
      const design = userDesigns.find((d) => d.id === selectedDesignId);
      if (!design) return;

      // Get design content
      const designRes = await api.get(`/designs/${selectedDesignId}`);
      const content = designRes.data.design.content;

      // Save as class design
      await api.post('/designs', {
        title: design.title,
        content: typeof content === 'string' ? JSON.parse(content) : content,
        classId: Number(id),
      });

      setMessage('Diseño compartido en la clase');
      setShowUploadModal(false);
      setSelectedDesignId(null);
      setComment('');
      loadClassData();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo compartir el diseño');
    }
  };

  const handleLeaveClass = async () => {
    if (!window.confirm('¿Estás seguro de que quieres abandonar esta clase?')) return;
    try {
      await api.post(`/classes/leave`, { classId: id });
      navigate('/classes');
    } catch (err) {
      setError('No se pudo abandonar la clase');
    }
  };

  const handleJoinClass = async () => {
    try {
      await api.post(`/classes/join`, { code: classInfo.code });
      loadClassData();
    } catch (err) {
      setError('No se pudo unir a la clase');
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/classes/${id}/comments`, { content: commentText });
      loadClassData(); // Refresh to see the new comment
      setCommentText('');
    } catch (err) {
      setError('No se pudo publicar el comentario');
    }
  };

  const handleCopyDesign = async (designId) => {
    try {
      await api.post(`/designs/${designId}/copy`);
      setMessage('Diseño copiado a tus diseños personales');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo copiar el diseño');
    }
  };

  const togglePost = (designId) => {
    setCollapsedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(designId)) {
        next.delete(designId);
      } else {
        next.add(designId);
      }
      return next;
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!classInfo) {
    return (
      <section className="page-container">
        <p>{error || 'Cargando...'}</p>
      </section>
    );
  }

  return (
    <section className="page-container" id="class-detail-page">
      {/* ── Header ── */}
      <div className="class-detail-header">
        <h1>
          <button
            className="small-button"
            onClick={() => navigate('/classes')}
            style={{ marginRight: '0.75rem' }}
            id="btn-back-classes"
          >
            <ArrowLeft /> Volver
          </button>
          {classInfo.code && <span className="badge" style={{ marginRight: '0.5rem', fontSize: '1rem', padding: '0.3rem 0.8rem' }}>#{classInfo.code}</span>}
          Clase
        </h1>
        <div className="class-header-actions">
          {classInfo && (
            classInfo.joined ? (
              <button className="danger-button" onClick={handleLeaveClass} id="btn-leave-class">
                Abandonar clase
              </button>
            ) : (
              user?.id !== classInfo.ownerId && (
                <button className="primary-button" onClick={handleJoinClass} id="btn-join-class">
                  Unirse a clase
                </button>
              )
            )
          )}
        </div>
      </div>

      {/* ── Class Info Card ── */}
      <div className="class-detail-info">
        <div className="class-detail-avatar">
          {classInfo.title.charAt(0).toUpperCase()}
        </div>
        <div className="class-detail-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            {classInfo.code && <span className="badge" style={{ marginTop: 0, fontSize: '0.8rem' }}>{classInfo.code}</span>}
            <h2 style={{ marginBottom: 0 }}>{classInfo.title}</h2>
          </div>
          <p>{classInfo.ownerName}</p>
        </div>
      </div>

      {/* ── Messages ── */}
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {/* ── Publications Section ── */}
      <h3 className="class-section-title">Publicaciones de la clase</h3>

      <div className="posts-feed">
        {designs.length === 0 ? (
          <div className="classes-empty" style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'rgba(27,23,23,0.5)', margin: 0 }}>
              No hay publicaciones en esta clase aún.
            </p>
          </div>
        ) : (
          designs.map((design) => {
            const isCollapsed = collapsedPosts.has(design.id);
            return (
              <article key={design.id} className="post-card" id={`post-${design.id}`}>
                {/* Post header */}
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
                  <button className="post-toggle" onClick={() => togglePost(design.id)}>
                    {isCollapsed ? <ChevronDown /> : <ChevronUp />}
                  </button>
                </div>

                {!isCollapsed && (
                  <>
                    {/* Post body */}
                    <div className="post-body">
                      <p><strong>{design.title}</strong></p>
                    </div>

                    {/* Post image placeholder */}
                    <div className="post-image">
                      <div className="post-image-placeholder">
                        <ImageIcon />
                      </div>
                    </div>

                    {/* Post actions */}
                    <div className="post-actions">
                      <button
                        className="post-action-btn"
                        onClick={async () => {
                          try {
                            await handleCopyDesign(design.id);
                            alert('Diseño copiado con éxito a tus diseños personales');
                          } catch (err) {
                            alert('Error al copiar: ' + (err.response?.data?.error || err.message));
                          }
                        }}
                        id={`copy-design-${design.id}`}
                      >
                        <CommentIcon /> Copiar Diseño
                      </button>
                      <button
                        className="post-action-btn"
                        onClick={() => {
                          console.log('Navigating to editor for design:', design.id);
                          navigate(`/editor/${design.id}`);
                        }}
                        style={{ background: 'var(--dark)', color: 'var(--cream)', borderColor: 'var(--dark)' }}
                      >
                        <SmallImageIcon /> Ver Diseño
                      </button>
                      <div className="post-action-date">
                        <ClockIcon />
                        {new Date(design.createdAt).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  </>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* ── Comments Section ── */}
      {comments.length > 0 && (
        <div className="comments-section" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--dark)' }}>Conversación</h4>
          <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.map((c) => (
              <div key={c.id} className="comment-bubble-wrapper" style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="comment-avatar-tiny" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--dark-soft)', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                  {getInitials(c.authorName)}
                </div>
                <div className="comment-bubble" style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '18px', borderTopLeftRadius: '4px', maxWidth: '80%' }}>
                  <div className="comment-author" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', marginBottom: '0.2rem' }}>{c.authorName}</div>
                  <div className="comment-text" style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>{c.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Share / Upload design bar ── */}
      <div className="comment-input-row" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--cream-dim)', padding: '0.5rem 1rem' }}>
        <div className="comment-avatar">
          {user ? getInitials(`${user.firstName} ${user.lastName}`) : '?'}
        </div>
        <input
          type="text"
          placeholder="Escribe un mensaje o duda..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
          id="class-comment-input"
          style={{ flex: 1, border: 'none', outline: 'none', padding: '0.5rem' }}
        />
        <div className="comment-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className="secondary-button" 
            onClick={handlePostComment} 
            title="Enviar mensaje"
            style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
          >
            <SendIcon />
          </button>
          {user?.role === 'teacher' && (
            <button
              className="primary-button"
              onClick={() => {
                setShowUploadModal(true);
                loadUserDesigns();
              }}
              style={{ whiteSpace: 'nowrap' }}
              id="btn-open-upload"
            >
              <UploadIcon /> Subir Diseño
            </button>
          )}
        </div>
      </div>

      {/* ── Upload Design Modal ── */}
      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
          id="upload-modal-overlay"
        >
          <div
            className="modal upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Subir Diseño</h2>
              <button
                className="primary-button"
                onClick={handleShareDesign}
                disabled={!selectedDesignId}
                style={{ opacity: selectedDesignId ? 1 : 0.5 }}
                id="btn-share-design"
              >
                <UploadIcon /> Subir Diseño
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontWeight: 600, marginBottom: '0.65rem', color: 'var(--dark)' }}>
                Mis Diseños
              </p>
              <div className="upload-designs-grid">
                {userDesigns.length === 0 ? (
                  <p className="small-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem 0' }}>
                    No tienes diseños para compartir.
                  </p>
                ) : (
                  userDesigns.map((d) => (
                    <div
                      key={d.id}
                      className={`upload-design-item ${selectedDesignId === d.id ? 'selected' : ''}`}
                      onClick={() => setSelectedDesignId(d.id)}
                      id={`upload-item-${d.id}`}
                    >
                      <div className="upload-design-thumb">
                        <SmallImageIcon />
                      </div>
                      <div className="upload-design-name">{d.title}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comment row at bottom */}
            <div className="comment-input-row">
              <div className="comment-avatar">
                {user ? getInitials(`${user.firstName} ${user.lastName}`) : '?'}
              </div>
              <input
                type="text"
                placeholder="Agregar comentario..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                id="upload-comment-input"
              />
              <button
                className="comment-send-btn"
                onClick={handleShareDesign}
                id="btn-send-upload"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
