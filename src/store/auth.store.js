/**
 * store/auth.store.js
 *
 * The Zustand auth store was accidentally duplicated: its enhanced version
 * (with the `isLoggingOut` guard) ended up in AuthModal.jsx instead of here.
 * This file is the canonical, definitive auth store that merges both versions.
 *
 * Changes vs the original auth.store.js:
 *  - Added `isLoggingOut` module-level guard to prevent a double-redirect
 *    when both the axios interceptor and fetchMe's catch block call logout()
 *    at the same time.
 *  - Added early-return token check in fetchMe to avoid a 401 flood when
 *    the user is not logged in.
 *  - setTokens() resets the isLoggingOut flag so the guard doesn't block
 *    future logins.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth as authAPI } from '../lib/api';

// Module-level guards — survive re-renders, reset on logout/login
let isFetchingMe = false;
let isLoggingOut = false;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      refreshToken: null,
      isLoading:    false,
      isAuthOpen:   false,
      isLoggedIn:   false,

      // Derived role flags
      isAdmin:       false,
      isInstructor:  false,
      isFinance:     false,
      isHR:          false,

      setTokens: (token, refreshToken) => {
        localStorage.setItem('stadi_token', token);
        localStorage.setItem('stadi_refresh', refreshToken);
        // Reset the logout guard when new tokens arrive (fresh login)
        isLoggingOut = false;
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

      openAuth:  () => set({ isAuthOpen: true }),
      closeAuth: () => set({ isAuthOpen: false }),

      fetchMe: async () => {
        // No token → not logged in; avoid triggering a 401 flood
        const token = localStorage.getItem('stadi_token');
        if (!token) return null;

        // Logout already in progress — don't race
        if (isLoggingOut) return null;

        // Already fetching — return current cached user
        if (isFetchingMe) return get().user;

        isFetchingMe = true;
        set({ isLoading: true });

        try {
          const res  = await authAPI.me();
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
        } catch (err) {
          set({ isLoading: false });
          if (err?.status === 401 || err?.response?.status === 401) {
            get().logout();
          }
          return null;
        } finally {
          isFetchingMe = false;
        }
      },

      logout: async () => {
        // Prevent concurrent logout calls (from interceptor + fetchMe catch)
        if (isLoggingOut) return;
        isLoggingOut = true;

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

        // Release the guard after the redirect has time to complete
        setTimeout(() => { isLoggingOut = false; }, 2000);
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
