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

      // setUser derives all role flags so they are always in sync
      setUser: (user) => set({
        user,
        isLoggedIn:    !!user,
        isAdmin:       ['admin', 'super_admin'].includes(user?.role),
        isInstructor:  ['instructor', 'admin', 'super_admin'].includes(user?.role),
        isFinance:     ['finance', 'admin', 'super_admin'].includes(user?.role),
        isHR:          ['hr', 'admin', 'super_admin'].includes(user?.role),
      }),

      // Derived role flags — plain booleans for direct destructuring
      isAdmin:       false,
      isInstructor:  false,
      isFinance:     false,
      isHR:          false,

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
            isFinance:    ['finance', 'admin', 'super_admin'].includes(user?.role),
            isHR:         ['hr', 'admin', 'super_admin'].includes(user?.role),
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
          isFinance:    false,
          isHR:         false,
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
        isFinance:    state.isFinance,
        isHR:         state.isHR,
      }),
    }
  )
);

export default useAuthStore;