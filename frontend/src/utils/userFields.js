/** Convierte a texto seguro (PostgreSQL/API puede devolver tipos inesperados). */
function asText(value) {
  if (value == null || value === '') return '';
  return String(value).trim();
}

/** Campos de usuario normalizados (PostgreSQL puede devolver firstname en minúsculas). */
export function readUserFields(user) {
  if (!user) {
    return { id: null, email: '', firstName: '', lastName: '', role: 'student', createdAt: null };
  }
  return {
    id: user.id,
    email: asText(user.email),
    firstName: asText(user.firstName ?? user.firstname),
    lastName: asText(user.lastName ?? user.lastname),
    role: asText(user.role) || 'student',
    createdAt: user.createdAt ?? user.createdat ?? null,
  };
}
export function personDisplayName(entity) {
  if (!entity) return 'Usuario';
  const u = readUserFields(entity);
  const fromParts = `${u.firstName} ${u.lastName}`.trim();
  if (fromParts) return fromParts;
  const full = asText(entity.fullName ?? entity.fullname);
  if (full) return full;
  const owner = asText(entity.ownerName ?? entity.ownername);
  if (owner) return owner;
  const author = asText(entity.authorName ?? entity.authorname);
  if (author) return author;
  return u.email || 'Usuario';
}

export function personInitials(entity) {
  const name = personDisplayName(entity);
  if (!name || name === 'Usuario') return '?';
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function userSearchBlob(user) {
  const u = readUserFields(user);
  return `${u.email} ${u.firstName} ${u.lastName}`.toLowerCase();
}
