/**
 * RecoverPasswordPage — paso 1: solicitar código por email (/recover).
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api.js';
import { useTurnstile } from '../components/Turnstile.jsx';
import { useToast } from '../ToastContext.jsx';
import { Button, Input } from '../components/ui/index.js';

export default function RecoverPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showMessage, showError } = useToast();
  const turnstile = useTurnstile('recovery');
  const [email, setEmail] = useState(
    location.state?.email || localStorage.getItem('recoverEmail') || '',
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!turnstile.ready) {
      showError('Completá la verificación anti-bots');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/recovery-code', { email, ...turnstile.body });
      localStorage.setItem('recoverEmail', email);
      showMessage(response.data?.message || 'Si el correo está registrado, te enviamos un código.');
      navigate('/reset-password', { state: { email } });
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
          <Link to="/login">Iniciar sesion</Link>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Recuperar contraseña</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Tu email..."
          />
          {turnstile.widget}
          <Button variant="primary" fullWidth type="submit" loading={loading}>
            Enviar código
          </Button>
        </form>
        <p className="small-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </article>
    </section>
  );
}
