import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth as authAPI } from '../lib/api';

// ✅ Module-level guard — prevents concurrent fetchMe calls across ALL store instances
let isFetchingMe = false;

// ✅ Module-level logout guard — prevents the redirect loop firing multiple times
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

      setTokens: (token, refreshToken) => {
        localStorage.setItem('stadi_token', token);
        localStorage.setItem('stadi_refresh', refreshToken);
        // ✅ Reset logout guard when new tokens are set (user just logged in)
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

      // Derived role flags — plain booleans for direct destructuring
      isAdmin:       false,
      isInstructor:  false,
      isFinance:     false,
      isHR:          false,

      openAuth:  () => set({ isAuthOpen: true }),
      closeAuth: () => set({ isAuthOpen: false }),

      fetchMe: async () => {
        // ✅ FIX 1 — No token = not logged in. Return immediately.
        // This is the root cause of the 401 flood: without this guard,
        // fetchMe fires → gets 401 → triggers logout → page reloads →
        // fetchMe fires again → infinite loop at ~1 req/sec.
        const token = localStorage.getItem('stadi_token');
        if (!token) return null;

        // ✅ FIX 2 — If a logout is already in progress, don't attempt fetch
        if (isLoggingOut) return null;

        // ✅ Existing guard — prevents parallel concurrent fetchMe calls
        if (isFetchingMe) return get().user;

        isFetchingMe = true;
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
        } catch (err) {
          set({ isLoading: false });
          // ✅ FIX 3 — On 401, call logout() only if not already logging out
          // Previously this could re-trigger the loop
          if (err?.status === 401 || err?.response?.status === 401) {
            get().logout();
          }
          return null;
        } finally {
          // ✅ Always release the fetch lock
          isFetchingMe = false;
        }
      },

      logout: async () => {
        // ✅ FIX 4 — Prevent logout running more than once simultaneously
        // Previously: logout() could be called by both the interceptor AND
        // fetchMe's catch block at the same time, causing a double redirect
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

        // ✅ Release the guard after a short delay so the redirect can complete
        // before any component tries to call fetchMe again
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