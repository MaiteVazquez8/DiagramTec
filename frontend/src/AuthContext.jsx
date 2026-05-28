/**
 * Contexto global de sesión: user, token, login, logout, loading.
 * Token en localStorage (clave: tecdiagram_token).
 * Sincroniza login/logout entre pestañas con el evento storage.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAuthToken } from './api.js';

const AUTH_TOKEN_KEY = 'tecdiagram_token';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || '');

  const clearSessionState = useCallback(() => {
    setToken('');
    setUser(null);
    setAuthToken(null);
    setLoading(false);
  }, []);

  // Validar token y cargar usuario
  useEffect(() => {
    if (!token) {
      clearSessionState();
      return;
    }

    setAuthToken(token);
    setLoading(true);
    api.get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        clearSessionState();
        localStorage.removeItem(AUTH_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, [token, clearSessionState]);

  // Otra pestaña inició o cerró sesión (storage no se dispara en la misma pestaña)
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== AUTH_TOKEN_KEY) return;

      const nextToken = event.newValue || '';
      if (!nextToken) {
        clearSessionState();
        return;
      }

      setToken(nextToken);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [clearSessionState]);

  const login = (newToken) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    clearSessionState();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
