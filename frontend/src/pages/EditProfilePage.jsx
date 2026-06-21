/**
 * EditProfilePage — formulario para actualizar nombre, apellido, email y contraseña (/edit-profile).
 * Tras guardar actualiza AuthContext y redirige a /account.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { showError, showMessage } = useToast();
  // Estado del formulario, inicializado con los datos actuales del usuario
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Sincroniza el formulario cuando cambia el usuario en AuthContext
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  // Envía los cambios al API y actualiza la sesión local
  const handleSave = async (event) => {
    event.preventDefault();

    if (password && password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    try {
      const updateData = { firstName, lastName, email };
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
    }
  };

  return (
    <section className="figma-sector" id="edit-profile-page">
      <div className="edit-profile-container">
        <h1>Modificar datos</h1>

        <form className="edit-profile-form" onSubmit={handleSave}>
          {/* Datos personales básicos */}
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

          {/* Campos de contraseña opcionales, visibles solo si el usuario los solicita */}
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
            className="primary-button"
          >
            Modificar
          </button>
        </form>
      </div>
    </section>
  );
}
