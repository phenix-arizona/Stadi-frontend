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

// FIX 1: Add try/catch + 3 s timeout to waitForHydration.
// Without this, if localStorage is blocked by tracking prevention
// (Edge/Safari ITP), onFinishHydration never fires and the app
// renders a permanent blank page.
function waitForHydration() {
  return new Promise((resolve) => {
    try {
      if (useAuthStore.persist.hasHydrated()) {
        resolve();
        return;
      }
      // Safety timeout — if hydration hasn't finished in 3 s,
      // render anyway with the default unauthenticated state.
      const timeout = setTimeout(resolve, 3000);

      const unsub = useAuthStore.persist.onFinishHydration(() => {
        clearTimeout(timeout);
        unsub();
        resolve();
      });
    } catch {
      // localStorage threw (tracking prevention / private mode).
      // Resolve immediately — Zustand will use its in-memory defaults.
      resolve();
    }
  });
}

// FIX 2: Unregister stale service workers before registering the
// new one. This is the direct cause of React errors #418 and #423.
// A stale SW from a previous deploy serves cached HTML with old
// Vite chunk hashes. New React JS loads but can't reconcile against
// the old DOM structure → hydration mismatch.
async function clearStaleServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
}

async function bootstrap() {
  // Wipe stale SWs first, then hydrate, then render.
  // Order matters — stale SW must be gone before React touches the DOM.
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

  // FIX 3: Only register a SW if the file actually exists.
  // /sw.js is currently returning 404 because vite.config.js has no
  // PWA plugin configured to generate it. Registering a 404 SW
  // installs a broken worker that intercepts requests and serves
  // nothing. Guard with a HEAD check before registering.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const probe = await fetch('/sw.js', { method: 'HEAD' });
        if (!probe.ok) {
          // sw.js doesn't exist yet — skip registration silently.
          // Add vite-plugin-pwa to vite.config.js to generate it.
          return;
        }
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('[PWA] service worker registration failed:', error);
      }
    });
  }
}

bootstrap();