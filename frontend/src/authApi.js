/**
 * Cliente HTTP exclusivo para autenticación (login y registro) contra backend PHP.
 * Desarrollo: proxy Vite → Node → PHP. Producción: VITE_PHP_AUTH_URL (Hostinger).
 */
import axios from 'axios';
import { notifyApiError } from './utils/toastBridge.js';

// Ruta distinta a api.js porque el auth vive en PHP, no en Node
const authApiBaseUrl = import.meta.env.VITE_PHP_AUTH_URL || '/api/php-auth';

const authApi = axios.create({
  baseURL: authApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mismo patrón que api.js: toast automático en errores HTTP
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    notifyApiError(error);
    return Promise.reject(error);
  },
);

export default authApi;
