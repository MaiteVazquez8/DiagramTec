
import axios from 'axios';

// Ahora las peticiones de login, registro, etc. se redirigen a los scripts PHP
const api = axios.create({ baseURL: 'http://localhost/DiagramTec/php/' });

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
