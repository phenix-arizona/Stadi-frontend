/**
 * AuthModal.jsx
 *
 * Single unified auth flow for Stadi: phone → OTP → signed in.
 *
 * ROOT CAUSE OF THE BUG BEING FIXED HERE:
 * The modal was calling POST /auth/login which requires the user to
 * already exist in the database. New users received:
 *   "No account found for this number. Please register first."
 * — but there was no way to register from the same screen.
 *
 * FIX: Always call POST /auth/register (→ authService.registerOrLogin).
 * That endpoint creates the user if they are new, then sends the OTP
 * either way. New users and returning users both get an OTP. No
 * separate "register vs login" distinction is needed in the UI.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Phone, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { auth as authAPI } from '../../lib/api';
import useAuthStore from '../../store/auth.store';
import useAppStore  from '../../store/app.store';

const STEP = { PHONE: 'phone', OTP: 'otp' };
const RESEND_COOLDOWN = 60; // seconds

// ── Phone normaliser ──────────────────────────────────────────
// Accepts: 07XXXXXXXX  |  +2547XXXXXXXX  |  2547XXXXXXXX
function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('0')   && digits.length === 10)  return '+254' + digits.slice(1);
  if (digits.startsWith('7')   && digits.length === 9)   return '+254' + digits;
  return null;
}

export default function AuthModal() {
  const { isAuthOpen, closeAuth, setTokens, setUser } = useAuthStore();
  const { addToast } = useAppStore();

  const [step,     setStep]    = useState(STEP.PHONE);
  const [phone,    setPhone]   = useState('');
  const [otp,      setOtp]     = useState('');
  const [loading,  setLoading] = useState(false);
  const [errorMsg, setError]   = useState('');
  const [cd,       setCd]      = useState(0);

  const otpRef = useRef(null);

  // Reset every time the modal opens
  useEffect(() => {
    if (isAuthOpen) {
      setStep(STEP.PHONE);
      setPhone('');
      setOtp('');
      setError('');
      setCd(0);
    }
  }, [isAuthOpen]);

  // Countdown tick
  useEffect(() => {
    if (cd <= 0) return;
    const t = setTimeout(() => setCd(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  // Auto-focus OTP input
  useEffect(() => {
    if (step === STEP.OTP) setTimeout(() => otpRef.current?.focus(), 80);
  }, [step]);

  // ── Step 1: request OTP ─────────────────────────────────────
  async function handleSendOtp(e) {
    e?.preventDefault();
    setError('');

    const formatted = normalisePhone(phone);
    if (!formatted) {
      setError('Enter a valid Kenyan number — e.g. 0712 345 678 or +254712345678');
      return;
    }

    setLoading(true);
    try {
      // KEY FIX: always call /auth/register (registerOrLogin on the backend).
      // This creates the user if they are new, then sends an OTP.
      // Returning users also get an OTP — no 404, no "register first" wall.
      // We must NEVER call auth.login() from this modal because that endpoint
      // rejects anyone who isn't already in the database.
      await authAPI.register(formatted);

      setPhone(formatted);
      setStep(STEP.OTP);
      setCd(RESEND_COOLDOWN);
    } catch (err) {
      setError(err?.message || 'Could not send code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify OTP ──────────────────────────────────────
  async function handleVerifyOtp(e) {
    e?.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code sent to your phone'); return; }

    setLoading(true);
    try {
      const res  = await authAPI.verifyOtp(phone, otp);
      const data = res.data;
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      addToast(`Welcome${data.user?.name ? ', ' + data.user.name : ''}! 👋`, 'success');
      closeAuth();
    } catch (err) {
      setError(err?.message || 'Invalid or expired code. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────
  async function handleResend() {
    if (cd > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      await authAPI.register(phone); // same endpoint — safe to call again
      setCd(RESEND_COOLDOWN);
      addToast('New code sent!', 'info');
    } catch (err) {
      setError(err?.message || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit when 6 digits are entered
  function handleOtpChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    if (val.length === 6) {
      // Let React flush the state update before submitting
      setTimeout(() => handleVerifyOtp(), 0);
    }
  }

  if (!isAuthOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAuth} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={closeAuth}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stadi-green-light flex items-center justify-center">
              {step === STEP.PHONE
                ? <Phone size={17} className="text-stadi-green" />
                : <ShieldCheck size={17} className="text-stadi-green" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-stadi-dark leading-tight">
                {step === STEP.PHONE ? 'Sign in to Stadi' : 'Verify your number'}
              </h2>
              <p className="text-xs text-stadi-gray">
                {step === STEP.PHONE
                  ? "Enter your Kenyan phone number. We'll send a one-time code to verify it's you."
                  : `Code sent to ${phone}`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <hr className="border-gray-100 mb-5" />

          {/* ── Phone step ── */}
          {step === STEP.PHONE && (
            <form onSubmit={handleSendOtp} noValidate>
              <div className="mb-4">
                <label className="block text-sm font-medium text-stadi-dark mb-1.5">
                  Phone number
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  placeholder="+254793060863"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-all
                    focus:outline-none focus:ring-2 focus:ring-stadi-green focus:border-transparent
                    ${errorMsg ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                />
                {errorMsg && (
                  <p className="text-red-500 text-xs mt-1.5">{errorMsg}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!phone.trim() || loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Phone size={15} />}
                Send code
              </button>
            </form>
          )}

          {/* ── OTP step ── */}
          {step === STEP.OTP && (
            <form onSubmit={handleVerifyOtp} noValidate>
              <div className="mb-4">
                <label className="block text-sm font-medium text-stadi-dark mb-1.5">
                  Enter the 6-digit code
                </label>
                <input
                  ref={otpRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="------"
                  className={`w-full text-center text-3xl font-bold tracking-[0.4em] py-4 rounded-xl border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-stadi-green focus:border-transparent
                    ${errorMsg ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                />
                {errorMsg && (
                  <p className="text-red-500 text-xs mt-1.5 text-center">{errorMsg}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <ShieldCheck size={15} />}
                Verify &amp; Sign in
              </button>

              <div className="flex items-center justify-between mt-4 text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cd > 0 || loading}
                  className="flex items-center gap-1 text-stadi-green font-medium disabled:text-gray-400 disabled:cursor-not-allowed hover:underline text-xs"
                >
                  <RefreshCw size={12} />
                  {cd > 0 ? `Resend in ${cd}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(STEP.PHONE); setOtp(''); setError(''); }}
                  className="text-xs text-stadi-gray hover:text-stadi-dark hover:underline"
                >
                  Change number
                </button>
              </div>
            </form>
          )}

          {/* Legal */}
          <p className="text-center text-xs text-gray-400 mt-5">
            By continuing you agree to our{' '}
            <a href="/terms" className="underline hover:text-stadi-dark" onClick={closeAuth}>Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-stadi-dark" onClick={closeAuth}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
