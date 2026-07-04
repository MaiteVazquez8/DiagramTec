/** Fila editable de usuario (gestión alumnos / profesores). */
import { useState, useEffect } from 'react';
import Icon from '../Icon.jsx';
import ProfileSilhouette from '../ProfileSilhouette.jsx';
import { readUserFields } from '../../utils/userFields.js';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Alumno' },
  { value: 'teacher', label: 'Profesor' },
];

export default function SuperAdminUserManageRow({
  user,
  onSave,
  onDelete,
  saving,
  deleteLabel = 'Eliminar usuario',
}) {
  const baseline = readUserFields(user);
  const [email, setEmail] = useState(baseline.email);
  const [firstName, setFirstName] = useState(baseline.firstName);
  const [lastName, setLastName] = useState(baseline.lastName);
  const [role, setRole] = useState(baseline.role);

  useEffect(() => {
    const next = readUserFields(user);
    setEmail(next.email);
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setRole(next.role);
  }, [user]);

  const hasChanges =
    email.trim() !== baseline.email
    || firstName.trim() !== baseline.firstName
    || lastName.trim() !== baseline.lastName
    || role !== baseline.role;

  const handleSave = () => {
    onSave({
      id: user.id,
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
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
      <div className="superadmin-manage__cell superadmin-manage__cell--role" role="cell">
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
      </div>
      <div className="superadmin-manage__cell superadmin-manage__cell--actions" role="cell">
        <button
          type="button"
          className={`superadmin-manage__btn-modify${hasChanges ? '' : ' superadmin-manage__btn-modify--inactive'}`}
          onClick={handleSave}
          disabled={saving || !hasChanges}
          aria-disabled={saving || !hasChanges}
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
