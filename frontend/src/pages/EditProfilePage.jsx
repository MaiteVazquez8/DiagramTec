import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';
import { validatePassword } from '../utils/passwordValidation.js';
import { validateEmail } from '../utils/emailValidation.js';
import { validateUserNames, NAME_MAX_LENGTH } from '../utils/nameValidation.js';

function profileSnapshot(user) {
  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  };
}

export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { showError, showMessage } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [baseline, setBaseline] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [saving, setSaving] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const next = profileSnapshot(user);
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setEmail(next.email);
    setBaseline(next);
  }, [userId]);

  const profileChanged = baseline
    ? firstName.trim() !== baseline.firstName.trim()
      || lastName.trim() !== baseline.lastName.trim()
      || email.trim() !== baseline.email.trim()
    : false;
  const passwordChanged = password.length > 0 || confirmPassword.length > 0;
  const hasRequiredProfileFields = Boolean(firstName.trim() && lastName.trim() && email.trim());
  const canSave = Boolean(baseline) && hasRequiredProfileFields && (profileChanged || passwordChanged) && !saving;

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canSave) return;

    if (passwordChanged && password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    if (passwordChanged) {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.ok) {
        showError(passwordCheck.error);
        return;
      }
    }

    const namesCheck = validateUserNames(firstName, lastName);
    if (!namesCheck.ok) {
      showError(namesCheck.error);
      return;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) {
      showError(emailCheck.error);
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        firstName: namesCheck.firstName,
        lastName: namesCheck.lastName,
        email: emailCheck.email,
      };
      if (password) {
        updateData.password = password;
      }

      const response = await api.put('/auth/me', updateData);
      const savedUser = response.data?.user;
      if (!savedUser) {
        showError('No se pudo actualizar el perfil');
        return;
      }

      const nextBaseline = profileSnapshot(savedUser);
      setUser(savedUser);
      setBaseline(nextBaseline);
      setFirstName(nextBaseline.firstName);
      setLastName(nextBaseline.lastName);
      setEmail(nextBaseline.email);
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
                maxLength={NAME_MAX_LENGTH}
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
                maxLength={NAME_MAX_LENGTH}
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
