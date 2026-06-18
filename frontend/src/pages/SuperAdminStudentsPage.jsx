/** Gestión de alumnos — vista Figma con datos reales. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SuperAdminShell from '../components/superadmin/SuperAdminShell.jsx';
import SuperAdminUserManageList from '../components/superadmin/SuperAdminUserManageList.jsx';
import Icon from '../components/Icon';
import { useToast } from '../ToastContext.jsx';

export default function SuperAdminStudentsPage() {
  const { showMessage } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const list = (res.data.users || []).filter((u) => u.role === 'student');
      setStudents(list);
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((u) => {
      const blob = `${u.email} ${u.firstName} ${u.lastName}`.toLowerCase();
      return blob.includes(q);
    });
  }, [students, search]);

  const handleSave = async (data) => {
    setSavingId(data.id);
    try {
      await api.put(`/admin/users/${data.id}`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'student',
      });
      showMessage('Alumno actualizado correctamente');
      loadStudents();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este alumno?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showMessage('Alumno eliminado');
      loadStudents();
    } catch {
      // El interceptor global ya muestra el toast de error.
    }
  };

  const emptyMessage = search.trim()
    ? (
      <>
        No hay alumnos que coincidan con la búsqueda.
        {' '}
        <Link to="/superadmin">Volver al panel</Link>
      </>
    )
    : (
      <>
        No hay alumnos registrados.
        {' '}
        <Link to="/superadmin">Volver al panel</Link>
      </>
    );

  return (
    <SuperAdminShell>
      <div className="superadmin-manage superadmin-manage--students">
        <header className="superadmin-manage__head">
          <div className="superadmin-manage__title-wrap">
            <span className="superadmin-manage__title-icon" aria-hidden>
              <Icon name="usersGroup" size={28} />
            </span>
            <h1 className="superadmin-manage__title">Gestión de alumnos</h1>
          </div>
          <div className="superadmin-manage__search-wrap">
            <input
              type="search"
              className="superadmin-manage__search"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar alumnos"
            />
            <Icon name="search" size={20} className="superadmin-manage__search-icon" />
          </div>
        </header>

        <div className="superadmin-manage__card">
          <SuperAdminUserManageList
            loading={loading}
            emptyMessage={emptyMessage}
            users={filtered}
            lockRole="student"
            savingId={savingId}
            onSave={handleSave}
            onDelete={handleDelete}
            deleteLabel="Eliminar alumno"
          />
        </div>
      </div>
    </SuperAdminShell>
  );
}
