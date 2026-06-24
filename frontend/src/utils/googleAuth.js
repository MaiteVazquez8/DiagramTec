/**
 * URL de inicio del flujo OAuth de Google (PHP).
 * En dev usa el proxy de Node; en producción, VITE_PHP_AUTH_URL.
 */
export function getGoogleLoginUrl() {
  const base = import.meta.env.VITE_PHP_AUTH_URL;
  if (base) {
    return `${String(base).replace(/\/$/, '')}/google_auth.php?action=login`;
  }
  return '/api/php-auth/google_auth.php?action=login';
}

export function startGoogleLogin() {
  window.location.href = getGoogleLoginUrl();
}
