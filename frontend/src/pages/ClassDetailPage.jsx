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
        image: designRes.data.design.image, // Use image from design details
        classId: Number(id),
      });

      // If there's a comment in the modal, post it too
      if (modalComment.trim()) {
        await api.post(`/classes/${id}/comments`, { content: modalComment });
      }

      setMessage('Diseño compartido en la clase');
      setShowUploadModal(false);
      setSelectedDesignId(null);
      setModalComment('');
      loadClassData();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo compartir el diseño');
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
        await api.delete(`/designs/${id}`);
        setMessage('Publicación eliminada');
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
          <h2 style={{ marginBottom: '0.2rem' }}>{classInfo.title}</h2>
          <p style={{ marginBottom: '0.4rem', color: 'rgba(27,23,23,0.6)' }}>{classInfo.ownerName}</p>
          {(user?.role === 'teacher' || user?.id == classInfo.ownerId) && (
            <span className="badge" style={{ marginTop: '0.5rem', fontSize: '1rem', background: '#f8d7da', color: '#842029', border: 'none', borderRadius: '999px', padding: '0.4rem 1.25rem', width: 'fit-content', display: 'inline-flex', alignItems: 'center', fontWeight: 'bold' }}>
              Código: {classInfo.code}
            </span>
          )}
        </div>
      </div>

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
          <div className="classes-empty" style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'rgba(27,23,23,0.5)', margin: 0 }}>
              No hay publicaciones en esta clase aún.
            </p>
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
              currentUser={user}
              navigate={navigate}
              getInitials={getInitials}
            />
          ))
        )}
      </div>

      {/* ── Comments Section ── */}
      {comments.length > 0 && (
        <div className="comments-section" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--dark)' }}>Conversación</h4>
          <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.map((c) => {
              const isOwner = c.userId === user?.id;
              const isAdmin = user?.role === 'superadmin';
              const isTeacher = user?.role === 'teacher';
              const targetIsStudent = c.authorRole === 'student';
              const canDelete = isAdmin || isOwner || (isTeacher && targetIsStudent);

              return (
                <div key={c.id} className="comment-bubble-wrapper" style={{ display: 'flex', gap: '0.75rem', group: 'true' }}>
                  <div className="comment-avatar-tiny" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--dark-soft)', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(c.authorName)}
                  </div>
                  <div className="comment-bubble" style={{ background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '18px', borderTopLeftRadius: '4px', maxWidth: '80%', position: 'relative' }}>
                    <div className="comment-author" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                      {c.authorName}
                      {canDelete && (
                        <button 
                          onClick={() => handleDeleteComment(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.2)', padding: '0 4px', fontSize: '10px' }}
                          title="Eliminar comentario"
                        >
                          <Icon name="close" size={10} />
                        </button>
                      )}
                    </div>
                    <div className="comment-text" style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>{c.content}</div>
                  </div>
                </div>
              );
            })}
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
            className="primary-button"
            onClick={handlePostComment}
            title="Enviar mensaje"
            style={{ padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}
          >
            <SendIcon /> Enviar
          </button>
          {user?.role === 'teacher' && (
            <button
              className="secondary-button"
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
                        {d.image ? (
                          <img src={d.image} alt={d.title} className="design-thumb-img" />
                        ) : (
                          <SmallImageIcon />
                        )}
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
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
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
    </section>
  );
}
