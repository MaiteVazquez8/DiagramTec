/** Registro de usuario nuevo vía authApi (PHP). */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import AppToast from '../components/AppToast.jsx';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!role) {
      setError('Selecciona un rol');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        role,
      });
      if (response.data && response.data.token) {
        login(response.data.token);
        navigate('/');
      } else {
        setError(response.data?.error || 'No se pudo crear la cuenta');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la cuenta');
    }
  };

  return (
    <section className="page-container auth-page-wrap">
      <AppToast error={error} onCloseError={() => setError('')} />
      <article className="form-card auth-card figma-auth-card">
        <div className="auth-tabs">
          <Link to="/login">Iniciar sesion</Link>
          <span className="active">Registrarse</span>
        </div>
        <h2>Crear cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Nombre
              <input placeholder="Tu nombre..." value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label>
              Apellido
              <input placeholder="Tu apellido..." value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
          </div>
          <label>
            Email
            <input type="email" placeholder="Tu email..." value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <div className="form-row">
            <PasswordInput
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña..."
            />
            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Tu contraseña..."
            />
          </div>
          <label>
            Rol
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="" disabled>Rol</option>
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
            </select>
          </label>
          <button className="primary-button full-width" type="submit">Registrarse</button>
        </form>
        <p className="small-text">
          ¿Tenes una cuenta? <Link to="/login">Iniciar sesion</Link>
        </p>
      </article>
    </section>
  );
}
