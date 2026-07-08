/** Backup local del editor (modo invitado) y redirección tras login/registro. */

export const EDITOR_BACKUP_PREFIX = 'diagramtec_editor_backup';

export function getEditorBackupKey(designId) {
  return `${EDITOR_BACKUP_PREFIX}:${designId || 'new'}`;
}

export function hasNewEditorBackup() {
  return Boolean(peekNewEditorBackup());
}

export function peekNewEditorBackup() {
  try {
    const raw = localStorage.getItem(getEditorBackupKey(null));
    if (!raw) return null;
    const backup = JSON.parse(raw);
    if (!backup?.content) return null;
    const content = typeof backup.content === 'string'
      ? JSON.parse(backup.content)
      : backup.content;
    const hasContent = (content?.shapes?.length ?? 0) > 0
      || (content?.connections?.length ?? 0) > 0;
    return hasContent ? backup : null;
  } catch {
    return null;
  }
}

export function clearNewEditorBackup() {
  try {
    localStorage.removeItem(getEditorBackupKey(null));
  } catch {
    // ignore
  }
}

/** Tras autenticarse, volver al destino previo o a Mis diseños. */
export function resolveAuthRedirect(from) {
  if (typeof from === 'string' && from.length > 0) {
    return from;
  }
  return '/designs';
}
