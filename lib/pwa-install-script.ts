/**
 * Runs in <head> before React hydrates. Chrome fires `beforeinstallprompt` only once and it can arrive
 * before any component is mounted, so it is parked on `window` for the install banner to pick up.
 * Kept free of 'use client' so the server layout can import the string.
 */
export const installCaptureScript =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__elevariInstallPrompt=e;});";
