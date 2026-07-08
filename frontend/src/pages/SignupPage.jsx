/** Registro de usuario nuevo vía authApi (PHP). */
import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import GoogleLoginButton from '../components/GoogleLoginButton.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input } from '../components/ui/index.js';

import { PASSWORD_REQUIREMENTS_MESSAGE, STRONG_PASSWORD_RE, PASSWORD_REQUIREMENTS } from '../utils/passwordValidation.js';
import { validateEmail } from '../utils/emailValidation.js';
import { validateUserNames, NAME_MAX_LENGTH } from '../utils/nameValidation.js';

import { resolveAuthRedirect } from '../utils/editorBackup.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showError } = useToast();
  const redirectTo = resolveAuthRedirect(location.state?.from);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) return;
    login(token);
    navigate(resolveAuthRedirect(location.state?.from), { replace: true });
  }, [location.search, location.state, login, navigate]);

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

    setLoading(true);
    try {
      const response = await authApi.post('/registro.php', {
        firstName: namesCheck.firstName,
        lastName: namesCheck.lastName,
        email: emailCheck.email,
        password,
        role: 'student',
      });
      if (response.data?.token) {
        login(response.data.token);
        navigate(redirectTo);
      } else {
        showError(response.data?.error || 'No se pudo crear la cuenta');
      }
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-container auth-page-wrap ui-fade-in">
      <article className="form-card auth-card figma-auth-card figma-signup-card ui-slide-up">
        <div className="auth-tabs">
          <Link to="/login" state={location.state}>Iniciar sesion</Link>
          <span className="active">Registrarse</span>
        </div>
        <h2>Crear cuenta</h2>

        <GoogleLoginButton label="Registrarse con Google" />

        <p className="auth-divider" role="separator">
          <span>o</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <Input
              label="Nombre"
              placeholder="Tu nombre..."
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={NAME_MAX_LENGTH}
              required
            />
            <Input
              label="Apellido"
              placeholder="Tu apellido..."
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={NAME_MAX_LENGTH}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="Tu email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="form-row">
            <PasswordInput
              label="Contraseña"
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
          </div>
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
          <Button variant="primary" fullWidth type="submit" loading={loading}>
            Registrarse
          </Button>
        </form>
        <p className="small-text">
          ¿Tenes una cuenta? <Link to="/login" state={location.state}>Iniciar sesion</Link>
        </p>
      </article>
    </section>
  );
}
