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

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
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

  useEffect(() => {
    registerToastHandlers({ showError, showMessage });
    return () => registerToastHandlers(null);
  }, [showError, showMessage]);

  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, error]);

  const value = useMemo(
    () => ({ showMessage, showError, clearMessage, clearError }),
    [showMessage, showError, clearMessage, clearError],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AppToast
        message={message}
        error={error}
        onCloseMessage={clearMessage}
        onCloseError={clearError}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}
