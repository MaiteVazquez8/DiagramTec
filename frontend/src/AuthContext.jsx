/**
 * Contexto global de sesión: user, login, logout, loading.
 * La sesión vive en una cookie HttpOnly que maneja la API (JavaScript no puede leerla,
 * así que un XSS no puede robarla). Acá solo se pide /auth/me para saber quién es.
 * Sincroniza login/logout entre pestañas con un aviso en localStorage (sin datos sensibles).
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api.js';

const AUTH_EVENT_KEY = 'tecdiagram_auth_event';
// Restos de la versión anterior, que guardaba el token en localStorage.
try {
  localStorage.removeItem('tecdiagram_token');
} catch {
  // sin localStorage no hay nada que limpiar
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (attempt = 0) => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me', { skipErrorToast: true });
      setUser(response.data?.user || null);
      return response.data?.user || null;
    } catch (err) {
      const status = err.response?.status;
      // La API puede estar arrancando: reintenta unas veces antes de dar la sesión por cerrada.
      if ((status === 503 || !err.response) && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        return refresh(attempt + 1);
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Otra pestaña inició o cerró sesión (storage no se dispara en la misma pestaña).
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === AUTH_EVENT_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const notifyOtherTabs = () => {
    try {
      localStorage.setItem(AUTH_EVENT_KEY, String(Date.now()));
    } catch {
      // sin localStorage no hay sincronización entre pestañas
    }
  };

  /** Después de que la API puso la cookie (login, registro, Google): carga el usuario. */
  const login = async () => {
    const loaded = await refresh();
    notifyOtherTabs();
    return loaded;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', null, { skipErrorToast: true });
    } catch {
      // aunque falle la red, la sesión local se limpia
    }
    setUser(null);
    notifyOtherTabs();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
