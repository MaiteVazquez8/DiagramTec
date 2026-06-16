/** Extrae un mensaje legible desde una respuesta de error de axios. */
export function extractApiError(err) {
  if (!err?.response) {
    if (err?.request) return 'No se pudo conectar con el servidor';
    return err?.message || 'Ocurrió un error inesperado';
  }

  const { status, data } = err.response;
  const msg = data?.error || data?.message;

  if (msg) {
    if (msg === 'INVALID_CREDENTIALS') return 'Credenciales inválidas';
    return String(msg);
  }

  const statusMessages = {
    400: 'Solicitud inválida',
    401: 'No autorizado',
    403: 'No tienes permiso para esta acción',
    404: 'Recurso no encontrado',
    500: 'Error interno del servidor',
  };

  return statusMessages[status] || `Error ${status}`;
}
