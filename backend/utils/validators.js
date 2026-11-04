const dns = require('dns');

/**
 * Validaciones equivalentes a las de los scripts PHP (filter_var / empty()).
 */

/**
 * Equivalente a PHP filter_var($email, FILTER_VALIDATE_EMAIL).
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const value = email.trim();
  if (value === '' || value.length > 254) return false;
  if (/\s/.test(value)) return false;

  const match = value.match(/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)$/);
  if (!match) return false;

  const local = value.slice(0, value.lastIndexOf('@'));
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }

  const domain = match[1];
  if (domain.length > 253 || domain.startsWith('-') || domain.endsWith('-')) return false;
  for (const label of domain.split('.')) {
    if (label === '' || label.length > 63 || label.startsWith('-') || label.endsWith('-')) return false;
  }

  return true;
}

/**
 * Equivalente a PHP empty() para los campos de formulario de texto.
 * (PHP considera vacíos '', '0', 0, null y undefined.)
 */
function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    value === '0' ||
    value === 0 ||
    value === false
  );
}

/**
 * Equivalente a PHP checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A'),
 * usado por el formulario de registro.php para validar el dominio del correo.
 */
async function isValidMailDomain(domain) {
  try {
    await dns.promises.resolveMx(domain);
    return true;
  } catch (err) {
    // sigue con el chequeo A
  }

  try {
    await dns.promises.resolve4(domain);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { isValidEmail, isEmpty, isValidMailDomain };
