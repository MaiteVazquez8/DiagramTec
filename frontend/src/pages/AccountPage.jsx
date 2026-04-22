import { useEffect, useState } from 'react';
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
    <section className="page-container form-card">
      <h1>Mi cuenta</h1>
      <form onSubmit={handleSave}>
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
        <p>Rol: <strong>{user?.role === 'teacher' ? 'Profesor' : 'Estudiante'}</strong></p>
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit">Guardar cambios</button>
      </form>
    </section>
  );
}
