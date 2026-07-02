/**
 * ResetPasswordPage — paso 2: código + nueva contraseña (/reset-password).
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input } from '../components/ui/index.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showMessage } = useToast();
  const recoverEmail = location.state?.email || localStorage.getItem('recoverEmail') || '';
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSendCode = async () => {
    if (!recoverEmail) {
      showError('No hay un email para reenviar el código');
      return;
    }
    setResending(true);
    try {
      const response = await authApi.post('/token.php', { email: recoverEmail });
      showMessage(response.data?.message || 'Se envió el código de verificación a su email');
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
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
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Tu contraseña..."
          />
          <Button variant="ghost" type="button" onClick={handleSendCode} loading={resending}>
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
