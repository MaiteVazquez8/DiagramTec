import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../authApi.js';

export default function RecoverPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await authApi.post('/token.php', { email });
      if (response.data?.message) {
        setMessage(response.data.message);
      } else {
        setMessage('Si el correo existe, se ha enviado un código.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar el código.');
    }
  };

  return (
    <section className="page-container auth-layout">
      <article className="form-card auth-card">
        <h2>Recuperar contraseña</h2>
        <p>Ingresa tu correo para recibir un código de recuperación.</p>
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
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button full-width" type="submit">Enviar código</button>
        </form>
        <p className="small-text">
          ¿Ya tienes el código? <Link to="/reset-password">Restablecer contraseña</Link>
        </p>
        <p className="small-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </article>
    </section>
  );
}
