/** Registro de usuario nuevo vía authApi (PHP). */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../authApi.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { useToast } from '../ToastContext.jsx';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    if (!role) {
      showError('Selecciona un rol');
      return;
    }

    try {
      const response = await authApi.post('/registro.php', {
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
        showError(response.data?.error || 'No se pudo crear la cuenta');
      }
    } catch {
      // El interceptor global ya muestra el toast de error.
    }
  };

  return (
    <section className="page-container auth-page-wrap">
      <article className="form-card auth-card figma-auth-card figma-signup-card">
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
