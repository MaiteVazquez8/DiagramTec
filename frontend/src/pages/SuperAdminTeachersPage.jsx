/** Gestión de profesores — vista Figma con datos reales. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SuperAdminShell from '../components/superadmin/SuperAdminShell.jsx';
import SuperAdminUserManageList from '../components/superadmin/SuperAdminUserManageList.jsx';
import AppToast from '../components/AppToast.jsx';
import Icon from '../components/Icon';

export default function SuperAdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const list = (res.data.users || []).filter((u) => u.role === 'teacher');
      setTeachers(list);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los profesores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => { setMessage(''); setError(''); }, 3500);
      return () => clearTimeout(t);
    }
  }, [message, error]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((u) => {
      const blob = `${u.email} ${u.firstName} ${u.lastName}`.toLowerCase();
      return blob.includes(q);
    });
  }, [teachers, search]);

  const handleSave = async (data) => {
    setSavingId(data.id);
    try {
      await api.put(`/admin/users/${data.id}`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'teacher',
      });
      setMessage('Profesor actualizado correctamente');
      loadTeachers();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar el profesor');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este profesor?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setMessage('Profesor eliminado');
      loadTeachers();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el profesor');
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

        <AppToast
          message={message}
          error={error}
          onCloseMessage={() => setMessage('')}
          onCloseError={() => setError('')}
        />

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
