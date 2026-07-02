/** Listado de clases: crear, unirse por código y abrir detalle (ruta /classes). */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

import { PlusIcon, EmptyClassIcon } from '../components/EditorUI.jsx';
import Icon from '../components/Icon.jsx';
import { useToast } from '../ToastContext.jsx';
import { ClassesPageSkeleton } from '../components/skeletons/PageSkeletons.jsx';
import { Button, Input, Textarea, EmptyState, Modal } from '../components/ui/index.js';

export default function ClassesPage() {
  const { user } = useAuth();
  const { showMessage } = useToast();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/classes');
      setClasses(response.data.classes);
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const response = await api.post('/classes', { title, description });
      showMessage(`Clase creada. Código: ${response.data.class.code}`);
      setTitle('');
      setDescription('');
      setShowCreateModal(false);
      loadClasses();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    if (joining) return;
    setJoining(true);
    try {
      const response = await api.post('/classes/join', { code: joinCode });
      showMessage(`Te has unido a la clase: ${response.data.class.title}`);
      setJoinCode('');
      setShowJoinModal(false);
      loadClasses();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setJoining(false);
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
          className="figma-card figma-card--compact class-list-card ui-slide-up"
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
        className="class-list-card class-list-card--student ui-slide-up"
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
      className={`figma-sector ui-fade-in ${isTeacher ? 'classes-page--teacher' : 'classes-page--student'}`}
      id="classes-page"
    >
      <div className="figma-sector-inner">
        <header className="figma-sector-hero">
          <h1>Mis clases</h1>
          <div className="figma-sector-toolbar">
            {isTeacher ? (
              <Button
                className="classes-teacher-create-btn"
                onClick={() => setShowCreateModal(true)}
                id="btn-open-create-class"
              >
                <Icon name="plus" size={18} strokeWidth={2.5} />
                Crear clase
              </Button>
            ) : (
              <Button onClick={() => setShowJoinModal(true)} id="btn-open-join">
                <PlusIcon /> Unirse a clase
              </Button>
            )}
          </div>
        </header>

        {loading ? (
          <ClassesPageSkeleton teacher={isTeacher} />
        ) : (
          <div className={isTeacher ? 'figma-cards-grid figma-classes-grid' : 'class-list-grid'}>
            {classes.length === 0 ? (
              <EmptyState
                icon={<EmptyClassIcon />}
                title="No hay clases"
                description={
                  isTeacher
                    ? 'Crea tu primera clase para compartir diagramas con tus estudiantes.'
                    : 'Únete a una clase con el código que te dé tu profesor.'
                }
                action={
                  isTeacher ? (
                    <Button
                      className="classes-teacher-create-btn"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Icon name="plus" size={18} strokeWidth={2.5} />
                      Crear clase
                    </Button>
                  ) : (
                    <Button onClick={() => setShowJoinModal(true)}>
                      <PlusIcon /> Unirse a clases
                    </Button>
                  )
                }
              />
            ) : (
              classes.map((classItem, index) => renderClassCard(classItem, index))
            )}
          </div>
        )}

        <Modal
          open={showCreateModal && isTeacher}
          onClose={() => setShowCreateModal(false)}
          className="modal modal--figma-form modal--create-class ui-modal"
          id="create-class-modal"
          ariaLabelledby="create-class-title"
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
              <Input
                label="Nombre de la clase"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nombre de la clase..."
                id="create-class-name"
                autoFocus
              />
              <Textarea
                label="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción..."
                id="create-class-desc"
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <Button type="submit" loading={creating} id="btn-create-class">
                Crear
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={showJoinModal && !isTeacher}
          onClose={() => setShowJoinModal(false)}
          className="modal modal--join figma-dot-pattern ui-modal"
          id="join-class-modal"
        >
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
              <p>Pídele a tu profesor el código de la clase y luego ingrésalo aquí.</p>
              <Input
                id="join-code-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
                placeholder="Tu código de la clase..."
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <Button type="submit" loading={joining} id="btn-join-class">
                Unirse
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </section>
  );
}
