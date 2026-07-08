let activeGuard = null;

export function setEditorLeaveGuard(handler) {
  activeGuard = handler;
}

export function clearEditorLeaveGuard() {
  activeGuard = null;
}

export function requestEditorNavigation(targetPath, navigate) {
  if (activeGuard) {
    activeGuard(targetPath, navigate);
    return;
  }
  navigate(targetPath);
}
