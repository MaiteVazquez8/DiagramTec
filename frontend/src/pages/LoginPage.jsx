/** Inicio de sesión vía authApi (PHP). Redirige al guardar token en AuthContext. */
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import AppToast from '../components/AppToast.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = location.state?.from || '/designs';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.token) {
        login(response.data.token);
        navigate(redirectTo);
      } else {
        setError(response.data?.error || 'No se pudo iniciar sesión');
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(
        msg === 'INVALID_CREDENTIALS' || err.response?.status === 401
          ? 'Credenciales inválidas'
          : msg || 'No se pudo iniciar sesión',
      );
    }
  };

  return (
    <section className="page-container auth-page-wrap">
      <AppToast error={error} onCloseError={() => setError('')} />
      <article className="form-card auth-card figma-auth-card figma-login-card">
        <div className="auth-tabs">
          <span className="active">Iniciar sesion</span>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Ingreso de usuario</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" placeholder="Tu email..." value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <PasswordInput
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña..."
          />
          <button
            className="ghost-link"
            type="button"
            onClick={() => {
              if (email) localStorage.setItem('recoverEmail', email);
              navigate('/recover', { state: { email } });
            }}
          >
            Olvide mi contraseña
          </button>
          <button className="primary-button full-width" type="submit">Ingresar</button>
        </form>
        <p className="small-text">
          ¿No tienes cuenta? <Link to="/signup">Crear cuenta</Link>
        </p>
      </article>
    </section>
  );
}
