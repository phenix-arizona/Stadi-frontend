import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set, get) => ({
      language:    'english',
      toasts:      [],
      isOffline:   false,

      setLanguage: (language) => set({ language }),

      addToast: (message, type = 'info', duration = 4000) => {
        const id = Date.now();
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), duration);
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      toast: {
        success: (msg) => useAppStore.getState().addToast(msg, 'success'),
        error:   (msg) => useAppStore.getState().addToast(msg, 'error'),
        info:    (msg) => useAppStore.getState().addToast(msg, 'info'),
      },
    }),
    {
      name: 'stadi-app',
      partialize: (s) => ({ language: s.language }),
    }
  )
);

export default useAppStore;
