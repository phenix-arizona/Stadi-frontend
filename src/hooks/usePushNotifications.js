import { useCallback, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const PREFS_KEY = 'stadi_push_categories';

async function getVapidKey() {
  const res = await fetch(`${API_BASE}/push/vapid-public-key`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.data?.publicKey) {
    throw new Error(data?.message || 'Failed to load push configuration');
  }
  return data.data.publicKey;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function getOrCreateSubscription(vapidKey) {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }
  return subscription;
}

function loadSavedCategories() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [categories, setCategories] = useState(loadSavedCategories);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        setSubscription(existing);
        setIsSubscribed(true);
      }
    });
  }, []);

  const requestPermission = useCallback(async (selectedCategories = []) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      let result = Notification.permission;
      if (result !== 'granted') {
        result = await Notification.requestPermission();
        setPermission(result);
      }
      if (result !== 'granted') return false;

      const vapidKey = await getVapidKey();
      const nextSubscription = await getOrCreateSubscription(vapidKey);
      const nextCategories = selectedCategories.length ? selectedCategories : ['all'];

      const res = await fetch(`${API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: nextSubscription.toJSON(),
          categories: nextCategories,
        }),
      });

      if (!res.ok) throw new Error('Failed to save notification preferences');

      setSubscription(nextSubscription);
      setIsSubscribed(true);
      setCategories(nextCategories);
      localStorage.setItem(PREFS_KEY, JSON.stringify(nextCategories));
      return true;
    } catch (err) {
      console.error('[Push] requestPermission error:', err);
      return false;
    }
  }, []);

  const updateCategories = useCallback(async (nextCategories) => {
    if (!subscription) return false;
    try {
      const res = await fetch(`${API_BASE}/push/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          categories: nextCategories,
        }),
      });
      if (!res.ok) throw new Error('Failed to update notification preferences');

      setCategories(nextCategories);
      localStorage.setItem(PREFS_KEY, JSON.stringify(nextCategories));
      return true;
    } catch (err) {
      console.error('[Push] updateCategories error:', err);
      return false;
    }
  }, [subscription]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;
    try {
      await subscription.unsubscribe();
      await fetch(`${API_BASE}/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      setSubscription(null);
      setIsSubscribed(false);
      setCategories([]);
      localStorage.removeItem(PREFS_KEY);
      return true;
    } catch (err) {
      console.error('[Push] unsubscribe error:', err);
      return false;
    }
  }, [subscription]);

  return {
    permission,
    isSubscribed,
    categories,
    requestPermission,
    updateCategories,
    unsubscribe,
    supported: 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window,
  };
}
