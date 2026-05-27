import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

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

    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const updateData = { firstName, lastName, email };
      if (password) {
        updateData.password = password;
      }
      
      const response = await api.put('/auth/me', updateData);
      setUser(response.data.user);
      setMessage('Datos actualizados correctamente');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
      setTimeout(() => navigate('/account'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la cuenta');
    }
  };

  return (
    <section className="figma-sector" id="edit-profile-page">
      <div className="edit-profile-container">
        <h1>Modificar datos</h1>

        <form className="edit-profile-form" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input 
                type="text"
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
                placeholder="Nombre"
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input 
                type="text"
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
                placeholder="Apellido"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Email"
            />
          </div>

          {showPasswordFields && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Contraseña</label>
                  <input 
                    type="password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Tu contraseña..."
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar contraseña</label>
                  <input 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Tu contraseña..."
                  />
                </div>
              </div>
            </>
          )}

          {!showPasswordFields && (
            <button 
              type="button"
              className="change-password-link"
              onClick={() => setShowPasswordFields(true)}
            >
              Cambiar contraseña
            </button>
          )}

          <div className="form-messages">
            {message && <p className="success-text">{message}</p>}
            {error && <p className="error-text">{error}</p>}
          </div>

          <button 
            type="submit"
            className="primary-button"
          >
            Modificar
          </button>
        </form>
      </div>
    </section>
  );
}
