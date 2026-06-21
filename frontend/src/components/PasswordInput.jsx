/** Campo de contraseña con botón mostrar/ocultar (icono ojo). Usado en login, registro y recuperación. */
import { useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Input de contraseña controlado con toggle de visibilidad.
 * @param {string} value - Valor actual del campo (controlado por el padre)
 * @param {Function} onChange - Handler estándar de input (e) => ...
 * @param {string} [placeholder='Contraseña'] - Texto placeholder del input
 * @param {string} [label] - Etiqueta opcional encima del campo
 */
export default function PasswordInput({ value, onChange, placeholder = 'Contraseña', label }) {
  // Estado local: indica si la contraseña se muestra en texto plano
  const [showPassword, setShowPassword] = useState(false);

  /** Alterna entre type="password" y type="text" */
  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <label className="password-field">
      {/* Etiqueta opcional; solo se renderiza si el padre la pasa */}
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
        {/* Botón tipo button para no enviar el formulario al hacer clic */}
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
