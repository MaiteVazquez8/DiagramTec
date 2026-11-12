import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { showError, showMessage } = useToast();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const originalFirstName = user?.firstName || '';
  const originalLastName = user?.lastName || '';
  const originalEmail = user?.email || '';
  const emailChanged = email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
  const profileChanged =
    firstName.trim() !== originalFirstName.trim() ||
    lastName.trim() !== originalLastName.trim() ||
    emailChanged;
  const passwordChanged = password.length > 0 || confirmPassword.length > 0;
  // Cambiar email o contraseña exige la contraseña actual (si la cuenta tiene una).
  const needsCurrentPassword = Boolean(user?.hasPassword) && (emailChanged || passwordChanged);
  const hasRequiredProfileFields = Boolean(firstName.trim() && lastName.trim() && email.trim());
  const canSave = hasRequiredProfileFields && (profileChanged || passwordChanged)
    && (!needsCurrentPassword || currentPassword.length > 0) && !saving;

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canSave) return;

    if (passwordChanged && password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    if (passwordChanged && !STRONG_PASSWORD_RE.test(password)) {
      showError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      };
      if (needsCurrentPassword) updateData.currentPassword = currentPassword;
      if (password) updateData.newPassword = password;

      const response = await api.put('/auth/me', updateData);
      setUser(response.data.user);
      showMessage(response.data.message || 'Datos actualizados correctamente');
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
      setTimeout(() => navigate('/account'), 2500);
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="figma-sector" id="edit-profile-page">
      <div className="edit-profile-container">
        <h1>Modificar datos</h1>

        <form className="edit-profile-form" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Nombre"
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Apellido"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
            />
            {user?.pendingEmail && (
              <small className="edit-profile-hint">
                Cambio pendiente a {user.pendingEmail}: confirmalo desde el enlace que te enviamos.
              </small>
            )}
          </div>

          {showPasswordFields && (
            <div className="form-row">
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu nueva contraseña..."
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetila..."
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {needsCurrentPassword && (
            <div className="form-group">
              <label>Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Para confirmar que sos vos"
                autoComplete="current-password"
                required
              />
            </div>
          )}

          {!showPasswordFields && (
            <button
              type="button"
              className="change-password-link"
              onClick={() => setShowPasswordFields(true)}
            >
              Cambiar contraseña
            </button>
          )}

          <button
            type="submit"
            className="primary-button edit-profile-submit"
            disabled={!canSave}
          >
            {saving ? 'Modificando...' : 'Modificar'}
          </button>
        </form>
      </div>
    </section>
  );
}
