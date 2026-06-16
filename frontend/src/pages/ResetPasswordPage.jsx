import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../authApi.js';
import { useToast } from '../ToastContext.jsx';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showError, showMessage } = useToast();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
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
      showMessage(msg || 'Contraseña actualizada correctamente.');
      if (msg && msg.toLowerCase().includes('actualizada')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch {
      // El interceptor global ya muestra el toast de error.
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
          <button className="primary-button full-width" type="submit">Cambiar contraseña</button>
        </form>
        <p className="small-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </article>
    </section>
  );
}
