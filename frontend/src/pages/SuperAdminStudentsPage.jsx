/** Gestión de alumnos — vista Figma con datos reales. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { fetchAdminStudents } from '../utils/adminUsers.js';
import SuperAdminShell from '../components/superadmin/SuperAdminShell.jsx';
import SuperAdminUserManageList from '../components/superadmin/SuperAdminUserManageList.jsx';
import SuperAdminUserConfirmModal from '../components/superadmin/SuperAdminUserConfirmModal.jsx';
import Icon from '../components/Icon';
import { useToast } from '../ToastContext.jsx';
import { userSearchBlob } from '../utils/userFields.js';

export default function SuperAdminStudentsPage() {
  const { showMessage } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminStudents(api);
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
    return students.filter((u) => userSearchBlob(u).includes(q));
  }, [students, search]);

  const handleSave = async (data) => {
    setSavingId(data.id);
    try {
      await api.put(`/admin/users/${data.id}`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      const roleChanged = data.role !== 'student';
      showMessage(
        roleChanged
          ? 'Usuario actualizado. Si cambió a profesor, ver Gestión de profesores.'
          : 'Alumno actualizado correctamente',
      );
      loadStudents();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteRequest = (id) => {
    const user = students.find((u) => u.id === id);
    if (user) setDeleteTarget(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      showMessage('Alumno eliminado');
      setDeleteTarget(null);
      loadStudents();
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setDeleting(false);
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
            savingId={savingId}
            onSave={handleSave}
            onDelete={handleDeleteRequest}
            deleteLabel="Eliminar alumno"
          />
        </div>
      </div>

      <SuperAdminUserConfirmModal
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        userKind="student"
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        busy={deleting}
      />
    </SuperAdminShell>
  );
}
