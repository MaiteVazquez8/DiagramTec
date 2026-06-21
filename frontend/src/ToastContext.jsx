/**
 * Contexto global de notificaciones toast (éxito y error).
 * Registra handlers en toastBridge para que api.js/authApi.js muestren errores
 * sin depender directamente de React. Auto-oculta mensajes a los 3.5 s.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AppToast from './components/AppToast.jsx';
import { registerToastHandlers } from './utils/toastBridge.js';

const ToastContext = createContext(null);

/**
 * Proveedor que gestiona el estado del toast y lo conecta con la capa HTTP.
 */
export function ToastProvider({ children }) {
  // Mensaje de éxito/informativo visible en AppToast
  const [message, setMessage] = useState('');
  // Mensaje de error visible en AppToast (mutuamente excluyente con message)
  const [error, setError] = useState('');

  const showMessage = useCallback((msg) => {
    setError('');
    setMessage(String(msg));
  }, []);

  const showError = useCallback((msg) => {
    setMessage('');
    setError(String(msg));
  }, []);

  const clearMessage = useCallback(() => setMessage(''), []);
  const clearError = useCallback(() => setError(''), []);

  // Conecta showError/showMessage con los interceptores Axios vía toastBridge
  useEffect(() => {
    registerToastHandlers({ showError, showMessage });
    // Al desmontar, desregistra para evitar llamadas a handlers obsoletos
    return () => registerToastHandlers(null);
  }, [showError, showMessage]);

  // Cierra automáticamente cualquier toast activo tras 3.5 segundos
  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, error]);

  // Memoiza el valor del contexto para evitar re-renders innecesarios
  const value = useMemo(
    () => ({ showMessage, showError, clearMessage, clearError }),
    [showMessage, showError, clearMessage, clearError],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast flotante renderizado una sola vez a nivel raíz */}
      <AppToast
        message={message}
        error={error}
        onCloseMessage={clearMessage}
        onCloseError={clearError}
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook para mostrar toasts desde componentes.
 * Lanza error si se usa fuera de ToastProvider (fallo explícito en desarrollo).
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}
