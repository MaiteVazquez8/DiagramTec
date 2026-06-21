/** Gestión de profesores — vista Figma con datos reales. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SuperAdminShell from '../components/superadmin/SuperAdminShell.jsx';
import SuperAdminUserManageList from '../components/superadmin/SuperAdminUserManageList.jsx';
import Icon from '../components/Icon';
import { useToast } from '../ToastContext.jsx';

export default function SuperAdminTeachersPage() {
  const { showMessage } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  // Obtiene usuarios y filtra solo profesores
  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const list = (res.data.users || []).filter((u) => u.role === 'teacher');
      setTeachers(list);
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // Búsqueda por email o nombre
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((u) => {
      const blob = `${u.email} ${u.firstName} ${u.lastName}`.toLowerCase();
      return blob.includes(q);
    });
  }, [teachers, search]);

  // Actualiza datos del profesor vía PUT admin
  const handleSave = async (data) => {
    setSavingId(data.id);
    try {
      await api.put(`/admin/users/${data.id}`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'teacher',
      });
      showMessage('Profesor actualizado correctamente');
      loadTeachers();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setSavingId(null);
    }
  };

  // Elimina profesor tras confirmación
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este profesor?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showMessage('Profesor eliminado');
      loadTeachers();
    } catch {
      // El interceptor global ya muestra el toast de error.
    }
  };

  const emptyMessage = search.trim()
    ? (
      <>
        No hay profesores que coincidan con la búsqueda.
        {' '}
        <Link to="/superadmin">Volver al panel</Link>
      </>
    )
    : (
      <>
        No hay profesores registrados.
        {' '}
        <Link to="/superadmin">Volver al panel</Link>
      </>
    );

  return (
    <SuperAdminShell>
      <div className="superadmin-manage superadmin-manage--teachers">
        {/* Cabecera con buscador */}
        <header className="superadmin-manage__head">
          <div className="superadmin-manage__title-wrap">
            <span className="superadmin-manage__title-icon" aria-hidden>
              <Icon name="usersGroup" size={28} />
            </span>
            <h1 className="superadmin-manage__title">Gestión de profesores</h1>
          </div>
          <div className="superadmin-manage__search-wrap">
            <input
              type="search"
              className="superadmin-manage__search"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar profesores"
            />
            <Icon name="search" size={20} className="superadmin-manage__search-icon" />
          </div>
        </header>

        {/* Lista editable de profesores */}
        <div className="superadmin-manage__card">
          <SuperAdminUserManageList
            loading={loading}
            loadingText="Cargando profesores..."
            emptyMessage={emptyMessage}
            users={filtered}
            lockRole="teacher"
            savingId={savingId}
            onSave={handleSave}
            onDelete={handleDelete}
            deleteLabel="Eliminar profesor"
          />
        </div>
      </div>
    </SuperAdminShell>
  );
}
