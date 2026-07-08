const VALID_GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);
const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GMAIL_LOCAL_RE = /^[a-z0-9](?:[a-z0-9.]*[a-z0-9])?$/;
const GMAIL_LOCAL_MAX = 64;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function domainLooksLikeGmail(domain) {
  return /^gmail/i.test(domain) || /^googlemail/i.test(domain);
}

function validateGmailLocalPart(localPart) {
  if (!localPart || localPart.length > GMAIL_LOCAL_MAX) {
    return {
      ok: false,
      error: 'Para Gmail, el nombre del correo no es válido',
    };
  }

  if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      ok: false,
      error: 'Para Gmail, el nombre del correo no puede empezar, terminar ni repetir puntos (.)',
    };
  }

  if (!GMAIL_LOCAL_RE.test(localPart)) {
    return {
      ok: false,
      error: 'Para Gmail, el nombre del correo solo puede tener letras, números y puntos (.)',
    };
  }

  return { ok: true };
}

function validateEmail(email) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return { ok: false, error: 'Ingresa un correo electrónico' };
  }

  if (!EMAIL_FORMAT_RE.test(normalized)) {
    return { ok: false, error: 'El correo no tiene un formato válido' };
  }

  const atIndex = normalized.lastIndexOf('@');
  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { ok: false, error: 'El dominio del correo no es válido' };
  }

  if (domainLooksLikeGmail(domain)) {
    if (!VALID_GMAIL_DOMAINS.has(domain)) {
      return {
        ok: false,
        error: 'Usa un correo de Gmail válido (@gmail.com o @googlemail.com)',
      };
    }

    const gmailLocal = validateGmailLocalPart(localPart);
    if (!gmailLocal.ok) {
      return gmailLocal;
    }
  }

  return { ok: true, email: normalized };
}

module.exports = {
  normalizeEmail,
  validateEmail,
};
