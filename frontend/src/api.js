/**
 * Cliente HTTP para el backend Node (diseños, clases, comentarios, admin).
 * Proxy Vite: /api → servidor en desarrollo.
 * El token JWT se inyecta con setAuthToken desde AuthContext.
 */
import axios from 'axios';
import { notifyApiError } from './utils/toastBridge.js';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    notifyApiError(error);
    return Promise.reject(error);
  },
);

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
