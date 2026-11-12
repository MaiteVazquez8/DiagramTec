/** Inicio de sesión vía la API Node (/auth/login). La sesión queda en una cookie HttpOnly. */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api.js';
import { useTurnstile } from '../components/Turnstile.jsx';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import GoogleLoginButton from '../components/GoogleLoginButton.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input } from '../components/ui/index.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showError, showMessage } = useToast();
  const redirectTo = location.state?.from || '/designs';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handledParams = useRef('');
  const turnstile = useTurnstile('login');

  // Avisos que llegan en la URL: vuelta de Google (la cookie ya está puesta) o enlace de verificación.
  useEffect(() => {
    if (!location.search || handledParams.current === location.search) return;
    handledParams.current = location.search;
    const params = new URLSearchParams(location.search);
    const errors = {
      google: 'No se pudo iniciar sesión con Google. Intentá de nuevo.',
      google_params: 'No se pudo iniciar sesión con Google. Intentá de nuevo.',
      oauth_state: 'La sesión de Google expiró. Volvé a intentar iniciar sesión.',
      db_unavailable: 'El servidor aún se está conectando. Esperá unos segundos e intentá de nuevo.',
    };
    const verified = {
      ok: ['Email verificado. ¡Listo!', showMessage],
      invalid: ['El enlace de verificación no es válido o venció. Pedí uno nuevo desde tu cuenta.', showError],
      taken: ['Ese email ya lo usa otra cuenta.', showError],
    };
    navigate('/login', { replace: true, state: location.state });

    if (errors[params.get('error')]) {
      showError(errors[params.get('error')]);
    } else if (verified[params.get('verified')]) {
      const [text, show] = verified[params.get('verified')];
      show(text);
      login();
    } else if (params.get('google') === 'ok') {
      login().then((loaded) => {
        if (loaded) navigate(redirectTo, { replace: true });
        else showError('No se pudo validar la sesión. Intentá iniciar sesión de nuevo.');
      });
    }
  }, [location.search, location.state, login, navigate, redirectTo, showError, showMessage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!turnstile.ready) {
      showError('Completá la verificación anti-bots');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password, ...turnstile.body });
      if (await login()) {
        navigate(redirectTo);
      } else {
        showError('No se pudo iniciar sesión');
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
      <article className="form-card auth-card figma-auth-card figma-login-card ui-slide-up">
        <div className="auth-tabs">
          <span className="active">Iniciar sesion</span>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Ingreso de usuario</h2>

        <GoogleLoginButton />

        <p className="auth-divider" role="separator">
          <span>o</span>
        </p>

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
          {turnstile.widget}
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
