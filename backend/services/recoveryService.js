const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const {
  findByEmail,
  findByEmailAsIs,
  findUserByEmailAndToken,
  setRecoveryToken,
  resetPassword,
} = require('../repositories/userRepository');
const { enviarMail } = require('./mailService');

/**
 * Equivalente a las funciones de recuperación de contraseña de
 * php/token.php y php/modificarClave.php.
 */

function generateCode() {
  return crypto.randomInt(100000, 999999);
}

function recoveryMailHtml(code) {
  return (
    '<h2>Recuperación de contraseña</h2>' +
    '<p>Solicitaste cambiar tu contraseña.</p>' +
    '<p>Tu código de recuperación es:</p>' +
    `<h1>${code}</h1>` +
    '<p>Este código es de un solo uso.</p>'
  );
}

/**
 * Rama JSON de php/token.php → POST { email }.
 * El email ya viene normalizado (trim + minúsculas) desde el controlador.
 * Devuelve { status, message } o { status, error }.
 */
async function requestRecoveryCode(db, email) {
  const user = await findByEmail(db, email);
  if (!user) {
    return { status: 404, error: 'El correo no existe. Ingresa un correo registrado.' };
  }

  const code = generateCode();
  try {
    const updated = await setRecoveryToken(db, user.id, code);
    if (!updated) {
      return { status: 500, error: 'Error al generar el token.' };
    }
  } catch (err) {
    console.error('[RECOVERY]', err.message || err);
    return { status: 500, error: 'Error al generar el token.' };
  }

  const sent = await enviarMail(user.email, 'Recuperación de contraseña', recoveryMailHtml(code));
  if (!sent) {
    return { status: 500, error: 'No se pudo enviar el correo.' };
  }

  return { status: 200, message: 'Se envió un código al correo.' };
}

/**
 * Rama de formulario de php/token.php → POST enviarToken.
 * El email llega sin normalizar (trim), igual que en PHP.
 * Devuelve { message } con los mensajes exactos del formulario PHP.
 */
async function requestRecoveryCodeForm(db, email) {
  const user = await findByEmailAsIs(db, email);
  if (!user) {
    return { message: 'Usuario no encontrado' };
  }

  const code = generateCode();
  let updated = false;
  try {
    updated = await setRecoveryToken(db, user.id, code);
  } catch (err) {
    console.error('[RECOVERY]', err.message || err);
    updated = false;
  }

  if (!updated) {
    return { message: 'Error al generar token' };
  }

  const sent = await enviarMail(user.email, 'Recuperación de contraseña', recoveryMailHtml(code));
  return { message: sent ? 'Se envió un código al correo' : 'No se pudo enviar el correo' };
}

/**
 * Equivalente a php/modificarClave.php (validación de email + token).
 * Devuelve { ok, status, message } o { ok:false, status, error }.
 */
async function resetPasswordWithCode(db, email, token, password) {
  const user = await findUserByEmailAndToken(db, email, token);
  if (!user) {
    return { ok: false, status: 404, error: 'Correo o token inválido' };
  }

  let updated = false;
  try {
    const hash = await bcrypt.hash(password, 10);
    const newCode = generateCode();
    updated = await resetPassword(db, user.id, hash, newCode);
  } catch (err) {
    console.error('[RECOVERY]', err.message || err);
    updated = false;
  }

  if (!updated) {
    return { ok: false, status: 500, error: 'Error al actualizar contraseña' };
  }

  return { ok: true, status: 200, message: 'Contraseña actualizada correctamente' };
}

module.exports = {
  generateCode,
  recoveryMailHtml,
  requestRecoveryCode,
  requestRecoveryCodeForm,
  resetPasswordWithCode,
};
