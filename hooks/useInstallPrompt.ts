'use client';

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __elevariInstallPrompt?: BeforeInstallPromptEvent;
  }
}

/** native: the browser's own install dialog · ios: Safari "Add to Home Screen" steps · play: the Android app listing. */
export type InstallMode = 'native' | 'ios' | 'play';

const DISMISSED_UNTIL_KEY = 'elevari:install-dismissed-until';
const INSTALLED_KEY = 'elevari:install-done';
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;
const SHOW_AFTER_MS = 12_000;

export const ANDROID_APP_URL = process.env.NEXT_PUBLIC_ANDROID_APP_URL || '';

interface Environment {
  isAndroid: boolean;
  isIosSafari: boolean;
}

function readFlag(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Without storage the banner may come back on the next visit.
  }
}

function detectEnvironment(): Environment | null {
  const ua = navigator.userAgent;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return null;

  const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return {
    isAndroid: /Android/i.test(ua),
    // Other iOS browsers cannot offer "Add to Home Screen" with these steps.
    isIosSafari: isIos && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua),
  };
}

/**
 * Decides whether to offer installing Elevari on this device, after a short delay and never again
 * for two weeks once dismissed. Only phones are targeted; desktops keep the browser's own install icon.
 */
export function useInstallPrompt() {
  const [env, setEnv] = useState<Environment | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (readFlag(INSTALLED_KEY) || Number(readFlag(DISMISSED_UNTIL_KEY) ?? 0) > Date.now()) return;
    const detected = detectEnvironment();
    if (!detected || (!detected.isAndroid && !detected.isIosSafari)) return;

    setEnv(detected);
    setDeferred(window.__elevariInstallPrompt ?? null);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      window.__elevariInstallPrompt = event as BeforeInstallPromptEvent;
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      writeFlag(INSTALLED_KEY, '1');
      window.__elevariInstallPrompt = undefined;
      setHidden(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const timer = window.setTimeout(() => setReady(true), SHOW_AFTER_MS);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    writeFlag(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_FOR_MS));
    setHidden(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    setHidden(true);
    // A captured event can only be prompted once.
    window.__elevariInstallPrompt = undefined;
    setDeferred(null);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') writeFlag(INSTALLED_KEY, '1');
      else writeFlag(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_FOR_MS));
    } catch {
      // The browser refused to show its dialog; the banner stays hidden for this visit.
    }
  }, [deferred]);

  let mode: InstallMode | null = null;
  if (ready && env && !hidden) {
    if (env.isAndroid && ANDROID_APP_URL) mode = 'play';
    else if (env.isAndroid && deferred) mode = 'native';
    else if (env.isIosSafari) mode = 'ios';
  }

  return { mode, install, dismiss };
}
