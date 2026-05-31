import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Icon from '../components/Icon.jsx';
import ProfileSilhouette from '../components/ProfileSilhouette.jsx';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);

  const initials = `${user?.firstName || ''} ${user?.lastName || ''}`
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const loadPreviews = useCallback(async () => {
    setIsLoadingPreviews(true);

    const [designsResult, classesResult] = await Promise.allSettled([
      api.get('/designs'),
      api.get('/classes'),
    ]);

    if (designsResult.status === 'fulfilled') {
      const list = Array.isArray(designsResult.value.data?.designs)
        ? designsResult.value.data.designs
        : [];
      setDesigns(list.slice(0, 5));
    } else {
      setDesigns([]);
    }

    if (classesResult.status === 'fulfilled') {
      const list = Array.isArray(classesResult.value.data?.classes)
        ? classesResult.value.data.classes
        : [];
      setClasses(list.slice(0, 5));
    } else {
      setClasses([]);
    }

    setIsLoadingPreviews(false);
  }, []);

  useEffect(() => {
    if (user) loadPreviews();
  }, [user, loadPreviews]);

  const placeholders = Array.from({ length: 5 });

  const renderDesignCard = (design, index) => (
    <article
      key={design?.id || `design-placeholder-${index}`}
      className={`figma-card figma-card--compact account-preview-card${design ? '' : ' account-preview-card--empty'}`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <button
        type="button"
        className="figma-card-media figma-dot-pattern account-preview-card__media"
        onClick={() => design && navigate(`/editor/${design.id}`)}
        aria-label={design ? `Abrir diseño ${design.title || 'Sin título'}` : undefined}
        disabled={!design}
      >
        {design?.image ? (
          <img src={design.image} alt="" className="design-thumb-img" />
        ) : (
          <Icon name="image" size={34} strokeWidth={1.25} />
        )}
      </button>
      <div className="figma-card-foot account-preview-card__foot">
        {design ? (
          <div className="account-preview-card__text">
            <h3 className="figma-card-title" title={design.title || 'Sin título'}>
              {design.title || 'Sin título'}
            </h3>
          </div>
        ) : (
          <span className="account-preview-card__line" aria-hidden />
        )}
      </div>
    </article>
  );

  const renderClassCard = (classItem, index) => (
    <article
      key={classItem?.id || `class-placeholder-${index}`}
      className={`figma-card figma-card--compact account-preview-card account-preview-card--class${classItem ? '' : ' account-preview-card--empty'}`}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => classItem && navigate(`/classes/${classItem.id}`)}
      onKeyDown={(e) => {
        if (classItem && e.key === 'Enter') navigate(`/classes/${classItem.id}`);
      }}
      role={classItem ? 'button' : undefined}
      tabIndex={classItem ? 0 : undefined}
    >
      <div className="figma-card-media figma-dot-pattern account-preview-card__media">
        <Icon name="classBook" size={36} className="account-preview-card__book" />
      </div>
      <div className="figma-card-foot account-preview-card__foot">
        {classItem ? (
          <div className="account-preview-card__text">
            <h3 className="figma-card-title" title={classItem.title}>
              {classItem.title}
            </h3>
            <p>{classItem.ownerName ? `Prof. ${classItem.ownerName}` : 'Nombre de profesor'}</p>
          </div>
        ) : (
          <span className="account-preview-card__line" aria-hidden />
        )}
      </div>
    </article>
  );

  const designCards = designs.length > 0
    ? designs.map(renderDesignCard)
    : placeholders.map((_, index) => renderDesignCard(null, index));

  const classCards = classes.length > 0
    ? classes.map(renderClassCard)
    : placeholders.map((_, index) => renderClassCard(null, index));

  return (
    <section className="figma-sector" id="account-page">
      <div className="figma-sector-inner account-layout">
        <aside className="account-sidebar">
          <div className="account-sidebar__body">
            <div className="account-avatar">
              <div className="account-avatar-ring" aria-hidden title={initials}>
                <ProfileSilhouette size={88} className="account-avatar-svg" />
              </div>
              <div className="account-avatar-info">
                <h2>{user?.firstName} {user?.lastName}</h2>
                <p>{user?.email}</p>
                <p className="account-role">{user?.role === 'teacher' ? 'Profesor' : 'Estudiante'}</p>
              </div>
            </div>
            <button
              type="button"
              className="account-edit-button"
              onClick={() => navigate('/edit-profile')}
            >
              <Icon name="userEdit" size={19} strokeWidth={2} />
              Editar Informacion
            </button>
          </div>

          <button type="button" className="account-sidebar__collapse" aria-label="Contraer menú de cuenta">
            <Icon name="chevronRight" size={28} strokeWidth={2.5} />
          </button>

          <div className="account-sidebar__footer">
            <button
              type="button"
              className="account-session-button account-session-button--logout"
              onClick={() => setConfirmModal('logout')}
            >
              <Icon name="logout" size={18} strokeWidth={2} />
              <span>Cerrar sesión</span>
            </button>
            <button
              type="button"
              className="account-session-button account-session-button--delete"
              onClick={() => setConfirmModal('delete')}
            >
              <Icon name="userX" size={18} strokeWidth={2} />
              <span>Eliminar cuenta</span>
            </button>
            <button type="button" className="account-session-button account-session-button--help">
              <Icon name="help" size={18} strokeWidth={2} />
              <span>Ayuda</span>
            </button>
          </div>
        </aside>

        <main className="account-main">
          <section className="account-section">
            <header className="account-section-head">
              <h1>Mis diseños</h1>
              <Link to="/designs" className="account-link">Ver todo &gt;</Link>
            </header>
            <div className="account-cards-row" aria-busy={isLoadingPreviews}>
              {designCards}
            </div>
          </section>

          <section className="account-section">
            <header className="account-section-head">
              <h1>Mis clases</h1>
              <Link to="/classes" className="account-link">Ver todo &gt;</Link>
            </header>
            <div className="account-cards-row" aria-busy={isLoadingPreviews}>
              {classCards}
            </div>
          </section>
        </main>
      </div>

      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => setConfirmModal(null)}
            >
              x
            </button>
            <div className="modal-body">
              {confirmModal === 'logout' && (
                <>
                  <p>¿Está seguro que quiere cerrar sesión?</p>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirmModal(null)}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setConfirmModal(null);
                        logout();
                      }}
                    >
                      Sí
                    </button>
                  </div>
                </>
              )}
              {confirmModal === 'delete' && (
                <>
                  <p>¿Está seguro que quiere eliminar su cuenta?</p>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirmModal(null)}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={async () => {
                        try {
                          await api.delete('/auth/me');
                          logout();
                        } catch (err) {
                          console.error(err);
                          setConfirmModal(null);
                        }
                      }}
                    >
                      Sí
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
