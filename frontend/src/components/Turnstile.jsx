/**
 * Cloudflare Turnstile (anti-bots). Sin VITE_TURNSTILE_SITE_KEY no se muestra nada
 * y el backend en desarrollo tampoco lo exige.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
let scriptPromise;

function loadTurnstile() {
  scriptPromise ||= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('No se pudo cargar Turnstile'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Devuelve el widget a renderizar, el token vigente y reset() para después de cada envío. */
export function useTurnstile(action) {
  const [token, setToken] = useState('');
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let cancelled = false;
    loadTurnstile().then(() => {
      if (cancelled || !containerRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action,
        language: 'es',
        callback: setToken,
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (widgetIdRef.current != null) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [action]);

  // Los tokens son de un solo uso: hay que pedir uno nuevo tras cada envío.
  const reset = useCallback(() => {
    setToken('');
    if (widgetIdRef.current != null) window.turnstile?.reset(widgetIdRef.current);
  }, []);

  return {
    widget: SITE_KEY ? <div ref={containerRef} className="turnstile-box" /> : null,
    token,
    ready: !SITE_KEY || Boolean(token),
    body: SITE_KEY ? { 'cf-turnstile-response': token } : {},
    reset,
  };
}
