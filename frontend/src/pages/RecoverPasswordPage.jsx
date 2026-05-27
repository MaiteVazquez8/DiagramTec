import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authApi from '../authApi.js';

export default function RecoverPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const recoverEmail = location.state?.email || localStorage.getItem('recoverEmail') || '';
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setError('');
    setMessage('');
    if (!recoverEmail) {
      setError('No hay un email para reenviar el código');
      return;
    }
    try {
      const response = await authApi.post('/token.php', { email: recoverEmail });
      setMessage(response.data?.message || 'Se envió el código de verificación a su email');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo reenviar el código.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await authApi.post('/modificarClave.php', {
        email: recoverEmail,
        token,
        password,
        password2: confirmPassword,
      });
      const text = response.data?.message || 'Contraseña actualizada correctamente.';
      setMessage(text);
      if (text.toLowerCase().includes('actualizada')) {
        setTimeout(() => navigate('/login'), 1300);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña.');
    }
  };

  return (
    <section className="page-container auth-page-wrap">
      <article className="form-card auth-card figma-auth-card">
        <div className="auth-tabs">
          <Link to="/login">Iniciar sesion</Link>
          <Link to="/signup">Registrarse</Link>
        </div>
        <h2>Recuperar contraseña</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nueva contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tu contraseña..."
            />
          </label>
          <label>
            Confirmar contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Tu contraseña..."
            />
          </label>
          <label>
            Código
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Tu código..."
            />
          </label>
          <button className="ghost-link" type="button" onClick={handleSendCode}>Reenviar codigo</button>
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button full-width" type="submit">Cambiar contraseña</button>
        </form>
      </article>
    </section>
  );
}
