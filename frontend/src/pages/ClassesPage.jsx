/** Listado de clases: crear, unirse por código y abrir detalle (ruta /classes). */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

import { PlusIcon, EmptyClassIcon } from '../components/EditorUI.jsx';
import Icon from '../components/Icon.jsx';
import AppToast from '../components/AppToast.jsx';

export default function ClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';
  const [classes, setClasses] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      setShowCreateModal(false);
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

  const openClass = (classId) => {
    navigate(`/classes/${classId}`);
  };

  const renderClassCard = (classItem, index) => {
    if (isTeacher) {
      return (
        <article
          key={classItem.id}
          className="figma-card figma-card--compact class-list-card"
          id={`class-card-${classItem.id}`}
          style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
          onClick={() => openClass(classItem.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openClass(classItem.id);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="figma-card-media figma-dot-pattern class-list-card-media">
            <Icon name="classBook" size={48} className="class-list-card-book-icon" />
          </div>
          <div className="figma-card-foot class-list-card-foot">
            <h3 className="figma-card-title class-list-card-title" title={classItem.title}>
              {classItem.title}
            </h3>
            <button
              type="button"
              className="figma-card-menu-btn class-list-card-edit-btn"
              title="Abrir clase"
              aria-label={`Abrir clase ${classItem.title}`}
              onClick={(e) => {
                e.stopPropagation();
                openClass(classItem.id);
              }}
            >
              <Icon name="edit" size={18} />
            </button>
          </div>
        </article>
      );
    }

    const subtitle = classItem.description?.trim()
      ? classItem.description
      : `Prof. ${classItem.ownerName}`;

    return (
      <article
        key={classItem.id}
        className="class-list-card class-list-card--student"
        id={`class-card-${classItem.id}`}
        style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
        onClick={() => openClass(classItem.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') openClass(classItem.id);
        }}
        role="button"
        tabIndex={0}
      >
        <div className="class-list-card-media figma-dot-pattern">
          <Icon name="classBook" size={48} className="class-list-card-book-icon" />
        </div>
        <div className="class-list-card-body">
          <h3 className="class-list-card-title">{classItem.title}</h3>
          <p className="class-list-card-sub">{subtitle}</p>
        </div>
      </article>
    );
  };

  return (
    <section
      className={`figma-sector ${isTeacher ? 'classes-page--teacher' : 'classes-page--student'}`}
      id="classes-page"
    >
      <div className="figma-sector-inner">
        <header className="figma-sector-hero">
          <h1>Mis clases</h1>
          <div className="figma-sector-toolbar">
            {isTeacher ? (
              <button
                type="button"
                className="primary-button classes-teacher-create-btn"
                onClick={() => setShowCreateModal(true)}
                id="btn-open-create-class"
              >
                <Icon name="plus" size={18} strokeWidth={2.5} />
                Crear clase
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowJoinModal(true)}
                id="btn-open-join"
              >
                <PlusIcon /> Unirse a clase
              </button>
            )}
          </div>
        </header>

        <AppToast
          message={message}
          error={error}
          onCloseMessage={() => setMessage('')}
          onCloseError={() => setError('')}
        />

        <div className={isTeacher ? 'figma-cards-grid figma-classes-grid' : 'class-list-grid'}>
          {classes.length === 0 ? (
            <div className="figma-empty-panel figma-dot-pattern">
              <EmptyClassIcon />
              <h3>No hay clases</h3>
              <p>
                {isTeacher
                  ? 'Crea tu primera clase para compartir diagramas con tus estudiantes.'
                  : 'Únete a una clase con el código que te dé tu profesor.'}
              </p>
              {isTeacher ? (
                <button
                  type="button"
                  className="primary-button classes-teacher-create-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Icon name="plus" size={18} strokeWidth={2.5} />
                  Crear clase
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setShowJoinModal(true)}
                >
                  <PlusIcon /> Unirse a clases
                </button>
              )}
            </div>
          ) : (
            classes.map((classItem, index) => renderClassCard(classItem, index))
          )}
        </div>

        {showCreateModal && isTeacher && (
          <div
            className="modal-overlay figma-modal-overlay"
            onClick={() => setShowCreateModal(false)}
            id="create-class-overlay"
          >
            <div
              className="modal modal--figma-form modal--create-class"
              onClick={(e) => e.stopPropagation()}
              id="create-class-modal"
              role="dialog"
              aria-labelledby="create-class-title"
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                id="close-create-class-modal"
                aria-label="Cerrar"
              >
                ✕
              </button>
              <form onSubmit={handleCreate} className="modal--figma-form__form">
                <div className="modal-header">
                  <h2 id="create-class-title">Crear clase</h2>
                </div>
                <div className="modal-body">
                  <label className="figma-field">
                    <span className="figma-field__label">Nombre de la clase</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="Nombre de la clase..."
                      id="create-class-name"
                      autoFocus
                    />
                  </label>
                  <label className="figma-field">
                    <span className="figma-field__label">Descripción</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción..."
                      id="create-class-desc"
                      rows={4}
                    />
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="primary-button" type="submit" id="btn-create-class">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showJoinModal && !isTeacher && (
          <div
            className="modal-overlay figma-modal-overlay"
            onClick={() => setShowJoinModal(false)}
            id="join-class-overlay"
          >
            <div className="modal modal--join figma-dot-pattern" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowJoinModal(false)}
                id="close-join-modal"
                aria-label="Cerrar"
              >
                ✕
              </button>
              <form onSubmit={handleJoin}>
                <div className="modal-header">
                  <h2>Código de clase</h2>
                </div>
                <div className="modal-body">
                  <p>
                    Pídele a tu profesor el código de la clase y luego ingrésalo aquí.
                  </p>
                  <input
                    id="join-code-input"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    placeholder="Tu código de la clase..."
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button className="primary-button" type="submit" id="btn-join-class">
                    Unirse
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
