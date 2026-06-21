/** Fila editable de usuario (gestión alumnos / profesores). */
import { useState, useEffect } from 'react';
import Icon from '../Icon.jsx';
import ProfileSilhouette from '../ProfileSilhouette.jsx';

/** Opciones del selector de rol cuando no está bloqueado. */
const ROLE_OPTIONS = [
  { value: 'student', label: 'Alumno' },
  { value: 'teacher', label: 'Profesor' },
];

/** Etiquetas de rol fijo cuando lockRole impide cambiar el select. */
const LOCKED_ROLE_LABELS = {
  student: 'Alumno',
  teacher: 'Profesor',
};

/**
 * Fila de tabla con inputs editables para un usuario.
 * @param {object} user - Usuario de la API
 * @param {'student'|'teacher'|null} lockRole - Si se define, el rol no es editable
 * @param {Function} onSave - Recibe payload { id, email, firstName, lastName, role }
 * @param {Function} onDelete - Recibe user.id
 * @param {boolean} saving - Deshabilita botón Modificar mientras guarda
 * @param {string} [deleteLabel='Eliminar usuario'] - aria-label del botón eliminar
 */
export default function SuperAdminUserManageRow({
  user,
  lockRole,
  onSave,
  onDelete,
  saving,
  deleteLabel = 'Eliminar usuario',
}) {
  // Estado local de los campos editables (sincronizado con user vía useEffect)
  const [email, setEmail] = useState(user.email || '');
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [role, setRole] = useState(user.role || 'student');

  // Resetea el formulario si cambia el usuario (p. ej. tras recargar lista)
  useEffect(() => {
    setEmail(user.email || '');
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setRole(user.role || 'student');
  }, [user]);

  /** Envía los valores trimmeados al padre; respeta lockRole si existe. */
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
          /* Vista de solo lectura del rol en pantallas de alumnos o profesores */
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
