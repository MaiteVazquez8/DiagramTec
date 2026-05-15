import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    }
  };

  return (
    <section className="page-container auth-layout">
      <article className="auth-info">
        <p className="section-eyebrow">Login</p>
        <h1>Ingreso de usuario</h1>
        <p>
          Accede a tu perfil, tus disenos y tus clases. Si todavia no tienes cuenta puedes crearla en un minuto.
        </p>
        <ul>
          <li>Acceso directo a tus proyectos guardados</li>
          <li>Sesion protegida para tu cuenta</li>
          <li>Recuperacion de contrasena desde email</li>
        </ul>
      </article>

      <article className="form-card auth-card">
        <div className="auth-tabs">
          <span className="active">Ingresar</span>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Ingresar</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <PasswordInput
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
          />
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button full-width" type="submit">Ingresar</button>
        </form>
        <button className="ghost-link" type="button">Olvide mi contraseña</button>
        <p className="small-text">
          ¿No tienes cuenta? <Link to="/signup">Crear cuenta</Link>
        </p>
      </article>
    </section>
  );
}
