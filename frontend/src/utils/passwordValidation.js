export const PASSWORD_REQUIREMENTS_MESSAGE =
  'La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula, un número y un caracter especial';

export const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'Mínimo 6 caracteres', test: (value) => value.length >= 6 },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (value) => /[A-Z]/.test(value) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (value) => /[a-z]/.test(value) },
  { id: 'number', label: 'Un número', test: (value) => /\d/.test(value) },
  { id: 'special', label: 'Un caracter especial', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function validatePassword(password) {
  if (!STRONG_PASSWORD_RE.test(password)) {
    return { ok: false, error: PASSWORD_REQUIREMENTS_MESSAGE };
  }
  return { ok: true };
}
