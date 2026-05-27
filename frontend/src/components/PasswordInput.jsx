import { useState } from 'react';
import Icon from './Icon.jsx';

export default function PasswordInput({ value, onChange, placeholder = 'Contraseña', label }) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <label className="password-field">
      {label && <span className="password-field-label">{label}</span>}
      <div className="password-field-input-wrap">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="password-field-input"
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          className="password-field-toggle"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Icon name={showPassword ? 'eyeOff' : 'eye'} size={24} />
        </button>
      </div>
    </label>
  );
}
