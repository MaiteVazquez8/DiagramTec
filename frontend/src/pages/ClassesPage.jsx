import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

import { PlusIcon, EmptyClassIcon, TrashIcon } from '../components/EditorUI.jsx';
import Icon from '../components/Icon.jsx';

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

  return (
    <section className="figma-sector" id="classes-page">
      <div className="figma-sector-inner">
        <header className="figma-sector-hero">
          <h1>Mis clases</h1>
          <p>
            Únete a las clases de tus profesores o crea las tuyas. Comparte diagramas y colabora
            con tu equipo desde un mismo espacio.
          </p>
          <div className="figma-sector-toolbar">
            {user?.role === 'teacher' && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowCreateForm(!showCreateForm)}
                id="btn-toggle-create"
              >
                <PlusIcon /> Crear clase
              </button>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowJoinModal(true)}
              id="btn-open-join"
            >
              <PlusIcon /> Unirse a clases
            </button>
          </div>
        </header>

        <div className="toast-container">
          {message && (
            <div className="toast success-toast">
              <div className="toast-icon">✓</div>
              <div className="toast-content">{message}</div>
              <button type="button" className="toast-close" onClick={() => setMessage('')}>✕</button>
            </div>
          )}
          {error && (
            <div className="toast error-toast">
              <div className="toast-icon">!</div>
              <div className="toast-content">{error}</div>
              <button type="button" className="toast-close" onClick={() => setError('')}>✕</button>
            </div>
          )}
        </div>

        {showCreateForm && user?.role === 'teacher' && (
          <div className="figma-form-panel">
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
              <div className="figma-sector-toolbar" style={{ marginBottom: 0 }}>
                <button className="primary-button" type="submit" id="btn-create-class">
                  + Crear clase
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

        <div className="class-list-grid">
          {classes.length === 0 ? (
            <div className="figma-empty-panel figma-dot-pattern">
              <EmptyClassIcon />
              <h3>No hay clases</h3>
              <p>Únete a una clase con el código que te dé tu profesor.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowJoinModal(true)}
              >
                <PlusIcon /> Unirse a clases
              </button>
            </div>
          ) : (
            classes.map((classItem) => {
              const isOwner = user?.role === 'teacher' && classItem.ownerId === user.id;
              const subtitle = classItem.description?.trim()
                ? classItem.description
                : `Prof. ${classItem.ownerName}`;

              return (
                <article
                  key={classItem.id}
                  className="class-list-card"
                  id={`class-card-${classItem.id}`}
                  onClick={() => navigate(`/classes/${classItem.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/classes/${classItem.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {isOwner && (
                    <button
                      type="button"
                      className="class-list-card-delete"
                      onClick={(e) => handleDeleteClass(e, classItem)}
                      title="Eliminar clase"
                      aria-label={`Eliminar clase ${classItem.title}`}
                    >
                      <Icon name="trash" size={17} strokeWidth={2} />
                    </button>
                  )}
                  <h3 className="class-list-card-title">{classItem.title}</h3>
                  <p className="class-list-card-sub">{subtitle}</p>
                  {isOwner && classItem.code && (
                    <span className="class-list-card-code">Código: {classItem.code}</span>
                  )}
                </article>
              );
            })
          )}
        </div>

        {classToDelete && (
          <div className="modal-overlay" onClick={() => setClassToDelete(null)}>
            <div className="modal modal-danger" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="modal-danger-icon">
                    <TrashIcon />
                  </div>
                  <h2>¿Eliminar clase?</h2>
                </div>
                <button type="button" className="modal-close" onClick={() => setClassToDelete(null)}>✕</button>
              </div>
              <div className="modal-body">
                <p>
                  Esta acción es irreversible. Se perderán todos los diseños y la conversación de{' '}
                  <strong>{classToDelete.title}</strong>.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setClassToDelete(null)}>
                  Cancelar
                </button>
                <button type="button" className="primary-button modal-danger-btn" onClick={confirmDelete}>
                  Eliminar definitivamente
                </button>
              </div>
            </div>
          </div>
        )}

        {showJoinModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowJoinModal(false)}
            id="join-class-overlay"
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Unirse a clase</h2>
                <button
                  type="button"
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
                    Pídele a tu profesor el código de clase y luego ingrésalo aquí.
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
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowJoinModal(false)}
                  >
                    Cancelar
                  </button>
                  <button className="primary-button" type="submit" id="btn-join-class">
                    + Unirse
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

