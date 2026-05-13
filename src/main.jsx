import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import useAuthStore from './store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function waitForHydration() {
  return new Promise((resolve) => {
    try {
      if (useAuthStore.persist.hasHydrated()) { resolve(); return; }
      const timeout = setTimeout(resolve, 3000);
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        clearTimeout(timeout); unsub(); resolve();
      });
    } catch {
      resolve();
    }
  });
}

// Feature 4: Provide auth token to service worker on request.
// SW uses this to authenticate the offline-manifest and sync-batch requests.
function registerTokenHandler() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'GET_TOKEN') {
      const token = localStorage.getItem('stadi_token');
      event.ports[0]?.postMessage({ token });
    }
  });
}

// Feature 4: Register /sw.js for offline support.
// Guards with a HEAD check so a missing sw.js never installs a broken worker.
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const probe = await fetch('/sw.js', { method: 'HEAD' });
    if (!probe.ok) return; // sw.js not present — skip silently

    const reg = await navigator.serviceWorker.register('/sw.js');

    // Notify the new SW to take over immediately on update
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    console.info('[SW] Registered:', reg.scope);
  } catch (err) {
    console.error('[SW] Registration failed:', err);
  }
}

async function clearStaleServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
}

async function bootstrap() {
  await clearStaleServiceWorkers();
  await waitForHydration();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );

  // Register SW and token handler after React mounts
  window.addEventListener('load', () => {
    registerTokenHandler();
    registerServiceWorker();
  });
}

bootstrap();
