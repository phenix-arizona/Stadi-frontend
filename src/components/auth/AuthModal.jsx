// src/components/auth/AuthModal.jsx
//
// FIXED VERSION — uses the new atomic `loginSuccess()` helper from
// auth.store.js so tokens + user + role flags + authReady all land in
// one synchronous set() call. This eliminates the race where the page
// behind the modal re-rendered between setTokens() and setUser(),
// saw a token but no user, and bounced to login.

import React, { useState, useRef } from 'react';
import { Phone, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { auth as authAPI } from '../../lib/api';
import useAuthStore from '../../store/auth.store';
import useAppStore  from '../../store/app.store';

const STEP = { PHONE: 'phone', OTP: 'otp' };

export default function AuthModal() {
  // ⬇️ Pull the new `loginSuccess` action instead of setTokens/setUser.
  //    Keep closeAuth for the modal close.
  const { isAuthOpen, closeAuth, loginSuccess } = useAuthStore();
  const { addToast } = useAppStore();

  const [step,     setStep]     = useState(STEP.PHONE);
  const [phone,    setPhone]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');
  const [isNew,    setIsNew]    = useState(false);
  const otpRef = useRef(null);

  function reset() {
    setStep(STEP.PHONE);
    setPhone('');
    setOtp('');
    setErr('');
    setLoading(false);
    setIsNew(false);
  }

  function handleClose() {
    reset();
    closeAuth();
  }

  // ── Step 1: send OTP ──────────────────────────────────────
  async function handlePhoneSubmit(e) {
    e.preventDefault();
    setErr('');

    const cleaned = phone.trim();
    if (!/^\+254\d{9}$/.test(cleaned)) {
      setErr('Enter a valid Kenyan number e.g. +254712345678');
      return;
    }

    setLoading(true);
    try {
      // /auth/register acts as registerOrLogin — creates the user if new,
      // sends an OTP either way.
      let devOtp = null;
      {
        const res = await authAPI.register(cleaned);
        devOtp = res?.data?.dev_otp;
        if (res?.data?.is_new) setIsNew(true);
      }

      setStep(STEP.OTP);
      if (devOtp) {
        setOtp(devOtp);
        addToast(`Dev OTP: ${devOtp}`, 'info', 10000);
      }
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (e) {
      setErr(e?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify OTP ────────────────────────────────────
  async function handleOtpSubmit(e) {
    e.preventDefault();
    setErr('');

    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setErr('Enter the 6-digit code sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(phone.trim(), code);
      // Interceptor unwrapped once → res = { success, data: { user, accessToken, refreshToken } }
      const { accessToken, refreshToken, user } = res.data;

      if (!accessToken || !refreshToken || !user) {
        throw new Error('Login response missing tokens or user.');
      }

      // 🔧 FIX: single atomic call. Writes tokens to localStorage AND
      // sets user, role flags, and authReady=true in one set().
      // No more window between "token saved" and "user saved" where
      // the dashboard could see token-but-no-user and bounce to login.
      loginSuccess({ user, accessToken, refreshToken });

      addToast(`Welcome${user?.name ? ', ' + user.name : ''}!`, 'success', 4000);
      handleClose();
    } catch (e) {
      setErr(e?.message || 'Incorrect or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setErr('');
    setLoading(true);
    try {
      await authAPI.register(phone.trim());
      addToast('New code sent!', 'success', 3000);
    } catch {
      addToast('Could not resend. Please wait a moment.', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isAuthOpen}
      onClose={handleClose}
      title={step === STEP.PHONE ? 'Sign in to Stadi' : 'Enter your code'}
    >
      <div className="p-6">

        {/* ── Phone step ── */}
        {step === STEP.PHONE && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            <p className="text-sm text-stadi-gray">
              Enter your Kenyan phone number. We'll send a one-time code to verify it's you.
            </p>

            <Input
              label="Phone number"
              type="tel"
              placeholder="+254712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={err}
              autoComplete="tel"
              autoFocus
            />

            <Button type="submit" className="w-full" loading={loading} size="lg">
              <Phone size={16} />
              {loading ? 'Sending code…' : 'Send code'}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              By continuing you agree to our{' '}
              <a href="/terms" className="underline hover:text-stadi-green">Terms</a> and{' '}
              <a href="/privacy" className="underline hover:text-stadi-green">Privacy Policy</a>.
            </p>
          </form>
        )}

        {/* ── OTP step ── */}
        {step === STEP.OTP && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <p className="text-sm text-stadi-gray">
              We sent a 6-digit code to <span className="font-semibold text-stadi-dark">{phone}</span>.
              {isNew && ' Welcome to Stadi!'}
            </p>

            <Input
              label="6-digit code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              error={err}
              ref={otpRef}
              autoComplete="one-time-code"
            />

            <Button type="submit" className="w-full" loading={loading} size="lg">
              <ShieldCheck size={16} />
              {loading ? 'Verifying…' : 'Verify & sign in'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep(STEP.PHONE); setErr(''); setOtp(''); }}
                className="text-stadi-gray hover:text-stadi-dark flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Change number
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-stadi-green hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
