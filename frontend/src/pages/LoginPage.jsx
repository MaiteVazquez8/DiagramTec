/** Inicio de sesión vía authApi (PHP). Redirige al guardar token en AuthContext. */
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input } from '../components/ui/index.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showError } = useToast();
  const redirectTo = location.state?.from || '/designs';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.post('/login.php', { email, password });
      if (response.data?.token) {
        login(response.data.token);
        navigate(redirectTo);
      } else {
        showError(response.data?.error || 'No se pudo iniciar sesión');
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
          <span className="active">Iniciar sesion</span>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Ingreso de usuario</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="Tu email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            labelClassName=""
          />
          <PasswordInput
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña..."
          />
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              if (email) localStorage.setItem('recoverEmail', email);
              navigate('/recover', { state: { email } });
            }}
          >
            Olvide mi contraseña
          </Button>
          <Button variant="primary" fullWidth type="submit" loading={loading}>
            Ingresar
          </Button>
        </form>
        <p className="small-text">
          ¿No tienes cuenta? <Link to="/signup">Crear cuenta</Link>
        </p>
      </article>
    </section>
  );
}
