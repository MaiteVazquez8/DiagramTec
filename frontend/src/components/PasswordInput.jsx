import { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder = 'Contraseña', label }) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <label style={{ position: 'relative', display: 'block' }}>
      {label && <div>{label}</div>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          style={{ width: '100%', paddingRight: '40px' }}
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--dark-soft)',
            fontSize: '1.2rem',
          }}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </label>
  );
}
