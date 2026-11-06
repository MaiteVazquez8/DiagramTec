import Icon from './Icon.jsx';
import { startGoogleLogin } from '../utils/googleAuth.js';

/** Botón “Continuar con Google” — redirige al flujo OAuth de la API Node. */
export default function GoogleLoginButton({ label = 'Continuar con Google', className = '' }) {
  return (
    <button
      type="button"
      className={`auth-google-btn ${className}`.trim()}
      onClick={startGoogleLogin}
      id="btn-google-login"
    >
      <Icon name="google" size={20} />
      <span>{label}</span>
    </button>
  );
}
