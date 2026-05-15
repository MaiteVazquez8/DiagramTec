import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await api.post('/auth/register', { firstName, lastName, email, password, role });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la cuenta');
    }
  };

  return (
    <section className="page-container auth-layout">
      <article className="auth-info">
        <p className="section-eyebrow">Register</p>
        <h1>Crear cuenta nueva</h1>
        <p>
          Completa tus datos para activar tu perfil y empezar a crear diagramas con guardado en la nube.
        </p>
        <ul>
          <li>Correo de verificacion al registrarte</li>
          <li>Perfil editable desde tu cuenta</li>
          <li>Rol de estudiante o profesor</li>
        </ul>
      </article>

      <article className="form-card auth-card">
        <div className="auth-tabs">
          <Link to="/login">Ingresar</Link>
          <span className="active">Registrarse</span>
        </div>
        <h2>Crear cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Nombre
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label>
              Apellido
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <div className="form-row">
            <PasswordInput
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
            />
            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu contraseña"
            />
          </div>
          <label>
            Rol
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
            </select>
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button full-width" type="submit">Crear cuenta</button>
        </form>
        <p className="small-text">
          ¿Ya tienes cuenta? <Link to="/login">Ingresar</Link>
        </p>
      </article>
    </section>
  );
}
