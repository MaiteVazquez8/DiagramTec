/**
 * OAuth Google vía Node (producción Hostinger).
 * Desarrollo local: PHP proxy si no hay VITE_USE_NODE_AUTH.
 */
export function getGoogleLoginUrl() {
  if (import.meta.env.VITE_USE_NODE_AUTH === 'true') {
    const base = import.meta.env.VITE_API_URL || '';
    return `${String(base).replace(/\/$/, '')}/auth/google`;
  }

  const base = import.meta.env.VITE_PHP_AUTH_URL;
  if (base) {
    return `${String(base).replace(/\/$/, '')}/google_auth.php?action=login`;
  }
  return '/api/php-auth/google_auth.php?action=login';
}

export function startGoogleLogin() {
  window.location.href = getGoogleLoginUrl();
}
