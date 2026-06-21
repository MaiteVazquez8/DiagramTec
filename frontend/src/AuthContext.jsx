/**
 * Contexto global de sesión: usuario autenticado, token JWT y acciones login/logout.
 * Persiste el token en localStorage (clave: tecdiagram_token).
 * Sincroniza login/logout entre pestañas mediante el evento storage.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAuthToken } from './api.js';

const AUTH_TOKEN_KEY = 'tecdiagram_token';

const AuthContext = createContext();

/**
 * Proveedor que envuelve la app y expone el estado de autenticación.
 */
export function AuthProvider({ children }) {
  // Usuario devuelto por GET /auth/me (null si no hay sesión)
  const [user, setUser] = useState(null);
  // true mientras se valida el token al cargar o al cambiar de pestaña
  const [loading, setLoading] = useState(true);
  // Inicializa desde localStorage para restaurar sesión al recargar
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || '');

  // Limpia memoria, cabecera Authorization y marca carga como terminada
  const clearSessionState = useCallback(() => {
    setToken('');
    setUser(null);
    setAuthToken(null);
    setLoading(false);
  }, []);

  // Al cambiar el token: validarlo contra el backend y cargar el perfil
  useEffect(() => {
    if (!token) {
      clearSessionState();
      return;
    }

    setAuthToken(token);
    setLoading(true);
    // skipErrorToast evita toast duplicado si el token expiró al abrir la app
    api.get('/auth/me', { skipErrorToast: true })
      .then((response) => setUser(response.data.user))
      .catch(() => {
        // Token inválido o expirado: borrar persistencia y resetear estado
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

      // Dispara el efecto anterior para revalidar el nuevo token
      setToken(nextToken);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [clearSessionState]);

  // Guarda token en localStorage y actualiza estado (el efecto carga el usuario)
  const login = (newToken) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
  };

  // Elimina token persistido y limpia sesión en memoria
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

/** Hook para consumir el contexto de autenticación desde cualquier componente. */
export function useAuth() {
  return useContext(AuthContext);
}
