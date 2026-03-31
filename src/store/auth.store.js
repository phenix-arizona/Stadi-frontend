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

      // setUser now also derives role flags so they are always in sync
      setUser: (user) => set({
        user,
        isLoggedIn:    !!user,
        isAdmin:       ['admin', 'super_admin'].includes(user?.role),
        isInstructor:  ['instructor', 'admin', 'super_admin'].includes(user?.role),
      }),

      // Derived role flags — stored as plain booleans so components can
      // destructure them directly: const { isAdmin } = useAuthStore()
      // and use them as `if (isAdmin)` without calling them as functions.
      isAdmin:       false,
      isInstructor:  false,

      openAuth:  () => set({ isAuthOpen: true }),
      closeAuth: () => set({ isAuthOpen: false }),

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const res = await authAPI.me();
          const user = res.data;
          set({
            user,
            isLoggedIn:   !!user,
            isAdmin:      ['admin', 'super_admin'].includes(user?.role),
            isInstructor: ['instructor', 'admin', 'super_admin'].includes(user?.role),
            isLoading:    false,
          });
          return user;
        } catch {
          set({ isLoading: false });
          return null;
        }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch {}
        localStorage.removeItem('stadi_token');
        localStorage.removeItem('stadi_refresh');
        set({
          user:         null,
          token:        null,
          refreshToken: null,
          isLoggedIn:   false,
          isAdmin:      false,
          isInstructor: false,
        });
      },
    }),
    {
      name: 'stadi-auth',
      partialize: (state) => ({
        token:        state.token,
        refreshToken: state.refreshToken,
        user:         state.user,
        isLoggedIn:   state.isLoggedIn,
        isAdmin:      state.isAdmin,
        isInstructor: state.isInstructor,
      }),
    }
  )
);

export default useAuthStore;