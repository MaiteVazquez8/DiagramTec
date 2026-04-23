import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

/* ── SVG Icons ─────────────────────────────── */
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14"/><path d="M5 12h14"/>
  </svg>
);

const BookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const EmptyClassIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

export default function ClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.classes);
    } catch (err) {
      setError('No se pudieron cargar las clases');
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/classes', { title, description });
      setMessage(`Clase creada. Código: ${response.data.class.code}`);
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la clase');
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/classes/join', { code: joinCode });
      setMessage(`Te has unido a la clase: ${response.data.class.title}`);
      setJoinCode('');
      setShowJoinModal(false);
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo unirse a la clase');
    }
  };

  const handleDeleteClass = async (e, classId) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta clase? Se perderán todos los datos asociados.')) return;
    try {
      await api.delete(`/classes/${classId}`);
      setMessage('Clase eliminada con éxito');
      loadClasses();
    } catch (err) {
      setError('No se pudo eliminar la clase');
    }
  };

  const joinedClasses = classes.filter((c) => c.joined);
  const allClasses = classes;

  return (
    <section className="page-container" id="classes-page">
      {/* ── Header ── */}
      <div className="classes-page-header">
        <h1>Mis Clases</h1>
        <div className="designs-header-actions">
          {user?.role === 'teacher' && (
            <button
              className="secondary-button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              id="btn-toggle-create"
            >
              <PlusIcon /> Crear Clase
            </button>
          )}
          <button
            className="primary-button"
            onClick={() => setShowJoinModal(true)}
            id="btn-open-join"
          >
            <PlusIcon /> Unirse a Clase
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {/* ── Create class form (teacher only) ── */}
      {showCreateForm && user?.role === 'teacher' && (
        <div className="create-class-card">
          <h2>Crear clase nueva</h2>
          <form onSubmit={handleCreate}>
            <label>
              Nombre de la clase
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ej: Programación I"
                id="create-class-name"
              />
            </label>
            <label>
              Descripción
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional de la clase"
                id="create-class-desc"
              />
            </label>
            <div className="designs-header-actions" style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
              <button className="primary-button" type="submit" id="btn-create-class">
                Crear clase
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Classes Grid ── */}
      <div className="classes-grid">
        {allClasses.length === 0 ? (
          <div className="classes-empty">
            <EmptyClassIcon />
            <h3>No hay clases</h3>
            <p>Únete a una clase con el código que te dé tu profesor.</p>
            <button
              className="primary-button"
              onClick={() => setShowJoinModal(true)}
            >
              <PlusIcon /> Unirse a Clase
            </button>
          </div>
        ) : (
          allClasses.map((classItem) => (
            <article
              key={classItem.id}
              className="class-card"
              onClick={() => navigate(`/classes/${classItem.id}`)}
              id={`class-card-${classItem.id}`}
            >
              <div className="class-card-icon">
                <BookIcon />
              </div>
              <div className="class-card-info">
                <div className="class-card-name">{classItem.title}</div>
                <div className="class-card-teacher">{classItem.ownerName}</div>
                {classItem.code && user?.role === 'teacher' && classItem.ownerId === user.id && (
                  <span className="badge" style={{ marginTop: '0.4rem' }}>
                    Código: {classItem.code}
                  </span>
                )}
              </div>
              <div className="class-card-actions">
                {user?.role === 'teacher' && classItem.ownerId === user.id && (
                  <button 
                    className="icon-button danger" 
                    onClick={(e) => handleDeleteClass(e, classItem.id)}
                    title="Eliminar clase"
                  >
                    <TrashIcon />
                  </button>
                )}
                <span className="class-card-arrow">
                  <ArrowIcon />
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ── Join Class Modal ── */}
      {showJoinModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowJoinModal(false)}
          id="join-class-overlay"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Unirse a Clase</h2>
              <button
                className="modal-close"
                onClick={() => setShowJoinModal(false)}
                id="close-join-modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleJoin}>
              <div className="modal-body">
                <p>
                  Pídele a tu Profesor el código de clase y luego ingrésalo aquí.
                </p>
                <label htmlFor="join-code-input">Código de clase</label>
                <input
                  id="join-code-input"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                  placeholder="ABC123"
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancelar
                </button>
                <button className="primary-button" type="submit" id="btn-join-class">
                  Unirse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
