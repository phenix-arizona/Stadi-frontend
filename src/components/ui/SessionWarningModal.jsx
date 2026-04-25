import { useState, useEffect, useCallback } from 'react';
import { useSessionExpiry } from '../../hooks/useSessionExpiry';
import useAuthStore from '../../store/auth.store';

// ============================================================
// SessionWarningModal + wiring hook
//
// Drop this ONE component into your authenticated layout root.
// It self-manages: it wires up useSessionExpiry internally and
// renders itself when the idle warning fires.
//
// Usage:
//   // In your AuthLayout or App.jsx (inside the auth-guarded tree):
//   import { SessionWarningModal } from '../components/ui/SessionWarningModal';
//
//   export default function AuthLayout() {
//     return (
//       <>
//         <Outlet />
//         <SessionWarningModal />
//       </>
//     );
//   }
//
// That's it — no props required.
// ============================================================

const WARNING_DURATION_S = 120; // must match WARNING_DURATION_MS / 1000 in hook

export function SessionWarningModal() {
  const { logout }                  = useAuthStore();
  const [visible,   setVisible]     = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_DURATION_S);
  const countdownRef                = { current: null };

  // ── Start countdown when warning fires ──────────────────
  const startCountdown = useCallback(() => {
    setVisible(true);
    setSecondsLeft(WARNING_DURATION_S);

    let remaining = WARNING_DURATION_S;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(countdownRef.current);
    }, 1000);
  }, []);

  const stopCountdown = useCallback(() => {
    clearInterval(countdownRef.current);
    setVisible(false);
    setSecondsLeft(WARNING_DURATION_S);
  }, []);

  const handleLogout = useCallback(() => {
    stopCountdown();
    logout();
  }, [stopCountdown, logout]);

  const { staySignedIn } = useSessionExpiry({
    onWarning: startCountdown,
    onDismiss: stopCountdown,
    onLogout:  handleLogout,
  });

  const handleStay = useCallback(() => {
    stopCountdown();
    staySignedIn();
  }, [stopCountdown, staySignedIn]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(countdownRef.current), []);

  if (!visible) return null;

  // Format MM:SS
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  // Warning colour: red when under 30s, amber under 60s, green otherwise
  const urgency =
    secondsLeft <= 30 ? 'text-red-600' :
    secondsLeft <= 60 ? 'text-amber-500' :
                        'text-stadi-green';

  // Progress arc: 0 → full circle as time runs out
  const pct       = secondsLeft / WARNING_DURATION_S;      // 1 → 0
  const radius    = 28;
  const circ      = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - pct);                     // fills as time runs out

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">

        {/* Countdown ring */}
        <div className="flex justify-center mb-4">
          <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
            {/* Track */}
            <circle
              cx="36" cy="36" r={radius}
              fill="none" stroke="#e5e7eb" strokeWidth="5"
            />
            {/* Progress */}
            <circle
              cx="36" cy="36" r={radius}
              fill="none"
              stroke={secondsLeft <= 30 ? '#dc2626' : secondsLeft <= 60 ? '#f59e0b' : '#1A6B4A'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
            />
          </svg>
          {/* Time label centred in the ring */}
          <span
            className={`absolute mt-[18px] text-lg font-bold tabular-nums ${urgency}`}
            style={{ lineHeight: '36px' }}
          >
            {timeStr}
          </span>
        </div>

        <h2
          id="session-warning-title"
          className="text-lg font-bold text-gray-900 mb-1"
        >
          Still there?
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          You've been inactive for a while. For your security, we'll sign
          you out automatically in{' '}
          <span className={`font-semibold ${urgency}`}>{timeStr}</span>.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
          <button
            onClick={handleStay}
            className="flex-1 py-2.5 rounded-xl bg-stadi-green text-white text-sm font-semibold hover:bg-opacity-90 transition-colors"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
