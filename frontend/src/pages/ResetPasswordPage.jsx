import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../authApi.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
        email,
        token,
        password,
        password2: confirmPassword,
      });
      const msg = response.data?.message;
      setMessage(msg || 'Contraseña actualizada correctamente.');
      if (msg && msg.toLowerCase().includes('actualizada')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña.');
    }
  };

  return (
    <section className="page-container auth-layout">
      <article className="form-card auth-card">
        <h2>Restablecer contraseña</h2>
        <p>Introduce tu correo, el token recibido y la nueva contraseña.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Correo electrónico"
            />
          </label>
          <label>
            Token
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Código recibido"
            />
          </label>
          <label>
            Nueva contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nueva contraseña"
            />
          </label>
          <label>
            Confirmar contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirmar contraseña"
            />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button full-width" type="submit">Cambiar contraseña</button>
        </form>
        <p className="small-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </article>
    </section>
  );
}
