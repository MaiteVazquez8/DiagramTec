/**
 * Cliente HTTP para login y registro.
 * Producción (Hostinger): Node /auth — PHP no tiene pdo_pgsql para Supabase.
 * Desarrollo local: PHP vía /php-auth o VITE_PHP_AUTH_URL.
 */
import axios from 'axios';
import { notifyApiError } from './utils/toastBridge.js';

const useNodeAuth = import.meta.env.VITE_USE_NODE_AUTH === 'true';

const authApiBaseUrl = useNodeAuth
  ? (import.meta.env.VITE_API_URL || '/api')
  : (import.meta.env.VITE_PHP_AUTH_URL || '/api/php-auth');

const PHP_TO_NODE = {
  '/login.php': '/auth/login',
  '/registro.php': '/auth/register',
  '/token.php': '/auth/recovery-code',
  '/modificarClave.php': '/auth/reset-password',
};

const authApi = axios.create({
  baseURL: authApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use((config) => {
  if (useNodeAuth && config.url && PHP_TO_NODE[config.url]) {
    config.url = PHP_TO_NODE[config.url];
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    notifyApiError(error);
    return Promise.reject(error);
  },
);

export default authApi;
