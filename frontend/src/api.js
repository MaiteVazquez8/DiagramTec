/**
 * Cliente HTTP para el backend Node (diseños, clases, comentarios, admin).
 * Proxy Vite: /api → servidor en desarrollo.
 * El token JWT se inyecta con setAuthToken desde AuthContext.
 */
import axios from 'axios';
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
