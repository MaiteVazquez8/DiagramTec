import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

import { 
  PlusIcon, BookIcon, ArrowIcon, EmptyClassIcon, TrashIcon 
} from '../components/EditorUI.jsx';

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
  const [classToDelete, setClassToDelete] = useState(null);

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

  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => { setMessage(''); setError(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

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

  const handleDeleteClass = (e, classItem) => {
    e.stopPropagation();
    setClassToDelete(classItem);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await api.delete(`/classes/${classToDelete.id}`);
      setMessage('Clase eliminada con éxito');
      setClassToDelete(null);
      loadClasses();
    } catch (err) {
      setError('No se pudo eliminar la clase');
      setClassToDelete(null);
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

      {/* ── Toast Notifications ── */}
      <div className="toast-container">
        {message && (
          <div className="toast success-toast">
            <div className="toast-icon">✓</div>
            <div className="toast-content">{message}</div>
            <button className="toast-close" onClick={() => setMessage('')}>✕</button>
          </div>
        )}
        {error && (
          <div className="toast error-toast">
            <div className="toast-icon">!</div>
            <div className="toast-content">{error}</div>
            <button className="toast-close" onClick={() => setError('')}>✕</button>
          </div>
        )}
      </div>

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
                <div className="class-card-teacher">Prof. {classItem.ownerName}</div>
                {classItem.description && (
                  <div style={{ fontSize: '0.78rem', color: 'rgba(27,23,23,0.4)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {classItem.description}
                  </div>
                )}
                {classItem.code && user?.role === 'teacher' && classItem.ownerId === user.id && (
                  <span className="badge" style={{ marginTop: '0.6rem', display: 'inline-block', background: '#f8d7da', color: '#842029', border: 'none', borderRadius: '999px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    Código: {classItem.code}
                  </span>
                )}
              </div>
              <div className="class-card-actions">
                {user?.role === 'teacher' && classItem.ownerId == user.id && (
                  <button 
                    className="icon-button-ghost" 
                    onClick={(e) => handleDeleteClass(e, classItem)}
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

      {/* ── Delete Confirmation Modal ── */}
      {classToDelete && (
        <div className="modal-overlay" onClick={() => setClassToDelete(null)}>
          <div className="modal modal-danger" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#fee2e2', color: '#dc2626', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrashIcon />
                </div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--dark)' }}>¿Eliminar clase?</h2>
              </div>
              <button className="modal-close" onClick={() => setClassToDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--dark-soft)', lineHeight: '1.5', margin: '0' }}>
                Esta acción es irreversible. Se perderán todos los diseños y la conversación de <strong>{classToDelete.title}</strong>.
              </p>
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="secondary-button" onClick={() => setClassToDelete(null)} style={{ border: 'none' }}>
                Cancelar
              </button>
              <button 
                className="primary-button" 
                onClick={confirmDelete}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

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
