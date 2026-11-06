/**
 * ResetPasswordPage — paso 2: código + nueva contraseña (/reset-password).
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input } from '../components/ui/index.js';

const PASSWORD_REQUIREMENTS_MESSAGE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial';
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showMessage } = useToast();
  const recoverEmail = location.state?.email || localStorage.getItem('recoverEmail') || '';
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Reenviar pasa por la página de recuperación, que tiene la verificación anti-bots.
  const handleSendCode = () => navigate('/recover', { state: { email: recoverEmail } });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!STRONG_PASSWORD_RE.test(password)) {
      showError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-container auth-page-wrap ui-fade-in">
      <article className="form-card auth-card figma-auth-card figma-login-card ui-slide-up">
        <div className="auth-tabs">
          <Link to="/login">Iniciar sesion</Link>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Restablecer contraseña</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Código"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="Tu código..."
          />
          <PasswordInput
            label="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña..."
            minLength={8}
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Tu contraseña..."
            minLength={8}
          />
          <Button variant="ghost" type="button" onClick={handleSendCode}>
            Reenviar codigo
          </Button>
          <Button variant="primary" fullWidth type="submit" loading={loading}>
            Cambiar contraseña
          </Button>
        </form>
        <p className="small-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </article>
    </section>
  );
}
