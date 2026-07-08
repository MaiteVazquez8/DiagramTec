export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 50;

/** Solo letras (incluye tildes y ñ). */
const NAME_LETTERS_RE = /^[\p{L}]+$/u;

export function validatePersonName(value, label = 'Nombre') {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return { ok: false, error: `${label} es obligatorio` };
  }

  if (trimmed.length < NAME_MIN_LENGTH) {
    return {
      ok: false,
      error: `${label} debe tener al menos ${NAME_MIN_LENGTH} letras`,
    };
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `${label} no puede superar ${NAME_MAX_LENGTH} caracteres`,
    };
  }

  if (!NAME_LETTERS_RE.test(trimmed)) {
    return {
      ok: false,
      error: `${label} solo puede contener letras (sin números ni símbolos)`,
    };
  }

  return { ok: true, value: trimmed };
}

export function validateUserNames(firstName, lastName) {
  const first = validatePersonName(firstName, 'El nombre');
  if (!first.ok) return first;

  const last = validatePersonName(lastName, 'El apellido');
  if (!last.ok) return last;

  return {
    ok: true,
    firstName: first.value,
    lastName: last.value,
  };
}
