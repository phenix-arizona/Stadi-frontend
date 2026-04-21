import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Modal, Button } from '../ui';
import useAuthStore from '../../store/auth.store';
import useAppStore  from '../../store/app.store';
import { auth as authAPI } from '../../lib/api';
import { LOGO_ICON } from '../../assets/logo';

const STEPS = { PHONE: 'phone', OTP: 'otp', NAME: 'name', SUCCESS: 'success' };

// Social proof snippets that rotate in the modal
const PROOF_SNIPPETS = [
  { avatar: 'AO', name: 'Achieng', county: 'Kisumu',   result: 'Earning KES 28K/mo in solar' },
  { avatar: 'KN', name: 'Kamau',   county: 'Kakamega', result: 'Runs a phone repair kiosk' },
  { avatar: 'WM', name: 'Wanjiku', county: 'Siaya',    result: 'Tailoring business from home' },
  { avatar: 'OA', name: 'Ochieng', county: 'Homa Bay', result: 'Fish processing, KES 15K/mo' },
];

export default function AuthModal() {
  const { isAuthOpen, closeAuth, setTokens, setUser, fetchMe } = useAuthStore();
  const { addToast } = useAppStore();

  const [step,       setStep]      = useState(STEPS.PHONE);
  const [phone,      setPhone]     = useState('');
  const [rawPhone,   setRawPhone]  = useState('');
  const [name,       setName]      = useState('');
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState('');
  const [isNewUser,  setIsNewUser] = useState(false);
  const [digits,     setDigits]    = useState(['','','','','','']);
  const [proofIdx,   setProofIdx]  = useState(0);
  const [resendCd,   setResendCd]  = useState(0);

  // Rotate social proof every 3s
  useEffect(() => {
    const t = setInterval(() => setProofIdx(i => (i + 1) % PROOF_SNIPPETS.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setInterval(() => setResendCd(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCd]);

  const fmt = raw => {
    const d = raw.replace(/\D/g, '');
    if (d.startsWith('0') && d.length <= 10)   return '+254' + d.slice(1);
    if (d.startsWith('254') && d.length <= 12)  return '+' + d;
    if (d.startsWith('7') || d.startsWith('1')) return '+254' + d;
    return d ? '+' + d : '';
  };

  const onPhoneChange = e => {
    setRawPhone(e.target.value);
    setPhone(fmt(e.target.value));
    setError('');
  };

  const sendOtp = async () => {
    if (!phone.match(/^\+254\d{9}$/)) { setError('Enter a valid Kenyan number, e.g. 0712 345 678'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.register(phone);
      setIsNewUser(!res.data?.existing);
      setStep(STEPS.OTP);
      setResendCd(30);
    } catch (e) { setError(e?.message || 'Failed to send code. Try again.'); }
    finally { setLoading(false); }
  };

  const onDigit = (i, v) => {
    if (v.length > 1) return;
    const next = [...digits];
    next[i] = v.replace(/\D/g, '');
    setDigits(next);
    if (v && i < 5) document.getElementById(`sd-${i+1}`)?.focus();
  };
  const onDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) document.getElementById(`sd-${i-1}`)?.focus();
  };
  // Paste handler
  const onPaste = e => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    const next = [...digits];
    pasted.split('').forEach((c,i) => { if(i<6) next[i]=c; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    document.getElementById(`sd-${lastFilled}`)?.focus();
  };

  const verifyOtp = async () => {
    const code = digits.join('');
    if (code.length !== 6) { setError('Enter the full 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.verifyOtp(phone, code);
      setTokens(res.data.accessToken, res.data.refreshToken);
      if (isNewUser && !res.data.user?.name) { setStep(STEPS.NAME); }
      else { setUser(res.data.user); setStep(STEPS.SUCCESS); setTimeout(() => { closeAuth(); reset(); }, 2000); }
    } catch (e) { setError(e?.message || 'Incorrect code. Please try again.'); }
    finally { setLoading(false); }
  };

  const saveName = async () => {
    setLoading(true);
    try {
      const { userAPI } = await import('../../lib/api');
      if (name.trim()) await userAPI.updateProfile({ name: name.trim() });
      const user = await fetchMe();
      setUser(user);
      setStep(STEPS.SUCCESS);
      setTimeout(() => { closeAuth(); reset(); }, 2000);
    } catch { setStep(STEPS.SUCCESS); setTimeout(() => { closeAuth(); reset(); }, 1500); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep(STEPS.PHONE); setPhone(''); setRawPhone(''); setName('');
    setError(''); setDigits(['','','','','','']); setResendCd(0);
  };

  const proof = PROOF_SNIPPETS[proofIdx];
  const allDigitsFilled = digits.join('').length === 6;

  return (
    <Modal isOpen={isAuthOpen} onClose={() => { closeAuth(); reset(); }} size="sm">
      {/* ── SUCCESS ─────────────────────────────────────────── */}
      {step === STEPS.SUCCESS && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-stadi-green rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-stadi-dark mb-1">You're in</h2>
          <p className="text-stadi-gray text-sm">Welcome to Stadi. Start browsing courses.</p>
        </div>
      )}

      {/* ── PHONE ───────────────────────────────────────────── */}
      {step === STEPS.PHONE && (
        <div>
          {/* Top banner with logo + value prop */}
          <div className="bg-gradient-to-br from-stadi-green to-[#155a3e] px-6 py-5 text-white text-center">
            <img src={LOGO_ICON} alt="Stadi" className="w-12 h-12 rounded-xl mx-auto mb-3 bg-white/10 p-1.5 object-contain" />
            <h2 className="text-xl font-bold mb-1">Start Learning for Free</h2>
            <p className="text-white/80 text-sm">Browse every course — pay only when you're ready.</p>
          </div>

          {/* Rotating social proof */}
          <div className="mx-6 mt-4 mb-1 flex items-center gap-2.5 bg-stadi-orange-light border border-stadi-orange/20 rounded-xl px-3 py-2.5 transition-all">
            <span className="text-xl shrink-0">{proof.avatar}</span>
            <div className="text-xs">
              <span className="font-semibold text-stadi-dark">{proof.name}</span>
              <span className="text-stadi-gray"> from {proof.county} — </span>
              <span className="text-stadi-orange font-semibold">{proof.result}</span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-3 space-y-3">
            {/* Phone field */}
            <div>
              <label className="block text-sm font-semibold text-stadi-dark mb-1.5">
                Your phone number
              </label>
              <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors
                ${error ? 'border-red-400' : 'border-gray-200 focus-within:border-stadi-green'}`}>
                <span className="px-3 py-3.5 bg-gray-50 text-stadi-gray text-sm font-medium border-r border-gray-200 shrink-0">
                  +254
                </span>
                <input
                  type="tel" inputMode="numeric" autoFocus
                  placeholder="712 345 678"
                  value={rawPhone} onChange={onPhoneChange}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  className="flex-1 px-3 py-3.5 text-sm focus:outline-none bg-white placeholder-gray-400"
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
              {phone && !error && (
                <p className="text-xs text-stadi-gray mt-1.5">
                  We'll send a 6-digit code to <strong>{phone}</strong>
                </p>
              )}
            </div>

            <Button variant="primary" className="w-full" size="lg" loading={loading} onClick={sendOtp}>
              Continue <ChevronRight size={16} />
            </Button>

            {/* Trust signals — compact */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { text:'No password needed' },
                { text:'No spam, ever' },
                { text:'Built for Kenya' },
                { text:'Free to browse' },
              ].map(t => (
                <div key={t.text} className="flex items-center gap-1.5 text-xs text-stadi-gray">
                  {t.text}
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-gray-400 pt-1">
              By continuing you agree to our <a href="/terms" className="underline">Terms</a> & <a href="/privacy" className="underline">Privacy</a>
            </p>
          </div>
        </div>
      )}

      {/* ── OTP ─────────────────────────────────────────────── */}
      {step === STEPS.OTP && (
        <div className="p-6">
          <button onClick={() => { setStep(STEPS.PHONE); setError(''); setDigits(['','','','','','']); }}
            className="flex items-center gap-1.5 text-sm text-stadi-gray hover:text-stadi-green mb-5 transition-colors">
            <ArrowLeft size={15} /> Back
          </button>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-stadi-dark">Check your phone</h2>
            <p className="text-stadi-gray text-sm mt-1.5">
              We sent a 6-digit code to<br/>
              <strong className="text-stadi-dark">{phone}</strong>
            </p>
          </div>

          {/* OTP digit boxes */}
          <div className="flex justify-center gap-2 mb-4" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input key={i} id={`sd-${i}`}
                type="text" inputMode="numeric" maxLength={1}
                value={d} onChange={e => onDigit(i, e.target.value)}
                onKeyDown={e => onDigitKey(i, e)}
                autoFocus={i === 0}
                className={`w-11 h-13 text-center text-2xl font-bold border-2 rounded-xl transition-all
                  focus:outline-none focus:border-stadi-green
                  ${d ? 'border-stadi-green bg-stadi-green-light text-stadi-green' : 'border-gray-200 bg-white'}`}
                style={{ height: '52px' }}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <Button variant="primary" className="w-full mb-3" loading={loading}
            disabled={!allDigitsFilled} onClick={verifyOtp}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>

          <div className="text-center">
            {resendCd > 0 ? (
              <p className="text-xs text-stadi-gray">Resend code in <strong>{resendCd}s</strong></p>
            ) : (
              <button onClick={() => { sendOtp(); }}
                className="text-sm text-stadi-green hover:underline">
                Didn't get it? Resend code
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── NAME ────────────────────────────────────────────── */}
      {step === STEPS.NAME && (
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-stadi-dark">Welcome to Stadi!</h2>
            <p className="text-stadi-gray text-sm mt-1">What should we call you?</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-stadi-dark mb-1.5">Your name</label>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="e.g. Achieng Otieno"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-stadi-green focus:outline-none text-sm transition-colors"
              />
            </div>
            <Button variant="primary" className="w-full" size="lg" loading={loading}
              disabled={!name.trim()} onClick={saveName}>
              Let's go
            </Button>
            <button onClick={saveName} className="block mx-auto text-xs text-gray-400 hover:underline">
              Skip for now
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
