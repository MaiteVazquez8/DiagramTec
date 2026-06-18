import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { useToast } from '../ToastContext.jsx';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showMessage } = useToast();
  const recoverEmail = location.state?.email || localStorage.getItem('recoverEmail') || '';
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendCode = async () => {
    if (!recoverEmail) {
      showError('No hay un email para reenviar el código');
      return;
    }
    try {
      const response = await authApi.post('/token.php', { email: recoverEmail });
      showMessage(response.data?.message || 'Se envió el código de verificación a su email');
    } catch {
      // El interceptor global ya muestra el toast de error.
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await authApi.post('/modificarClave.php', {
        email: recoverEmail,
        token,
        password,
        password2: confirmPassword,
      });
      const text = response.data?.message || 'Contraseña actualizada correctamente.';
      showMessage(text);
      if (text.toLowerCase().includes('actualizada')) {
        setTimeout(() => navigate('/login'), 1300);
      }
    } catch {
      // El interceptor global ya muestra el toast de error.
    }
  };

  return (
    <section className="page-container auth-page-wrap">
      <article className="form-card auth-card figma-auth-card figma-login-card">
        <div className="auth-tabs">
          <Link to="/login">Iniciar sesion</Link>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Restablecer contraseña</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Código
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Tu código..."
            />
          </label>
          <PasswordInput
            label="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña..."
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Tu contraseña..."
          />
          <button className="ghost-link" type="button" onClick={handleSendCode}>
            Reenviar codigo
          </button>
          <button className="primary-button full-width" type="submit">
            Cambiar contraseña
          </button>
        </form>
        <p className="small-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </article>
    </section>
  );
}
