/** Gestión de clases — vista Figma con datos reales. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SuperAdminShell from '../components/superadmin/SuperAdminShell.jsx';
import SuperAdminClassManageRow from '../components/superadmin/SuperAdminClassManageRow.jsx';
import Icon from '../components/Icon';
import { useToast } from '../ToastContext.jsx';

export default function SuperAdminClassesPage() {
  const { showMessage } = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/classes');
      setClasses(res.data.classes || []);
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => {
      const blob = `${c.title} ${c.ownerName} ${c.code}`.toLowerCase();
      return blob.includes(q);
    });
  }, [classes, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta clase y todo su contenido?')) return;
    try {
      await api.delete(`/admin/classes/${id}`);
      showMessage('Clase eliminada');
      loadClasses();
    } catch {
      // El interceptor global ya muestra el toast de error.
    }
  };

  const emptyMessage = search.trim()
    ? (
      <>
        No hay clases que coincidan con la búsqueda.
        {' '}
        <Link to="/superadmin">Volver al panel</Link>
      </>
    )
    : (
      <>
        No hay clases creadas.
        {' '}
        <Link to="/superadmin">Volver al panel</Link>
      </>
    );

  return (
    <SuperAdminShell>
      <div className="superadmin-manage superadmin-manage--classes">
        <header className="superadmin-manage__head">
          <div className="superadmin-manage__title-wrap">
            <span className="superadmin-manage__title-icon" aria-hidden>
              <Icon name="classBook" size={28} strokeWidth={1.2} />
            </span>
            <h1 className="superadmin-manage__title">Gestión de clases</h1>
          </div>
          <div className="superadmin-manage__search-wrap">
            <input
              type="search"
              className="superadmin-manage__search"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar clases"
            />
            <Icon name="search" size={20} className="superadmin-manage__search-icon" />
          </div>
        </header>

        <div className="superadmin-manage__card">
          {loading ? (
            <p className="superadmin-manage__loading">Cargando clases...</p>
          ) : filtered.length === 0 ? (
            <p className="superadmin-manage__empty">{emptyMessage}</p>
          ) : (
            <>
              <div className="superadmin-class-row superadmin-class-row--head" role="row">
                <span className="superadmin-manage__col-head">Nombre de clase</span>
                <span className="superadmin-manage__col-head">Profesor</span>
                <span className="superadmin-manage__col-head">Código</span>
                <span className="superadmin-manage__col-head">Alumnos</span>
                <span className="superadmin-manage__col-head superadmin-manage__col-head--delete">Eliminar</span>
              </div>

              <div className="superadmin-manage__list">
                {filtered.map((classItem) => (
                  <SuperAdminClassManageRow
                    key={classItem.id}
                    classItem={classItem}
                    onDelete={handleDelete}
                    onCopyCode={() => showMessage('Código copiado al portapapeles')}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </SuperAdminShell>
  );
}
