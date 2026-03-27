import React, { useState } from 'react';
import { Phone, Shield, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import useAuthStore from '../../store/auth.store';
import useAppStore  from '../../store/app.store';
import { auth as authAPI } from '../../lib/api';

const STEPS = { PHONE: 'phone', OTP: 'otp', NAME: 'name', SUCCESS: 'success' };

export default function AuthModal() {
  const { isAuthOpen, closeAuth, setTokens, setUser, fetchMe } = useAuthStore();
  const { addToast } = useAppStore();

  const [step,          setStep]    = useState(STEPS.PHONE);
  const [phone,         setPhone]   = useState('');
  const [rawPhone,      setRawPhone]= useState('');
  const [otp,           setOtp]     = useState('');
  const [name,          setName]    = useState('');
  const [loading,       setLoading] = useState(false);
  const [error,         setError]   = useState('');
  const [isNewUser,     setIsNewUser] = useState(false);
  const [otpDigits,     setOtpDigits] = useState(['','','','','','']);

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length <= 10)      return '+254' + digits.slice(1);
    if (digits.startsWith('254') && digits.length <= 12)    return '+' + digits;
    if (digits.startsWith('7') || digits.startsWith('1'))   return '+254' + digits;
    return digits ? '+' + digits : '';
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    setRawPhone(raw);
    setPhone(formatPhone(raw));
    setError('');
  };

  const handleSendOtp = async () => {
    if (!phone.match(/^\+254\d{9}$/)) {
      setError('Enter a valid Kenyan number, e.g. 0712 345 678');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.register(phone);
      setIsNewUser(!res.data?.existing);
      setStep(STEPS.OTP);
      addToast('OTP sent to ' + phone, 'success');
    } catch (e) {
      setError(e?.message || 'Failed to send OTP. Try again.');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // prevent paste weirdness
    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, '');
    setOtpDigits(newDigits);
    setOtp(newDigits.join(''));
    // Auto-focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.verifyOtp(phone, fullOtp);
      setTokens(res.data.accessToken, res.data.refreshToken);
      if (isNewUser && !res.data.user?.name) {
        setStep(STEPS.NAME);
      } else {
        setUser(res.data.user);
        setStep(STEPS.SUCCESS);
        setTimeout(() => { closeAuth(); resetForm(); }, 1800);
      }
    } catch (e) {
      setError(e?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSaveName = async () => {
    setLoading(true);
    try {
      const { userAPI } = await import('../../lib/api');
      await userAPI.updateProfile({ name: name.trim() });
      const user = await fetchMe();
      setUser(user);
      setStep(STEPS.SUCCESS);
      setTimeout(() => { closeAuth(); resetForm(); }, 1800);
    } catch { setStep(STEPS.SUCCESS); setTimeout(() => { closeAuth(); resetForm(); }, 1500); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setStep(STEPS.PHONE); setPhone(''); setRawPhone('');
    setOtp(''); setName(''); setError(''); setOtpDigits(['','','','','','']);
  };

  const handleClose = () => { closeAuth(); resetForm(); };

  return (
    <Modal isOpen={isAuthOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-stadi-green-light rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-stadi-green" style={{ fontFamily: 'Playfair Display' }}>S</span>
          </div>
          {step === STEPS.PHONE && (
            <>
              <h2 className="text-xl font-bold text-stadi-dark">Join Stadi</h2>
              <p className="text-sm text-stadi-gray mt-1">Learn skills. Start earning. In your language.</p>
            </>
          )}
          {step === STEPS.OTP && (
            <>
              <h2 className="text-xl font-bold text-stadi-dark">Enter your code</h2>
              <p className="text-sm text-stadi-gray mt-1">Sent to <strong>{phone}</strong></p>
            </>
          )}
          {step === STEPS.NAME && (
            <>
              <h2 className="text-xl font-bold text-stadi-dark">Welcome to Stadi! 🎉</h2>
              <p className="text-sm text-stadi-gray mt-1">What should we call you?</p>
            </>
          )}
          {step === STEPS.SUCCESS && (
            <>
              <CheckCircle size={40} className="text-stadi-green mx-auto mb-2" />
              <h2 className="text-xl font-bold text-stadi-dark">You're in!</h2>
              <p className="text-sm text-stadi-gray mt-1">Ready to start earning.</p>
            </>
          )}
        </div>

        {/* Phone Step */}
        {step === STEPS.PHONE && (
          <div className="space-y-4">
            <Input
              label="Kenyan phone number"
              type="tel"
              placeholder="0712 345 678"
              value={rawPhone}
              onChange={handlePhoneChange}
              prefix="+254"
              error={error}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              autoFocus
            />
            {phone && (
              <p className="text-xs text-stadi-gray text-center">
                We'll send a code to <strong>{phone}</strong>
              </p>
            )}
            <Button variant="primary" className="w-full" loading={loading} onClick={handleSendOtp}>
              Send Verification Code <ChevronRight size={16} />
            </Button>

            {/* Security assurances */}
            <div className="bg-stadi-green-light rounded-xl p-3 space-y-1.5">
              {[
                '🔒 OTP-secured login — no password to forget or steal',
                '🛡️ Data protected under Kenya Data Protection Act 2019',
                '🏛️ Platform registered with ODPC (Office of Data Protection Commissioner)',
              ].map(t => (
                <p key={t} className="text-xs text-stadi-green font-medium">{t}</p>
              ))}
            </div>

            {/* Authority logos area */}
            <div className="flex justify-center gap-4 pt-2">
              {['KNQA', 'TVET', 'NITA', 'ODPC'].map(badge => (
                <div key={badge} className="px-2 py-1 border border-gray-200 rounded text-[10px] font-bold text-gray-400">
                  {badge}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OTP Step */}
        {step === STEPS.OTP && (
          <div className="space-y-5">
            <div className="flex justify-center gap-2">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl
                    focus:outline-none focus:border-stadi-green transition-colors
                    ${digit ? 'border-stadi-green bg-stadi-green-light' : 'border-gray-200'}`}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button variant="primary" className="w-full" loading={loading} onClick={handleVerifyOtp}>
              Verify & Continue
            </Button>
            <div className="text-center">
              <button onClick={handleSendOtp} className="text-sm text-stadi-green hover:underline">
                Didn't receive it? Resend code
              </button>
            </div>
            <button onClick={() => { setStep(STEPS.PHONE); setError(''); }} className="block mx-auto text-xs text-gray-400 hover:underline">
              ← Change number
            </button>
          </div>
        )}

        {/* Name Step */}
        {step === STEPS.NAME && (
          <div className="space-y-4">
            <Input
              label="Your full name"
              placeholder="e.g. Achieng Otieno"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && handleSaveName()}
              autoFocus
            />
            <Button variant="primary" className="w-full" loading={loading}
              disabled={!name.trim()} onClick={handleSaveName}>
              Let's go! 🚀
            </Button>
            <button onClick={handleSaveName} className="block mx-auto text-xs text-gray-400 hover:underline">
              Skip for now
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline">Terms</a> &{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
          <br />No spam. No ads. Ever.
        </p>
      </div>
    </Modal>
  );
}
