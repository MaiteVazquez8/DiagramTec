/** Confirmación de eliminación de usuario (alumno/profesor) — usa AppConfirmModal. */
import AppConfirmModal from '../AppConfirmModal.jsx';
import { readUserFields } from '../../utils/userFields.js';

export default function SuperAdminUserConfirmModal({
  open,
  user,
  userKind = 'student',
  onClose,
  onConfirm,
  busy = false,
}) {
  if (!open || !user) return null;

  const profile = readUserFields(user);
  const name = `${profile.firstName} ${profile.lastName}`.trim() || profile.email || 'este usuario';
  const roleLabel = userKind === 'teacher' ? 'profesor' : 'alumno';

  return (
    <AppConfirmModal
      open={open}
      variant="deleteUser"
      highlightName={`${roleLabel}|${name}`}
      onClose={onClose}
      onConfirm={onConfirm}
      busy={busy}
      titleId="superadmin-user-confirm-title"
    />
  );
}
