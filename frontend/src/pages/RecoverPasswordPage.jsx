import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';
import { useToast } from '../ToastContext.jsx';

export default function RecoverPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showMessage } = useToast();
  const [email, setEmail] = useState(
    location.state?.email || localStorage.getItem('recoverEmail') || '',
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await authApi.post('/token.php', { email });
      localStorage.setItem('recoverEmail', email);
      showMessage(response.data?.message || 'Se envió el código de verificación a su email');
      navigate('/reset-password', { state: { email } });
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
        <h2>Recuperar contraseña</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Tu email..."
            />
          </label>
          <button className="primary-button full-width" type="submit">
            Enviar código
          </button>
        </form>
        <p className="small-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </article>
    </section>
  );
}
