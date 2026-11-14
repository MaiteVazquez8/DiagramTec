/**
 * Cliente HTTP para el backend Node (diseños, clases, comentarios, admin).
 * Proxy Vite: /api → servidor en desarrollo.
 * La sesión viaja en una cookie HttpOnly que pone la API: el frontend nunca ve el token.
 *
 * Guarda de caché (en memoria, por pestaña):
 * - Las peticiones GET exitosas se guardan durante CACHE_TTL_MS. Si se vuelve a
 *   pedir la misma URL antes de que venza, se responde al instante sin ir al servidor.
 * - Dos GET iguales simultáneos comparten la misma petición (sin duplicados).
 * - Cualquier POST/PUT/DELETE vacía la caché, para no mostrar datos viejos
 *   después de crear, editar o borrar algo.
 * - Cambiar de sesión (login/logout) también la vacía.
 * - Para saltarse la caché en una llamada: api.get(url, { cache: false }).
 */
import axios from 'axios';
import { notifyApiError } from './utils/toastBridge.js';

const CACHE_TTL_MS = 30_000;

const responseCache = new Map();
const inflightRequests = new Map();
/** Se incrementa al vaciar la caché; evita guardar respuestas que empezaron antes del vaciado. */
let cacheGeneration = 0;

export function clearApiCache() {
  cacheGeneration += 1;
  responseCache.clear();
  inflightRequests.clear();
}

const networkAdapter = axios.getAdapter(axios.defaults.adapter);

async function cachingAdapter(config) {
  const method = (config.method || 'get').toLowerCase();

  if (method !== 'get') {
    try {
      return await networkAdapter(config);
    } finally {
      clearApiCache();
    }
  }

  if (config.cache === false) {
    return networkAdapter(config);
  }

  const key = axios.getUri(config);
  const ttl = config.cacheTTL ?? CACHE_TTL_MS;

  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.time < ttl) {
    return { ...cached.response, config };
  }

  const pending = inflightRequests.get(key);
  if (pending) {
    const response = await pending;
    return { ...response, config };
  }

  const generation = cacheGeneration;
  const request = networkAdapter(config)
    .then((response) => {
      if (generation === cacheGeneration) {
        responseCache.set(key, { time: Date.now(), response });
      }
      return response;
    })
    .finally(() => {
      if (inflightRequests.get(key) === request) inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
  return request;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  adapter: cachingAdapter,
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

export default api;
