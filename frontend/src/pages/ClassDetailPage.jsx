/**

 * Detalle de una clase (ruta /classes/:id): banner, publicaciones, comentarios,

 * modal para compartir diseños del profesor.

 */

import { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import api from '../api.js';

import { useAuth } from '../AuthContext.jsx';



import Icon from '../components/Icon.jsx';

import ClassPost from '../components/ClassPost';

import ClassConfirmModal from '../components/ClassConfirmModal.jsx';

import AppConfirmModal from '../components/AppConfirmModal.jsx';

import { useToast } from '../ToastContext.jsx';

import { ClassDetailSkeleton } from '../components/skeletons/PageSkeletons.jsx';



function sameId(a, b) {

  if (a == null || b == null) return false;

  return Number(a) === Number(b);

}



export default function ClassDetailPage() {

  const { id } = useParams();

  const { user } = useAuth();

  const { showError, showMessage } = useToast();

  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [designs, setDesigns] = useState([]);

  const [comments, setComments] = useState([]);

  const [userDesigns, setUserDesigns] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedDesignId, setSelectedDesignId] = useState(null);

  const [collapsedPosts, setCollapsedPosts] = useState(new Set());

  const [showClassMenu, setShowClassMenu] = useState(false);

  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({

    show: false,

    type: '',

    targetId: null,

    userId: null,

    highlightName: '',

  });

  const [confirmBusy, setConfirmBusy] = useState(false);

  const [copyingDesignId, setCopyingDesignId] = useState(null);

  const [copiedDesignIds, setCopiedDesignIds] = useState(() => new Set());



  const closeConfirm = () => {

    if (confirmBusy) return;

    setConfirmModal({

      show: false, type: '', targetId: null, userId: null, highlightName: '',

    });

  };



  const triggerConfirm = (type, targetId = null, userId = null, highlightName = '') => {

    setConfirmModal({ show: true, type, targetId, userId, highlightName });

  };



  const loadClassData = async () => {

    setLoading(true);

    try {

      const res = await api.get(`/classes/${id}`);

      setClassInfo(res.data.class);

    } catch {

      setLoading(false);

      return;

    }



    try {

      const designsRes = await api.get(`/classes/${id}/designs`);

      setDesigns(designsRes.data.designs || []);

      setComments(designsRes.data.comments || []);

    } catch {

      // El interceptor global ya muestra el toast de error.

    } finally {

      setLoading(false);

    }

  };



  const loadUserDesigns = async () => {

    if (!user?.id) return;

    try {

      const res = await api.get('/designs');

      const mine = (res.data.designs || []).filter((d) => sameId(d.ownerId, user.id));

      setUserDesigns(mine);

      const alreadyCopied = new Set(

        mine

          .filter((d) => d.isCopy && d.originalId != null)

          .map((d) => Number(d.originalId)),

      );

      setCopiedDesignIds(alreadyCopied);

    } catch {

      // El interceptor global ya muestra el toast de error.

    }

  };



  useEffect(() => {

    loadClassData();

    if (user) loadUserDesigns();

  }, [id, user]);



  const handleSelectDesign = (designId) => {

    setSelectedDesignId((prev) => (prev === designId ? null : designId));

  };



  const handleModalPublish = async () => {

    if (!selectedDesignId) {

      showError('Selecciona un diseño para compartir');

      return;

    }

    try {

      await api.put(`/designs/${selectedDesignId}`, {

        classId: Number(id),

      });

      showMessage('Diseño compartido en la clase');

      setSelectedDesignId(null);

      setShowUploadModal(false);

      loadClassData();

    } catch {

      // El interceptor global ya muestra el toast de error.

    }

  };



  const handlePostDesignComment = async (designId, content) => {

    await api.post(`/classes/${id}/comments`, { designId, content });

    showMessage('Comentario publicado');

    loadClassData();

  };



  const handleLeaveClass = () => {

    setLeaveConfirmOpen(true);

  };



  const confirmLeave = async () => {

    try {

      await api.post(`/classes/leave`, { classId: id });

      navigate('/classes');

    } catch {

      setLeaveConfirmOpen(false);

    }

  };



  const handleJoinClass = async () => {

    try {

      await api.post(`/classes/join`, { code: classInfo.code });

      loadClassData();

    } catch {

      // El interceptor global ya muestra el toast de error.

    }

  };



  const handleCopyDesign = async (designId) => {

    const sourceId = Number(designId);

    if (copiedDesignIds.has(sourceId)) {

      showError('Ya copiaste este diagrama');

      return;

    }

    if (copyingDesignId === sourceId) return;



    setCopyingDesignId(sourceId);

    try {

      await api.post(`/designs/${designId}/copy`);

      setCopiedDesignIds((prev) => new Set([...prev, sourceId]));

      showMessage('Diseño copiado a tus diseños personales');

      loadUserDesigns();

    } catch (err) {

      const message = err?.response?.data?.error;

      if (message) showError(message);

    } finally {

      setCopyingDesignId(null);

    }

  };



  const handleViewDesign = (designId, ownerId) => {

    if (sameId(ownerId, user?.id) || user?.role === 'superadmin') {

      navigate(`/editor/${designId}`);

      return;

    }

    navigate(`/view/${designId}`);

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

    triggerConfirm('post', designId);

  };



  const handleDeleteComment = (commentId) => {

    triggerConfirm('comment', commentId);

  };



  const handleExpelStudent = (studentUserId, studentName) => {

    triggerConfirm('expel', null, studentUserId, studentName);

  };



  const confirmModalVariant = (type) => {

    if (type === 'post') return 'deletePost';

    if (type === 'comment') return 'deleteComment';

    if (type === 'class') return 'deleteClass';

    return type;

  };



  const confirmAction = async () => {

    const { type, targetId, userId: targetUserId } = confirmModal;

    setConfirmBusy(true);

    try {

      if (type === 'post') {

        await api.put(`/designs/${targetId}`, { classId: null });

        showMessage('Publicación eliminada de la clase');

      } else if (type === 'comment') {

        await api.delete(`/comments/${targetId}`);

        showMessage('Comentario eliminado');

      } else if (type === 'expel') {

        await api.post(`/classes/${id}/expel`, { userId: targetUserId });

        showMessage('Estudiante expulsado de la clase');

      } else if (type === 'class') {

        await api.delete(`/classes/${targetId ?? id}`);

        navigate('/classes');

        return;

      }

      loadClassData();

    } catch {

      // El interceptor global ya muestra el toast de error.

    } finally {

      setConfirmBusy(false);

      closeConfirm();

    }

  };



  const getInitials = (name) => {

    if (!name) return '?';

    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  };



  const commentsForDesign = (designId) => comments.filter((c) => sameId(c.designId, designId));



  if (loading) {

    return <ClassDetailSkeleton />;

  }



  if (!classInfo) {

    return null;

  }



  const isTeacher = user?.role === 'teacher';

  const isClassOwner = sameId(user?.id, classInfo.ownerId) || classInfo.isOwner;

  const canSeeCode = isTeacher || isClassOwner || user?.role === 'superadmin';

  const canDeleteClass =

    user?.role === 'superadmin'

    || user?.role === 'admin'

    || (isTeacher && isClassOwner);

  const canLeaveClass = classInfo.joined && !canDeleteClass && !isClassOwner;

  const canPublishToClass =

    (isTeacher || user?.role === 'superadmin')

    && (isClassOwner || Boolean(classInfo.joined));

  const canExpelStudents = (isTeacher && isClassOwner) || user?.role === 'superadmin';

  const canCommentOnPosts = Boolean(classInfo.joined || isClassOwner || user?.role === 'superadmin');



  const openUploadModal = () => {

    setShowUploadModal(true);

    loadUserDesigns();

  };



  return (

    <section className="figma-sector class-detail-sector" id="class-detail-page">

      <div className="figma-sector-inner">

      <article className="class-detail-banner figma-dot-pattern">

        <div className="class-detail-banner__bookmark" aria-hidden>

          <Icon name="bookmark" size={22} />

        </div>

        <div className="class-detail-banner__menu-wrap">

          <button

            type="button"

            className={`class-detail-banner__menu${showClassMenu ? ' class-detail-banner__menu--open' : ''}`}

            onClick={() => setShowClassMenu((v) => !v)}

            aria-label="Opciones de la clase"

            aria-expanded={showClassMenu}

            aria-haspopup="menu"

          >

            <Icon name="dots" size={18} />

          </button>

          {showClassMenu && (

            <div className="class-detail-banner__popover" role="menu">

              {canDeleteClass && (

                <button

                  type="button"

                  className="class-detail-banner__popover-btn"

                  role="menuitem"

                  onClick={() => {

                    setShowClassMenu(false);

                    triggerConfirm('class', Number(id), null, classInfo.title);

                  }}

                >

                  Eliminar clase

                </button>

              )}

              {canLeaveClass && (

                <button

                  type="button"

                  className="class-detail-banner__popover-btn"

                  role="menuitem"

                  onClick={() => { setShowClassMenu(false); handleLeaveClass(); }}

                >

                  Abandonar clase

                </button>

              )}

              {!classInfo.joined && !canDeleteClass && !isClassOwner && (

                <button

                  type="button"

                  className="class-detail-banner__popover-btn"

                  role="menuitem"

                  onClick={() => { setShowClassMenu(false); handleJoinClass(); }}

                >

                  Unirse a la clase

                </button>

              )}

            </div>

          )}

        </div>

        <div className="class-detail-banner__foot">

          <div className="class-detail-banner__info">

            <h1>{classInfo.title}</h1>

            <p>{classInfo.ownerName}</p>

          </div>

          {canSeeCode && (

            <div className="class-detail-banner__code">

              <span className="class-detail-banner__code-label">Código</span>

              {classInfo.code && (

                <span className="class-detail-banner__code-value">{classInfo.code}</span>

              )}

            </div>

          )}

        </div>

      </article>



      <div className="class-detail-section-head">

        <h2 className="class-section-title">Publicaciones de la clase</h2>

        {canExpelStudents && (

          <button

            type="button"

            className="class-detail-section-head__icon class-detail-section-head__icon--btn"

            onClick={() => navigate(`/classes/${id}/members`)}

            aria-label="Ver miembros de la clase"

          >

            <Icon name="usersGroup" size={26} />

          </button>

        )}

      </div>

      <hr className="class-detail-section-rule" />



      {canPublishToClass && (

        <button

          type="button"

          className="class-upload-trigger"

          onClick={openUploadModal}

          id="btn-upload-class-post"

        >

          <span className="class-upload-trigger__icon" aria-hidden>

            <Icon name="filePlus" size={22} />

          </span>

          <span className="class-upload-trigger__text">Subir publicación a clase</span>

        </button>

      )}



      <div className="posts-feed class-detail-posts">

        {designs.length === 0 ? (

          <div className="class-posts-empty figma-dot-pattern">

            <p>No hay publicaciones en esta clase aún.</p>

          </div>

        ) : (

          designs.map((design) => (

            <ClassPost

              key={design.id}

              design={{ ...design, classOwnerId: classInfo.ownerId }}

              comments={commentsForDesign(design.id)}

              isCollapsed={collapsedPosts.has(design.id)}

              togglePost={togglePost}

              canExpelStudent={canExpelStudents}

              handleExpel={handleExpelStudent}

              handleCopy={handleCopyDesign}

              handleDelete={handleDeletePost}

              handleView={handleViewDesign}

              handlePostComment={canCommentOnPosts ? handlePostDesignComment : undefined}

              handleDeleteComment={handleDeleteComment}

              canComment={canCommentOnPosts}

              currentUser={user}

              getInitials={getInitials}

              alreadyCopied={copiedDesignIds.has(Number(design.id))}

              isCopying={copyingDesignId === Number(design.id)}

            />

          ))

        )}

      </div>



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

            </header>



            <div className="figma-designs-modal__body">

              {userDesigns.length === 0 ? (

                <div className="figma-designs-modal__empty figma-dot-pattern">

                  <Icon name="image" size={48} strokeWidth={1.2} />

                  <p>No tienes diseños para compartir. Crea uno desde la sección Diseños.</p>

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



            <footer className="figma-designs-modal__footer figma-designs-modal__footer--publish-only">

              <p className="figma-designs-modal__publish-hint">

                {selectedDesignId

                  ? `Publicar: ${userDesigns.find((d) => d.id === selectedDesignId)?.title || 'diseño seleccionado'}`

                  : 'Selecciona un diseño de la grilla para publicarlo en la clase'}

              </p>

              <button

                type="button"

                className="primary-button figma-designs-modal__publish-btn"

                onClick={handleModalPublish}

                disabled={!selectedDesignId}

                id="btn-modal-publish-class"

              >

                Publicar en clase

              </button>

            </footer>

          </div>

        </div>

      )}

      <AppConfirmModal

        open={leaveConfirmOpen}

        variant="leaveClass"

        highlightName={classInfo?.title ?? ''}

        onClose={() => setLeaveConfirmOpen(false)}

        onConfirm={confirmLeave}

        titleId="leave-class-confirm-title"

      />

      <ClassConfirmModal

        open={confirmModal.show}

        variant={confirmModalVariant(confirmModal.type)}

        highlightName={confirmModal.highlightName}

        onClose={closeConfirm}

        onConfirm={confirmAction}

        busy={confirmBusy}

      />

      </div>

    </section>

  );

}


