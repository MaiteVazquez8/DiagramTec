function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message || err);

  let statusCode = 500;
  let message = 'Error interno del servidor';

  if (err.message === 'EMAIL_EXISTS') {
    statusCode = 400;
    message = 'El correo ya está registrado';
  } else if (err.message === 'INVALID_CREDENTIALS') {
    statusCode = 401;
    message = 'Credenciales inválidas';
  } else if (err.message === 'EMAIL_NOT_FOUND') {
    statusCode = 404;
    message = 'El correo no existe. Ingresa un correo registrado.';
  } else if (err.message === 'INVALID_TOKEN') {
    statusCode = 400;
    message = 'Correo o token inválido';
  } else if (err.message === 'PASSWORD_MISMATCH') {
    statusCode = 400;
    message = 'Las contraseñas no coinciden';
  } else if (err.message === 'MAIL_FAILED') {
    statusCode = 500;
    message = 'No se pudo enviar el correo. Revisa la configuración de email.';
  } else if (err.message === 'TITLE_REQUIRED') {
    statusCode = 400;
    message = 'El nombre de la clase es obligatorio';
  } else if (err.message === 'CLASS_NOT_FOUND') {
    statusCode = 404;
    message = 'Clase no encontrada';
  } else if (err.message === 'COMMENT_NOT_FOUND') {
    statusCode = 404;
    message = 'Comentario no encontrado';
  } else if (err.message === 'DESIGN_NOT_FOUND') {
    statusCode = 404;
    message = 'Diseño no encontrado';
  } else if (err.message === 'USER_NOT_FOUND') {
    statusCode = 404;
    message = 'Usuario no encontrado';
  } else if (err.message === 'NOT_AUTHORIZED') {
    statusCode = 403;
    message = 'No autorizado';
  } else if (err.message === 'UNAUTHORIZED') {
    statusCode = 403;
    message = 'No autorizado';
  } else if (err.message === 'TITLE_AND_CONTENT_REQUIRED') {
    statusCode = 400;
    message = 'Título y contenido son obligatorios';
  } else if (err.message === 'CANNOT_EXPEL_OWNER') {
    statusCode = 400;
    message = 'No puedes expulsar al dueño de la clase';
  } else if (err.message === 'CANNOT_EXPEL_NON_STUDENT') {
    statusCode = 400;
    message = 'Solo puedes expulsar estudiantes';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;