/**
 * Detalle de una clase (ruta /classes/:id): banner, publicaciones, comentarios,
 * modal para compartir diseños del profesor.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

import {
  ArrowLeft, ImageIcon, SmallImageIcon, CommentIcon, UploadIcon, ClockIcon,
  SendIcon, ChevronUp, ChevronDown, TrashIcon, BookIcon, PlusIcon, ArrowIcon
} from '../components/EditorUI.jsx';
import Icon from '../components/Icon.jsx';
import ClassPost from '../components/ClassPost';

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
  const [modalComment, setModalComment] = useState('');
  const [collapsedPosts, setCollapsedPosts] = useState(new Set());
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', id: null, title: '', message: '' });

  const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

  const triggerConfirm = (type, id, title, message) => {
    setConfirmModal({ show: true, type, id, title, message });
  };

  const loadClassData = async () => {
    try {
      const res = await api.get(`/classes/${id}`);
      setClassInfo(res.data.class);

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

  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => { setMessage(''); setError(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

  const handleSelectDesign = (designId) => {
    setSelectedDesignId((prev) => (prev === designId ? null : designId));
  };

  const handleModalPublish = async () => {
    if (!selectedDesignId) {
      setError('Selecciona un diseño para compartir');
      return;
    }
    try {
      await api.put(`/designs/${selectedDesignId}`, {
        classId: Number(id),
        description: modalComment.trim() || null,
      });
      setMessage('Diseño compartido en la clase');
      setSelectedDesignId(null);
      setModalComment('');
      setShowUploadModal(false);
      loadClassData();
    } catch (err) {
      setError('No se pudo compartir el diseño');
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() && !selectedDesignId) return;
    
    try {
      if (selectedDesignId) {
        // Compartir diseño con descripción (comentario)
        await api.put(`/designs/${selectedDesignId}`, {
          classId: Number(id),
          description: commentText.trim() || null
        });
        setMessage('Diseño compartido en la clase');
        setSelectedDesignId(null);
      } else {
        // Solo comentario regular
        await api.post(`/classes/${id}/comments`, { content: commentText });
        setMessage('Mensaje publicado');
      }
      
      setCommentText('');
      loadClassData();
    } catch (err) {
      setError('No se pudo realizar la publicación');
    }
  };

  const handleLeaveClass = () => {
    setShowLeaveModal(true);
  };

  const confirmLeave = async () => {
    try {
      await api.post(`/classes/leave`, { classId: id });
      navigate('/classes');
    } catch (err) {
      setError('No se pudo abandonar la clase');
      setShowLeaveModal(false);
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

  const handleDeletePost = (designId) => {
    triggerConfirm('post', designId, '¿Eliminar publicación?', 'Esta acción eliminará el diseño compartido de forma permanente.');
  };

  const handleDeleteComment = (commentId) => {
    triggerConfirm('comment', commentId, '¿Eliminar comentario?', '¿Estás seguro de que deseas eliminar este mensaje?');
  };

  const confirmAction = async () => {
    const { type, id } = confirmModal;
    try {
      if (type === 'post') {
        // En lugar de borrar el diseño, le quitamos el ID de la clase
        await api.put(`/designs/${id}`, { classId: null });
        setMessage('Publicación eliminada de la clase');
      } else if (type === 'comment') {
        await api.delete(`/comments/${id}`);
        setMessage('Comentario eliminado');
      }
      loadClassData();
    } catch (err) {
      setError(`No se pudo eliminar ${type === 'post' ? 'la publicación' : 'el comentario'}`);
    } finally {
      closeConfirm();
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!classInfo) {
    return (
      <section className="figma-sector class-detail-sector">
        <div className="figma-sector-inner">
          <p className="class-detail-loading">{error || 'Cargando...'}</p>
        </div>
      </section>
    );
  }

  const canSeeCode = user?.role === 'teacher' || user?.id === classInfo.ownerId;

  return (
    <section className="figma-sector class-detail-sector" id="class-detail-page">
      <div className="figma-sector-inner">
      <button
        type="button"
        className="class-detail-back"
        onClick={() => navigate('/classes')}
        id="btn-back-classes"
      >
        <ArrowLeft /> Volver
      </button>

      <article className="class-detail-banner">
        <div className="class-detail-banner__menu-wrap">
          <button
            type="button"
            className="class-detail-banner__menu"
            onClick={() => setShowClassMenu((v) => !v)}
            aria-label="Opciones de la clase"
            aria-expanded={showClassMenu}
          >
            <Icon name="dots" size={18} />
          </button>
          {showClassMenu && (
            <div className="class-detail-banner__dropdown" role="menu">
              {classInfo.joined ? (
                <button type="button" role="menuitem" onClick={() => { setShowClassMenu(false); handleLeaveClass(); }}>
                  Abandonar clase
                </button>
              ) : (
                user?.id !== classInfo.ownerId && (
                  <button type="button" role="menuitem" onClick={() => { setShowClassMenu(false); handleJoinClass(); }}>
                    Unirse a la clase
                  </button>
                )
              )}
            </div>
          )}
        </div>
        <div className="class-detail-banner__media figma-dot-pattern" aria-hidden>
          <Icon name="classBook" size={40} className="class-list-card-book-icon" />
        </div>
        <div className="class-detail-banner__body">
          <h1>{classInfo.title}</h1>
          <p>{classInfo.ownerName}</p>
          {canSeeCode && classInfo.code && (
            <span className="class-detail-code-badge">Código: {classInfo.code}</span>
          )}
        </div>
      </article>

      {/* ── Toast Notifications ── */}
      <div className="toast-container">
        {message && (
          <div className="toast success-toast">
            <div className="toast-icon">✓</div>
            <div className="toast-content">{message}</div>
            <button className="toast-close" onClick={() => setMessage('')}><Icon name="close" size={14} /></button>
          </div>
        )}
        {error && (
          <div className="toast error-toast">
            <div className="toast-icon">!</div>
            <div className="toast-content">{error}</div>
            <button className="toast-close" onClick={() => setError('')}><Icon name="close" size={14} /></button>
          </div>
        )}
      </div>

      {/* ── Publications Section ── */}
      <h3 className="class-section-title">Publicaciones de la clase</h3>

      <div className="posts-feed">
        {designs.length === 0 ? (
          <div className="class-posts-empty figma-dot-pattern">
            <p>No hay publicaciones en esta clase aún.</p>
          </div>
        ) : (
          designs.map((design) => (
            <ClassPost
              key={design.id}
              design={design}
              isCollapsed={collapsedPosts.has(design.id)}
              togglePost={togglePost}
              handleCopy={async (id) => {
                try {
                  await handleCopyDesign(id);
                  setMessage('Diseño copiado con éxito a tus diseños personales');
                } catch (err) {
                  setError('Error al copiar: ' + (err.response?.data?.error || err.message));
                }
              }}
              handleDelete={handleDeletePost}
              handleView={(designId) => navigate(`/editor/${designId}`)}
              currentUser={user}
              getInitials={getInitials}
            />
          ))
        )}
      </div>

      {comments.length > 0 && (
        <div className="figma-class-comments">
          {comments.map((c) => {
            const isOwner = c.userId === user?.id;
            const isAdmin = user?.role === 'superadmin';
            const isTeacher = user?.role === 'teacher';
            const targetIsStudent = c.authorRole === 'student';
            const canDelete = isAdmin || isOwner || (isTeacher && targetIsStudent);

            return (
              <article key={c.id} className="figma-class-comment">
                <div className="figma-class-post__avatar">{getInitials(c.authorName)}</div>
                <div className="figma-class-comment__bubble">
                  <div className="figma-class-comment__top">
                    <span className="figma-class-post__name">{c.authorName}</span>
                    {canDelete && (
                      <button
                        type="button"
                        className="figma-class-post__icon-btn"
                        onClick={() => handleDeleteComment(c.id)}
                        title="Eliminar comentario"
                        aria-label="Eliminar comentario"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                  <p>{c.content}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className={`class-composer figma-class-composer ${selectedDesignId ? 'has-attachment' : ''}`}>
        <div className="class-composer-avatar">
          {user ? getInitials(`${user.firstName} ${user.lastName}`) : '?'}
        </div>
        <div className="class-composer-field">
          {selectedDesignId && (
            <div className="class-composer-attachment">
              <Icon name="image" size={12} />
              <span>Diseño adjunto: {userDesigns.find((d) => d.id === selectedDesignId)?.title}</span>
              <button type="button" onClick={() => setSelectedDesignId(null)} aria-label="Quitar diseño">
                <Icon name="close" size={12} />
              </button>
            </div>
          )}
          <input
            type="text"
            className="class-composer-input"
            placeholder={
              selectedDesignId
                ? 'Añade una descripción a tu diseño...'
                : 'Subir comentario / diseño'
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            id="class-comment-input"
          />
        </div>
        <div className="class-composer-actions">
          {user?.role === 'teacher' && (
            <button
              type="button"
              className={`class-composer-upload ${selectedDesignId ? 'active' : ''}`}
              onClick={() => {
                setShowUploadModal(true);
                loadUserDesigns();
              }}
              title="Adjuntar diseño"
              id="btn-open-upload"
            >
              <UploadIcon />
            </button>
          )}
          <button
            type="button"
            className="class-composer-send primary-button"
            onClick={handlePostComment}
            title="Enviar"
            id="btn-send-post"
          >
            <SendIcon /> Enviar
          </button>
        </div>
      </div>

      {/* ── Upload Design Modal ── */}
      {showUploadModal && (
        <div
          className="modal-overlay figma-modal-overlay"
          onClick={() => setShowUploadModal(false)}
          id="upload-modal-overlay"
        >
          <div
            className="modal figma-designs-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="figma-designs-modal-title"
          >
            <button
              type="button"
              className="modal-close figma-designs-modal__close"
              onClick={() => setShowUploadModal(false)}
              aria-label="Cerrar"
            >
              <Icon name="close" size={18} />
            </button>

            <header className="figma-designs-modal__header">
              <h2 id="figma-designs-modal-title">Mis diseños</h2>
              <button
                type="button"
                className="primary-button figma-designs-modal__upload-btn"
                onClick={() => {
                  setShowUploadModal(false);
                  navigate('/editor');
                }}
                id="btn-modal-new-design"
              >
                <Icon name="upload" size={18} strokeWidth={2} />
                Subir diseño
              </button>
            </header>

            <div className="figma-designs-modal__body">
              {userDesigns.length === 0 ? (
                <div className="figma-designs-modal__empty figma-dot-pattern">
                  <Icon name="image" size={48} strokeWidth={1.2} />
                  <p>No tienes diseños para compartir. Crea uno con «Subir diseño».</p>
                </div>
              ) : (
                <div className="figma-designs-modal__grid">
                  {userDesigns.map((d) => (
                    <article
                      key={d.id}
                      className={`figma-card figma-card--compact${selectedDesignId === d.id ? ' is-selected' : ''}`}
                      id={`upload-item-${d.id}`}
                    >
                      <button
                        type="button"
                        className="figma-card-media figma-dot-pattern"
                        onClick={() => handleSelectDesign(d.id)}
                        aria-pressed={selectedDesignId === d.id}
                      >
                        {d.image ? (
                          <img src={d.image} alt="" className="design-thumb-img" />
                        ) : (
                          <Icon name="image" size={36} strokeWidth={1.25} />
                        )}
                      </button>
                      <div className="figma-card-foot">
                        <h3 className="figma-card-title" title={d.title}>{d.title}</h3>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <footer className="figma-designs-modal__footer">
              <div className="figma-designs-modal__avatar" aria-hidden>
                {user ? getInitials(`${user.firstName} ${user.lastName}`) : '?'}
              </div>
              <input
                type="text"
                className="figma-designs-modal__input"
                placeholder="Agregar comentario..."
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleModalPublish()}
                id="modal-design-comment"
              />
              <button
                type="button"
                className="figma-designs-modal__send"
                onClick={handleModalPublish}
                title="Publicar diseño"
                aria-label="Publicar diseño"
                id="btn-modal-publish-design"
              >
                <Icon name="send" size={20} strokeWidth={2} />
              </button>
            </footer>
          </div>
        </div>
      )}
      {/* ── Leave Class Modal ── */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal modal-danger" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#fee2e2', color: '#dc2626', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrashIcon />
                </div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--dark)' }}>¿Abandonar clase?</h2>
              </div>
              <button className="modal-close" onClick={() => setShowLeaveModal(false)}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--dark-soft)', lineHeight: '1.5', margin: '0' }}>
                Ya no podrás ver los diseños compartidos ni participar en la conversación de <strong>{classInfo?.title}</strong>.
              </p>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="secondary-button" onClick={() => setShowLeaveModal(false)} style={{ border: 'none' }}>
                Cancelar
              </button>
              <button
                className="primary-button"
                onClick={confirmLeave}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                Abandonar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Confirm Modal (Premium Design) ── */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={closeConfirm} style={{ zIndex: 1000 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header" style={{ border: 'none', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#fee2e2', color: '#dc2626', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="trash" size={20} />
                </div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{confirmModal.title}</h2>
              </div>
            </div>
            <div className="modal-body" style={{ paddingTop: '0.5rem' }}>
              <p style={{ margin: 0, color: 'var(--dark-soft)', fontSize: '0.95rem' }}>{confirmModal.message}</p>
            </div>
            <div className="modal-footer" style={{ border: 'none', paddingTop: '0' }}>
              <button className="secondary-button" onClick={closeConfirm} style={{ border: 'none', background: 'transparent' }}>
                Cancelar
              </button>
              <button 
                className="primary-button" 
                onClick={confirmAction}
                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff', padding: '0.6rem 1.5rem' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
