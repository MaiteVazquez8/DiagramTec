/**
 * Puente entre la capa HTTP (Axios) y ToastContext.
 * Evita importaciones circulares: los interceptores llaman notifyApiError
 * y ToastProvider registra los handlers reales al montarse.
 */
import { extractApiError } from './apiError.js';

// Referencia mutable a los handlers de React; null hasta que monte ToastProvider
let handlers = null;

/**
 * Registra o limpia los callbacks de toast (showError, showMessage).
 * ToastProvider lo invoca al montar/desmontar.
 */
export function registerToastHandlers(nextHandlers) {
  handlers = nextHandlers;
}

/**
 * Muestra un toast de error derivado de una respuesta Axios.
 * Respeta skipErrorToast en config para silenciar errores esperados (ej. token inválido).
 */
export function notifyApiError(err) {
  if (err?.config?.skipErrorToast) return;
  handlers?.showError?.(extractApiError(err));
}

/**
 * Muestra un toast de error con mensaje ya formateado (sin pasar por extractApiError).
 */
export function notifyError(message) {
  if (!message) return;
  handlers?.showError?.(String(message));
}
