/**
 * ResetPasswordPage — paso 2: código + nueva contraseña (/reset-password).
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input } from '../components/ui/index.js';

import { PASSWORD_REQUIREMENTS_MESSAGE, STRONG_PASSWORD_RE, PASSWORD_REQUIREMENTS } from '../utils/passwordValidation.js';

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
            minLength={6}
          />
          <PasswordInput
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Tu contraseña..."
            minLength={6}
          />
          <div className="password-checklist" aria-live="polite">
            <p className="password-checklist__title">Tu contraseña debe incluir:</p>
            <ul>
              {PASSWORD_REQUIREMENTS.map((requirement) => {
                const isComplete = requirement.test(password);
                return (
                  <li
                    key={requirement.id}
                    className={isComplete ? 'is-complete' : ''}
                  >
                    <span className="password-checklist__mark" aria-hidden>
                      {isComplete ? '✓' : '•'}
                    </span>
                    <span>{requirement.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
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
