/** Gestión de profesores — vista Figma con datos reales. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { fetchAdminTeachers } from '../utils/adminUsers.js';
import SuperAdminShell from '../components/superadmin/SuperAdminShell.jsx';
import SuperAdminUserManageList from '../components/superadmin/SuperAdminUserManageList.jsx';
import SuperAdminUserConfirmModal from '../components/superadmin/SuperAdminUserConfirmModal.jsx';
import Icon from '../components/Icon';
import { useToast } from '../ToastContext.jsx';
import { userSearchBlob } from '../utils/userFields.js';

export default function SuperAdminTeachersPage() {
  const { showMessage } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminTeachers(api);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((u) => userSearchBlob(u).includes(q));
  }, [teachers, search]);

  const handleSave = async (data) => {
    setSavingId(data.id);
    try {
      await api.put(`/admin/users/${data.id}`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      const roleChanged = data.role !== 'teacher';
      showMessage(
        roleChanged
          ? 'Usuario actualizado. Si cambió a alumno, ver Gestión de alumnos.'
          : 'Profesor actualizado correctamente',
      );
      loadTeachers();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteRequest = (id) => {
    const user = teachers.find((u) => u.id === id);
    if (user) setDeleteTarget(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      showMessage('Profesor eliminado');
      setDeleteTarget(null);
      loadTeachers();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setDeleting(false);
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

        <div className="superadmin-manage__card">
          <SuperAdminUserManageList
            loading={loading}
            emptyMessage={emptyMessage}
            users={filtered}
            savingId={savingId}
            onSave={handleSave}
            onDelete={handleDeleteRequest}
            deleteLabel="Eliminar profesor"
          />
        </div>
      </div>

      <SuperAdminUserConfirmModal
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        userKind="teacher"
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        busy={deleting}
      />
    </SuperAdminShell>
  );
}
