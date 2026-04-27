import { useEffect, useRef, useCallback } from 'react';
import useAuthStore from '../store/auth.store';

// ============================================================
// useSessionExpiry
// ============================================================
// Manages three distinct session-expiry scenarios:
//
//  1. IDLE TIMEOUT
//     User has not moved the mouse / touched the screen / pressed
//     a key for IDLE_TIMEOUT_MS. Show a warning modal; if they
//     don't interact within WARNING_DURATION_MS, log them out.
//     Idle timer resets on any user interaction event.
//
//  2. SILENT TOKEN REFRESH
//     Access tokens live 15 minutes. This hook silently calls
//     /api/auth/refresh REFRESH_BEFORE_EXPIRY_MS before the
//     token expires so the user never hits a 401 mid-session.
//     The refresh schedule is recalculated every time a new
//     token is issued.
//
//  3. TAB VISIBILITY RE-VALIDATION
//     When the user returns to a hidden tab, the token may have
//     expired while they were away. We check immediately on
//     visibilitychange and either refresh silently or log out.
//
// Usage:
//   Call once in your top-level authenticated layout:
//
//     const { showWarning, secondsLeft, staySignedIn } = useSessionExpiry();
//
//   Then render <SessionWarningModal> with those props.
// ============================================================

const IDLE_TIMEOUT_MS         = 20 * 60 * 1000; // 20 min of inactivity → warn
const WARNING_DURATION_MS     =  2 * 60 * 1000; //  2 min to respond before logout
const REFRESH_BEFORE_EXPIRY_MS =  2 * 60 * 1000; //  refresh token 2 min before it expires
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

export function useSessionExpiry({ onWarning, onDismiss, onLogout }) {
  // BUG FIX: auth.store exports `setTokens(token, refreshToken)`, not `setToken`.
  // Also need `loginSuccess` to atomically update both tokens in state + localStorage.
  const { token, refreshToken, logout, setTokens } = useAuthStore();

  const idleTimerRef    = useRef(null);
  const warningTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const isWarningRef    = useRef(false);

  // ── Logout helper ──────────────────────────────────────────
  const forceLogout = useCallback((reason = 'session_expired') => {
    clearAllTimers();
    logout();
    onLogout?.(reason);
  }, [logout, onLogout]);

  // ── Clear all timers ───────────────────────────────────────
  function clearAllTimers() {
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);
    clearTimeout(refreshTimerRef.current);
  }

  // ── Silent token refresh ───────────────────────────────────
  const silentRefresh = useCallback(async () => {
    if (!refreshToken) return forceLogout('no_refresh_token');

    try {
      const res = await fetch('/api/auth/refresh', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return forceLogout('refresh_expired');

      // BUG FIX: Backend wraps response in { success, data: { accessToken, refreshToken } }
      // and does NOT return expiresIn — parse the JWT directly for the expiry.
      const json = await res.json();
      const { accessToken: newAccess, refreshToken: newRefresh } = json?.data ?? json;

      if (!newAccess) return forceLogout('refresh_invalid_response');

      // BUG FIX: Must persist the new refreshToken too — old code discarded it,
      // meaning the next silent refresh would send an already-rotated (invalid) token.
      setTokens(newAccess, newRefresh || refreshToken);

      // Schedule next refresh based on the new token's exp claim
      const secondsLeft = getTokenExpiresIn(newAccess);
      if (secondsLeft > 0) scheduleRefresh(secondsLeft);
    } catch {
      // Network error — don't log out; retry on next visibility change
    }
  }, [refreshToken, forceLogout, setTokens]);

  // ── Schedule the next silent refresh ──────────────────────
  // expiresIn: seconds until the current access token expires
  const scheduleRefresh = useCallback((expiresIn) => {
    clearTimeout(refreshTimerRef.current);
    const delay = Math.max(0, expiresIn * 1000 - REFRESH_BEFORE_EXPIRY_MS);
    refreshTimerRef.current = setTimeout(silentRefresh, delay);
  }, [silentRefresh]);

  // ── Parse token expiry ─────────────────────────────────────
  function getTokenExpiresIn(accessToken) {
    try {
      // JWT payload is base64url-encoded — decode without a library
      const payload = JSON.parse(
        atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
      return secondsLeft;
    } catch {
      return 0;
    }
  }

  // ── Reset idle timer ───────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (isWarningRef.current) return; // don't reset while warning is showing
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      // User has been idle — show warning
      isWarningRef.current = true;
      onWarning?.();

      // Give them WARNING_DURATION_MS to respond
      warningTimerRef.current = setTimeout(() => {
        forceLogout('idle_timeout');
      }, WARNING_DURATION_MS);
    }, IDLE_TIMEOUT_MS);
  }, [forceLogout, onWarning]);

  // ── "Stay signed in" handler (called from modal) ──────────
  const staySignedIn = useCallback(() => {
    isWarningRef.current = false;
    clearTimeout(warningTimerRef.current);
    onDismiss?.();
    resetIdleTimer();
    // Also proactively refresh the token so a 20-min idle session
    // that's close to the 15-min token expiry doesn't 401 immediately
    silentRefresh();
  }, [resetIdleTimer, silentRefresh, onDismiss]);

  // ── Tab visibility re-validation ──────────────────────────
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState !== 'visible') return;
    if (!token) return;

    const secondsLeft = getTokenExpiresIn(token);
    if (secondsLeft <= 0) {
      // Token already expired while tab was hidden — try silent refresh
      silentRefresh();
    } else if (secondsLeft < REFRESH_BEFORE_EXPIRY_MS / 1000) {
      // About to expire — refresh immediately rather than waiting for timer
      silentRefresh();
    }
    // Either way, reset the idle timer (returning to the tab = activity)
    resetIdleTimer();
  }, [token, silentRefresh, resetIdleTimer]);

  // ── Bootstrap on mount / token change ─────────────────────
  useEffect(() => {
    if (!token) return; // not logged in — nothing to manage

    const secondsLeft = getTokenExpiresIn(token);
    if (secondsLeft > 0) {
      scheduleRefresh(secondsLeft);
    } else {
      // Token is already expired on mount (e.g. page reload after long absence)
      silentRefresh();
    }

    resetIdleTimer();

    // Attach activity listeners
    ACTIVITY_EVENTS.forEach(evt =>
      window.addEventListener(evt, resetIdleTimer, { passive: true })
    );
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach(evt =>
        window.removeEventListener(evt, resetIdleTimer)
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, scheduleRefresh, silentRefresh, resetIdleTimer, handleVisibilityChange]);

  return { staySignedIn, warningDurationMs: WARNING_DURATION_MS };
}
