/** Fila editable de usuario (gestión alumnos / profesores). */
import { useState, useEffect } from 'react';
import Icon from '../Icon.jsx';
import ProfileSilhouette from '../ProfileSilhouette.jsx';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Alumno' },
  { value: 'teacher', label: 'Profesor' },
];

const LOCKED_ROLE_LABELS = {
  student: 'Alumno',
  teacher: 'Profesor',
};

export default function SuperAdminUserManageRow({
  user,
  lockRole,
  onSave,
  onDelete,
  saving,
  deleteLabel = 'Eliminar usuario',
}) {
  const [email, setEmail] = useState(user.email || '');
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [role, setRole] = useState(user.role || 'student');

  useEffect(() => {
    setEmail(user.email || '');
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setRole(user.role || 'student');
  }, [user]);

  const handleSave = () => {
    onSave({
      id: user.id,
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: lockRole || role,
    });
  };

  return (
    <div className="superadmin-manage__row superadmin-manage__row--card" role="row">
      <div className="superadmin-manage__cell superadmin-manage__cell--avatar" role="cell">
        <ProfileSilhouette size={40} className="superadmin-manage__avatar" />
      </div>
      <div className="superadmin-manage__cell" role="cell">
        <input
          type="email"
          className="superadmin-manage__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email"
        />
      </div>
      <div className="superadmin-manage__cell" role="cell">
        <input
          type="text"
          className="superadmin-manage__input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          aria-label="Nombre"
        />
      </div>
      <div className="superadmin-manage__cell" role="cell">
        <input
          type="text"
          className="superadmin-manage__input"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          aria-label="Apellido"
        />
      </div>
      <div className="superadmin-manage__cell" role="cell">
        {lockRole ? (
          <div className="superadmin-manage__select superadmin-manage__select--locked">
            {LOCKED_ROLE_LABELS[lockRole] || lockRole}
          </div>
        ) : (
          <select
            className="superadmin-manage__select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Rol"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>
      <div className="superadmin-manage__cell superadmin-manage__cell--actions" role="cell">
        <button
          type="button"
          className="superadmin-manage__btn-modify"
          onClick={handleSave}
          disabled={saving}
        >
          <Icon name="edit" size={16} strokeWidth={2} />
          <span>Modificar</span>
        </button>
      </div>
      <div className="superadmin-manage__cell superadmin-manage__cell--delete" role="cell">
        <button
          type="button"
          className="superadmin-manage__btn-delete"
          onClick={() => onDelete(user.id)}
          aria-label={deleteLabel}
        >
          <Icon name="close" size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
