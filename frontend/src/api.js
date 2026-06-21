/**
 * Cliente HTTP para el backend Node (diseños, clases, comentarios, admin).
 * Proxy Vite: /api → servidor en desarrollo.
 * El token JWT se inyecta con setAuthToken desde AuthContext.
 */
import axios from 'axios';
import { notifyApiError } from './utils/toastBridge.js';

// URL base: variable de entorno o proxy local /api
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

// Instancia Axios reutilizable con cabeceras JSON por defecto
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de respuesta: propaga el error y muestra toast salvo skipErrorToast
api.interceptors.response.use(
  (response) => response,
  (error) => {
    notifyApiError(error);
    return Promise.reject(error);
  },
);

/**
 * Sincroniza el header Authorization de todas las peticiones con el JWT actual.
 * Llamado desde AuthContext al iniciar sesión o al validar token guardado.
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
