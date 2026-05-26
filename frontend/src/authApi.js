/**
 * Cliente HTTP para login y registro (backend PHP).
 * Proxy Vite: /php-auth → Laragon/Apache.
 */
import axios from 'axios';
const authApi = axios.create({
  baseURL: '/php-auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default authApi;
