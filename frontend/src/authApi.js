/**
 * Cliente HTTP para login y registro (backend PHP).
 * Proxy Vite: /php-auth → Laragon/Apache.
 */
import axios from 'axios';
import { notifyApiError } from './utils/toastBridge.js';

const authApiBaseUrl = import.meta.env.VITE_PHP_AUTH_URL || '/api/php-auth';

const authApi = axios.create({
  baseURL: authApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    notifyApiError(error);
    return Promise.reject(error);
  },
);

export default authApi;
