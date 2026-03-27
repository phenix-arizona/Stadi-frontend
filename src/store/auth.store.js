import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth as authAPI } from '../lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      refreshToken: null,
      isLoading:    false,
      isAuthOpen:   false,

      setTokens: (token, refreshToken) => {
        localStorage.setItem('stadi_token', token);
        localStorage.setItem('stadi_refresh', refreshToken);
        set({ token, refreshToken });
      },

      setUser: (user) => set({ user }),

      openAuth:  () => set({ isAuthOpen: true }),
      closeAuth: () => set({ isAuthOpen: false }),

      fetchMe: async () => {
        try {
          const res = await authAPI.me();
          set({ user: res.data });
          return res.data;
        } catch { return null; }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch {}
        localStorage.removeItem('stadi_token');
        localStorage.removeItem('stadi_refresh');
        set({ user: null, token: null, refreshToken: null });
      },

      get isLoggedIn() { return !!get().user; },
      get isAdmin()    { return ['admin','super_admin'].includes(get().user?.role); },
      get isInstructor() { return ['instructor','admin','super_admin'].includes(get().user?.role); },
    }),
    {
      name: 'stadi-auth',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user }),
    }
  )
);

export default useAuthStore;
