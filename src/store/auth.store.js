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
      isAdmin:      false,
      isInstructor: false,
      isFinance:    false,
      isHR:         false,

      // ── setTokens ───────────────────────────────────────────
      // Called immediately after verifyOtp succeeds.
      // Saves tokens to localStorage AND Zustand state.
      // Resets the logout guard so future logins work correctly.
      setTokens: (token, refreshToken) => {
        localStorage.setItem('stadi_token', token);
        localStorage.setItem('stadi_refresh', refreshToken);
        isLoggingOut = false; // reset guard on fresh login
        set({ token, refreshToken });
      },

      // ── setUser ─────────────────────────────────────────────
      // Derives all role flags in one atomic update so they are
      // always in sync. Called after verifyOtp with the user from
      // the API response — no fetchMe needed after login.
      setUser: (user) => set({
        user,
        isLoggedIn:   !!user,
        isAdmin:      ['admin', 'super_admin'].includes(user?.role),
        isInstructor: ['instructor', 'admin', 'super_admin'].includes(user?.role),
        isFinance:    ['finance', 'admin', 'super_admin'].includes(user?.role),
        isHR:         ['hr', 'admin', 'super_admin'].includes(user?.role),
      }),

      openAuth:  () => set({ isAuthOpen: true }),
      closeAuth: () => set({ isAuthOpen: false }),

      // ── loginSuccess ─────────────────────────────────────────
      // Single atomic action called by AuthModal after verifyOtp.
      // Writes tokens to localStorage AND sets user + role flags
      // in ONE set() call — no render window between token saved
      // and user saved where ProtectedRoute could see token-but-no-user
      // and bounce back to login.
      loginSuccess: ({ user, accessToken, refreshToken }) => {
        localStorage.setItem('stadi_token', accessToken);
        localStorage.setItem('stadi_refresh', refreshToken);
        isLoggingOut = false;
        set({
          token:        accessToken,
          refreshToken: refreshToken,
          user,
          isLoggedIn:   true,
          isAdmin:      ['admin', 'super_admin'].includes(user?.role),
          isInstructor: ['instructor', 'admin', 'super_admin'].includes(user?.role),
          isFinance:    ['finance', 'admin', 'super_admin'].includes(user?.role),
          isHR:         ['hr', 'admin', 'super_admin'].includes(user?.role),
        });
      },

      // ── fetchMe ─────────────────────────────────────────────
      // Refreshes the user profile from the server.
      // Called on app mount (to pick up role changes made by admin)
      // and on tab visibility restore.
      //
      // CRITICAL GUARDS:
      //  1. No token → skip entirely (avoids 401 flood for guests)
      //  2. Logout in progress → skip (avoids race with doLogout)
      //  3. Already fetching → return cached user (avoids stampede)
      //  4. On 401 → logout only if we still have a token in state
      //     (avoids logging out a user whose token just expired and
      //     was already refreshed by the axios interceptor)
      fetchMe: async () => {
        const token = get().token || localStorage.getItem('stadi_token');
        if (!token)      return null;
        if (isLoggingOut) return null;
        if (isFetchingMe) return get().user;

        isFetchingMe = true;
        set({ isLoading: true });

        try {
          const res  = await authAPI.me();
          // api.js interceptor unwraps res.data, so shape is:
          // { success: true, data: { id, role, name, ... } }
          const user = res?.data ?? res;
          if (!user?.id) throw new Error('Invalid user response');

          set({
            user,
            isLoggedIn:   true,
            isAdmin:      ['admin', 'super_admin'].includes(user.role),
            isInstructor: ['instructor', 'admin', 'super_admin'].includes(user.role),
            isFinance:    ['finance', 'admin', 'super_admin'].includes(user.role),
            isHR:         ['hr', 'admin', 'super_admin'].includes(user.role),
            isLoading:    false,
          });
          return user;
        } catch (err) {
          set({ isLoading: false });
          const status = err?.status ?? err?.response?.status;
          // Only logout on 401 if we still have a token — if the
          // axios interceptor already refreshed it, the token in
          // state will have changed and we should NOT logout.
          if (status === 401 && get().token) {
            get().logout();
          }
          return null;
        } finally {
          isFetchingMe = false;
        }
      },

      // ── logout ──────────────────────────────────────────────
      // Concurrent-safe: second call within 2s is a no-op.
      // Clears both localStorage and Zustand state atomically.
      logout: async () => {
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

        // Release guard after redirect completes
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
