import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await api.put('/auth/me', { firstName, lastName, email });
      setUser(response.data.user);
      setMessage('Datos actualizados correctamente');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la cuenta');
    }
  };

  return (
    <section className="page-container profile-layout">
      <aside className="panel-card profile-sidebar">
        <div className="avatar-circle" aria-hidden>👤</div>
        <h2>{firstName} {lastName}</h2>
        <p>{email}</p>
        <span className="badge">{user?.role === 'teacher' ? 'Profesor' : 'Estudiante'}</span>
        <div className="profile-actions">
          <Link className="secondary-button" to="/designs">Mis diseños</Link>
          <Link className="secondary-button" to="/classes">Mis clases</Link>
        </div>
      </aside>

      <article className="form-card profile-form">
        <h1>Perfil</h1>
        <p className="small-text">Actualiza tus datos personales para mantener tu cuenta al dia.</p>
        <section className="profile-block-grid">
          <div className="profile-block">
            <div className="profile-block-head">
              <h3>Mis diseños</h3>
              <Link to="/designs">Ver todos</Link>
            </div>
            <div className="mini-cards">
              <div className="mini-card">Vista panel</div>
              <div className="mini-card">Prom y IA</div>
              <div className="mini-card">Diagrama web</div>
            </div>
          </div>
          <div className="profile-block">
            <div className="profile-block-head">
              <h3>Mis clases</h3>
              <Link to="/classes">Ver todos</Link>
            </div>
            <div className="mini-cards">
              <div className="mini-card">Normal class</div>
              <div className="mini-card">Clase 2</div>
              <div className="mini-card">Clase 3</div>
            </div>
          </div>
        </section>
        <form onSubmit={handleSave}>
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
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="submit">Guardar cambios</button>
        </form>
      </article>
    </section>
  );
}
