/**
 * Utilidad para convertir errores de Axios en mensajes legibles para el usuario.
 */

/**
 * Extrae un mensaje amigable desde un error de petición HTTP.
 * Prioriza el cuerpo de la respuesta, luego códigos HTTP conocidos.
 */
export function extractApiError(err) {
  // Sin respuesta del servidor: error de red o de configuración
  if (!err?.response) {
    if (err?.request) return 'No se pudo conectar con el servidor';
    return err?.message || 'Ocurrió un error inesperado';
  }

  const { status, data } = err.response;
  const msg = data?.error || data?.message;

  if (msg) {
    // Traduce códigos de error del backend a texto en español
    if (msg === 'INVALID_CREDENTIALS') return 'Credenciales inválidas';
    return String(msg);
  }

  // Fallback por código HTTP cuando el backend no envía mensaje
  const statusMessages = {
    400: 'Solicitud inválida',
    401: 'No autorizado',
    403: 'No tienes permiso para esta acción',
    404: 'Recurso no encontrado',
    500: 'Error interno del servidor',
  };

  return statusMessages[status] || `Error ${status}`;
}
