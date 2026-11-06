/** Registro de usuario nuevo vía la API Node (/auth/register). */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import GoogleLoginButton from '../components/GoogleLoginButton.jsx';
import { useTurnstile } from '../components/Turnstile.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input, Select } from '../components/ui/index.js';

const PASSWORD_REQUIREMENTS_MESSAGE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial';
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (value) => value.length >= 8 },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (value) => /[A-Z]/.test(value) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (value) => /[a-z]/.test(value) },
  { id: 'number', label: 'Un número', test: (value) => /\d/.test(value) },
  { id: 'special', label: 'Un caracter especial', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const turnstile = useTurnstile('signup');
  const { showError } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!role) {
      showError('Selecciona un rol');
      return;
    }
    if (!turnstile.ready) {
      showError('Completá la verificación anti-bots');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        role,
        ...turnstile.body,
      });
      if (response.data?.token) {
        login(response.data.token);
        navigate('/');
      } else {
        showError(response.data?.error || 'No se pudo crear la cuenta');
      }
    } catch {
      // El interceptor global ya muestra el toast de error.
    } finally {
      setLoading(false);
      turnstile.reset();
    }
  };

  return (
    <section className="page-container auth-page-wrap ui-fade-in">
      <article className="form-card auth-card figma-auth-card figma-signup-card ui-slide-up">
        <div className="auth-tabs">
          <Link to="/login">Iniciar sesion</Link>
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
              required
            />
            <Input
              label="Apellido"
              placeholder="Tu apellido..."
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              minLength={8}
            />
            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Tu contraseña..."
              minLength={8}
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
          <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="" disabled>
              Rol
            </option>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
          </Select>
          {turnstile.widget}
          <Button variant="primary" fullWidth type="submit" loading={loading}>
            Registrarse
          </Button>
        </form>
        <p className="small-text">
          ¿Tenes una cuenta? <Link to="/login">Iniciar sesion</Link>
        </p>
      </article>
    </section>
  );
}
