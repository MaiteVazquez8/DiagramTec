/** OAuth de Google vía la API Node (/auth/google). */
export function getGoogleLoginUrl() {
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${String(base).replace(/\/$/, '')}/auth/google`;
}

export function startGoogleLogin() {
  window.location.href = getGoogleLoginUrl();
}
