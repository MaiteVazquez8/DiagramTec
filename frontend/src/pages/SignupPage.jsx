/** Registro de usuario nuevo vía authApi (PHP). */
import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import GoogleLoginButton from '../components/GoogleLoginButton.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input, Select } from '../components/ui/index.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showError } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) return;
    login(token);
    navigate('/', { replace: true });
  }, [location.search, login, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    if (!role) {
      showError('Selecciona un rol');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.post('/registro.php', {
        firstName,
        lastName,
        email,
        password,
        role,
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
            />
            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Tu contraseña..."
            />
          </div>
          <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="" disabled>
              Rol
            </option>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
          </Select>
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
