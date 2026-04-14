import { useCallback, useEffect, useState } from 'react';

const DISMISSED_KEY = 'stadi_install_dismissed';
const DISMISS_COOLDOWN_DAYS = 7;

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isRunningAsPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function wasDismissedRecently() {
  const stored = localStorage.getItem(DISMISSED_KEY);
  if (!stored) return false;
  const dismissedAt = parseInt(stored, 10);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_COOLDOWN_DAYS;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.__beforeInstallPromptEvent || null);
  const [platform] = useState(detectPlatform);
  const [isInstalled] = useState(isRunningAsPWA);
  const [showPrompt, setShowPrompt] = useState(() => {
    if (isRunningAsPWA() || wasDismissedRecently()) return false;
    if (detectPlatform() === 'ios') return true;
    return !!window.__beforeInstallPromptEvent;
  });

  useEffect(() => {
    if (isInstalled || wasDismissedRecently()) return undefined;

    const handler = (event) => {
      event.preventDefault();
      window.__beforeInstallPromptEvent = event;
      setDeferredPrompt(event);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isInstalled]);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      window.__beforeInstallPromptEvent = null;
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
  }, []);

  return {
    platform,
    canInstall: !isInstalled && (deferredPrompt !== null || platform === 'ios'),
    isInstalled,
    showPrompt,
    triggerInstall,
    dismiss,
  };
}
