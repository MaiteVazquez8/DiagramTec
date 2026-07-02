import { extractApiError } from './apiError.js';

let handlers = null;

export function registerToastHandlers(nextHandlers) {
  handlers = nextHandlers;
}

export function notifyApiError(err) {
  if (err?.config?.skipErrorToast) return;
  handlers?.showError?.(extractApiError(err));
}

export function notifyError(message) {
  if (!message) return;
  handlers?.showError?.(String(message));
}
