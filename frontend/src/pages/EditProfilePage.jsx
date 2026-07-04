import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { showError, showMessage } = useToast();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const originalFirstName = user?.firstName || '';
  const originalLastName = user?.lastName || '';
  const originalEmail = user?.email || '';
  const profileChanged =
    firstName.trim() !== originalFirstName.trim() ||
    lastName.trim() !== originalLastName.trim() ||
    email.trim() !== originalEmail.trim();
  const passwordChanged = password.length > 0 || confirmPassword.length > 0;
  const hasRequiredProfileFields = Boolean(firstName.trim() && lastName.trim() && email.trim());
  const canSave = hasRequiredProfileFields && (profileChanged || passwordChanged) && !saving;

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

    setSaving(true);
    try {
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      };
      if (password) {
        updateData.password = password;
      }

      const response = await api.put('/auth/me', updateData);
      setUser(response.data.user);
      showMessage('Datos actualizados correctamente');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
      setTimeout(() => navigate('/account'), 1500);
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
          </div>

          {showPasswordFields && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña..."
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Tu contraseña..."
                  />
                </div>
              </div>
            </>
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
