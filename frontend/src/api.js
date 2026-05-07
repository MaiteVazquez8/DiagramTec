import axios from 'axios';

const hostname = window.location.hostname;
const API_URL = `http://${hostname}:4000`;
const api = axios.create({ baseURL: API_URL });

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
