/**
 * Miembros de la clase (ruta /classes/:id/members): lista de alumnos y expulsión.
 * Solo accesible para el profesor dueño o superadmin.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Icon from '../components/Icon.jsx';
import AppToast from '../components/AppToast.jsx';
import ClassConfirmModal from '../components/ClassConfirmModal.jsx';

function sameId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

export default function ClassMembersPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: '',
    userId: null,
    name: '',
  });
  const [confirmBusy, setConfirmBusy] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const loadData = async () => {
    try {
      const res = await api.get(`/classes/${id}/members`);
      setClassInfo(res.data.class);
      setMembers(res.data.members || []);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudieron cargar los miembros';
      setError(msg);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate(`/classes/${id}`, { replace: true });
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => { setMessage(''); setError(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

  const closeConfirm = () => {
    if (confirmBusy) return;
    setConfirmModal({ show: false, type: '', userId: null, name: '' });
  };

  const handleExpelClick = (memberId, memberName) => {
    setConfirmModal({ show: true, type: 'expel', userId: memberId, name: memberName });
  };

  const handleDeleteClassClick = () => {
    setShowClassMenu(false);
    setConfirmModal({ show: true, type: 'deleteClass', userId: null, name: '' });
  };

  const confirmAction = async () => {
    const { type, userId: targetUserId } = confirmModal;
    setConfirmBusy(true);
    try {
      if (type === 'expel') {
        await api.post(`/classes/${id}/expel`, { userId: targetUserId });
        setMessage('Estudiante expulsado de la clase');
        loadData();
      } else if (type === 'deleteClass') {
        await api.delete(`/classes/${id}`);
        navigate('/classes');
        return;
      }
    } catch (err) {
      if (type === 'deleteClass') {
        setError(err.response?.data?.error || 'No se pudo eliminar la clase');
      } else {
        setError(err.response?.data?.error || 'No se pudo expulsar al estudiante');
      }
    } finally {
      setConfirmBusy(false);
      closeConfirm();
    }
  };

  if (!classInfo && !error) {
    return (
      <section className="figma-sector class-detail-sector class-members-sector">
        <div className="figma-sector-inner">
          <p className="class-detail-loading">Cargando...</p>
        </div>
      </section>
    );
  }

  const isTeacher = user?.role === 'teacher';
  const isClassOwner = sameId(user?.id, classInfo?.ownerId);
  const canSeeCode = isTeacher || isClassOwner || user?.role === 'superadmin';
  const canDeleteClass =
    user?.role === 'superadmin'
    || user?.role === 'admin'
    || (isTeacher && isClassOwner);

  return (
    <section className="figma-sector class-detail-sector class-members-sector" id="class-members-page">
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
            {showClassMenu && canDeleteClass && (
              <div className="class-detail-banner__popover" role="menu">
                <button
                  type="button"
                  className="class-detail-banner__popover-btn"
                  role="menuitem"
                  onClick={handleDeleteClassClick}
                >
                  Eliminar clase
                </button>
              </div>
            )}
          </div>
          <div className="class-detail-banner__foot">
            <div className="class-detail-banner__info">
              <h1>{classInfo?.title}</h1>
              <p>{classInfo?.ownerName}</p>
            </div>
            {canSeeCode && classInfo?.code && (
              <div className="class-detail-banner__code">
                <span className="class-detail-banner__code-label">Código</span>
                <span className="class-detail-banner__code-value">{classInfo.code}</span>
              </div>
            )}
          </div>
        </article>

        <AppToast
          message={message}
          error={error}
          onCloseMessage={() => setMessage('')}
          onCloseError={() => setError('')}
        />

        <div className="class-members-section-head">
          <div className="class-members-section-head__title">
            <span className="class-members-section-head__title-icon" aria-hidden>
              <Icon name="usersGroup" size={26} />
            </span>
            <h2 className="class-section-title">Miembros de la clase</h2>
          </div>
          <button
            type="button"
            className="class-members-section-head__back"
            onClick={() => navigate(`/classes/${id}`)}
            aria-label="Ver publicaciones de la clase"
          >
            <Icon name="list" size={22} />
          </button>
        </div>
        <hr className="class-detail-section-rule" />

        <ul className="class-members-list">
          {members.length === 0 ? (
            <li className="class-members-empty figma-dot-pattern">
              <p>No hay estudiantes inscritos en esta clase.</p>
            </li>
          ) : (
            members.map((member) => (
              <li key={member.id} className="class-members-row">
                <div className="class-members-row__profile">
                  <div className="class-members-row__avatar" aria-hidden>
                    {getInitials(member.fullName)}
                  </div>
                  <span className="class-members-row__name">{member.fullName}</span>
                </div>
                <button
                  type="button"
                  className="class-members-expel-btn"
                  onClick={() => handleExpelClick(member.id, member.fullName)}
                >
                  <Icon name="circleX" size={18} />
                  <span>Expulsar de la clase</span>
                </button>
              </li>
            ))
          )}
        </ul>

        <ClassConfirmModal
          open={confirmModal.show}
          variant={confirmModal.type}
          highlightName={confirmModal.name}
          onClose={closeConfirm}
          onConfirm={confirmAction}
          busy={confirmBusy}
        />
      </div>
    </section>
  );
}
