/**
 * Cliente HTTP para login y registro (backend PHP).
 * Proxy Vite: /php-auth → Laragon/Apache.
 */
import axios from 'axios';
import { notifyApiError } from './utils/toastBridge.js';

const authApi = axios.create({
  baseURL: '/api/php-auth',
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
