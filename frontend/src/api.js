import axios from 'axios';

// Todas las peticiones se redirigen al backend Node.js via proxy de Vite (/api → puerto 4002)
const api = axios.create({ baseURL: '/api' });

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
