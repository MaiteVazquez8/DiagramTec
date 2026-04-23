import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

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
    <section className="page-container form-card">
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label>
          Apellido
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          Confirmar contraseña
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </label>
        <label>
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
          </select>
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit">Crear cuenta</button>
      </form>
      <p>
        ¿Ya tienes cuenta? <Link to="/login">Ingresar</Link>
      </p>
    </section>
  );
}
