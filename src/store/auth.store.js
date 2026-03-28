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
      isLoggedIn:   false,

      setTokens: (token, refreshToken) => {
        localStorage.setItem('stadi_token', token);
        localStorage.setItem('stadi_refresh', refreshToken);
        set({ token, refreshToken });
      },

      setUser: (user) => set({
        user,
        isLoggedIn: !!user,
      }),

      openAuth:  () => set({ isAuthOpen: true }),
      closeAuth: () => set({ isAuthOpen: false }),

      fetchMe: async () => {
        try {
          const res = await authAPI.me();
          set({ user: res.data, isLoggedIn: !!res.data });
          return res.data;
        } catch { return null; }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch {}
        localStorage.removeItem('stadi_token');
        localStorage.removeItem('stadi_refresh');
        set({ user: null, token: null, refreshToken: null, isLoggedIn: false });
      },

      // ✅ Regular functions instead of getters — work correctly with Zustand + Vite
      isAdmin:      () => ['admin', 'super_admin'].includes(get().user?.role),
      isInstructor: () => ['instructor', 'admin', 'super_admin'].includes(get().user?.role),
    }),
    {
      name: 'stadi-auth',
      partialize: (state) => ({
        token:        state.token,
        refreshToken: state.refreshToken,
        user:         state.user,
        isLoggedIn:   state.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;