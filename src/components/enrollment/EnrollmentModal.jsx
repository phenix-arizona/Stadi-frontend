import React, { useState, useEffect, useRef } from 'react';
import { useNavigate }  from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Phone, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { Modal, Button, Input }  from '../ui';
import { payments }              from '../../lib/api';
import useAuthStore              from '../../store/auth.store';
import useAppStore               from '../../store/app.store';

const STEPS = { PHONE: 'phone', WAITING: 'waiting', SUCCESS: 'success', FAILED: 'failed' };
const POLL_INTERVAL = 3000;   // 3 seconds
const MAX_POLLS     = 40;     // 2 minutes max

export default function EnrollmentModal({ isOpen, onClose, course }) {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const { addToast } = useAppStore();

  const [step,        setStep]      = useState(STEPS.PHONE);
  const [phone,       setPhone]     = useState(user?.phone || '');
  const [loading,     setLoading]   = useState(false);
  const [error,       setError]     = useState('');
  const [paymentId,   setPaymentId] = useState(null);
  const [pollCount,   setPollCount] = useState(0);
  const [receipt,     setReceipt]   = useState(null);
  const pollRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const stopPolling = () => { clearInterval(pollRef.current); pollRef.current = null; };

  const startPolling = (pid) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      setPollCount(count);
      try {
        const res = await payments.poll(pid);
        const p   = res.data;

        if (p.status === 'completed' && p.enrolled) {
          stopPolling();
          setReceipt(p);
          setStep(STEPS.SUCCESS);
        } else if (p.status === 'failed' || p.status === 'cancelled') {
          stopPolling();
          setStep(STEPS.FAILED);
          setError('Payment was not completed. Please try again.');
        } else if (count >= MAX_POLLS) {
          stopPolling();
          setStep(STEPS.FAILED);
          setError('Payment timed out. If M-Pesa was deducted, contact support.');
        }
      } catch (e) {
        // Network hiccup — keep polling
        if (count >= MAX_POLLS) { stopPolling(); setStep(STEPS.FAILED); }
      }
    }, POLL_INTERVAL);
  };

  const handlePay = async () => {
    if (!phone.match(/^\+254\d{9}$/)) {
      setError('Enter a valid Kenyan number e.g. +254712345678');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await payments.initiate(course.id, phone);
      const data = res.data;

      // Free course — enrolled instantly
      if (data.enrolled && data.free) {
        setStep(STEPS.SUCCESS);
        setReceipt({ amount_kes: 0, free: true });
        return;
      }

      setPaymentId(data.paymentId);
      setStep(STEPS.WAITING);
      startPolling(data.paymentId);
    } catch (e) {
      const msg = e?.message || 'Failed to initiate payment. Try again.';
      if (msg.includes('Already enrolled')) {
        addToast('You are already enrolled in this course!', 'info');
        navigate(`/learn/${course.id}`);
        onClose();
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const handleContinue = () => {
    onClose();
    navigate(`/learn/${course.id}`);
  };

  const resetAndClose = () => {
    stopPolling();
    setStep(STEPS.PHONE);
    setPhone(user?.phone || '');
    setError('');
    setPaymentId(null);
    setPollCount(0);
    setReceipt(null);
    onClose();
  };

  const secsElapsed = Math.round(pollCount * POLL_INTERVAL / 1000);
  const progressPct = Math.min(100, (pollCount / MAX_POLLS) * 100);

  if (!course) return null;

  return (
    <Modal isOpen={isOpen} onClose={step === STEPS.WAITING ? undefined : resetAndClose} size="sm">
      <div className="p-6">

        {/* ── PHONE STEP ───────────────────────────────────── */}
        {step === STEPS.PHONE && (
          <>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">{course.categories?.icon_emoji || '📚'}</div>
              <h2 className="text-lg font-bold text-stadi-dark">Enrol in this Course</h2>
              <p className="text-stadi-gray text-sm mt-1 line-clamp-1">{course.title}</p>
            </div>

            {/* Price summary */}
            <div className="bg-stadi-green-light rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-stadi-gray">Course fee</span>
                <span className="font-bold text-stadi-dark">
                  {course.is_free || course.price_kes === 0 ? 'FREE' : `KES ${course.price_kes?.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stadi-gray">Lifetime access</span>
                <span className="text-xs text-stadi-green font-semibold">✓ Included</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stadi-gray">Certificate on completion</span>
                <span className="text-xs text-stadi-green font-semibold">✓ Included</span>
              </div>
            </div>

            {!(course.is_free || course.price_kes === 0) && (
              <div className="mb-4">
                <Input
                  label="M-Pesa phone number"
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  placeholder="+254712345678"
                  error={error}
                  prefix={<Phone size={14} />}
                  onKeyDown={e => e.key === 'Enter' && handlePay()}
                  autoFocus
                />
                <p className="text-xs text-stadi-gray mt-1.5">
                  You'll receive an M-Pesa prompt on this number to complete payment.
                </p>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <Button
              variant="primary" className="w-full mb-3"
              loading={loading} onClick={handlePay}
            >
              {course.is_free || course.price_kes === 0
                ? 'Enrol Free — Start Learning'
                : `Pay KES ${course.price_kes?.toLocaleString()} via M-Pesa`}
            </Button>

            <div className="space-y-1.5">
              {['30-day money-back guarantee','Instant access after payment','Offline download available'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-stadi-gray">
                  <ShieldCheck size={11} className="text-stadi-green shrink-0" /> {f}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── WAITING STEP ─────────────────────────────────── */}
        {step === STEPS.WAITING && (
          <div className="text-center py-4">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1A6B4A" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={24} className="text-stadi-green animate-spin" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-stadi-dark mb-2">Waiting for Payment</h2>
            <p className="text-stadi-gray text-sm mb-4">
              Check your phone for the M-Pesa prompt and <strong>enter your PIN</strong> to complete payment.
            </p>

            <div className="bg-stadi-orange-light rounded-xl p-4 mb-4 text-left">
              <div className="text-xs font-semibold text-stadi-orange mb-2 flex items-center gap-1">
                <Clock size={12} /> What to do right now:
              </div>
              <ol className="text-xs text-stadi-gray space-y-1.5">
                <li>1. Pick up your phone ({phone})</li>
                <li>2. You should see an M-Pesa popup saying "Stadi"</li>
                <li>3. Enter your M-Pesa PIN to confirm payment</li>
                <li>4. This page will update automatically</li>
              </ol>
            </div>

            <p className="text-xs text-stadi-gray">
              Waiting... {secsElapsed}s
              {secsElapsed > 30 && <span className="text-stadi-orange"> — still waiting, no prompt? Try again below</span>}
            </p>

            {secsElapsed > 30 && (
              <button
                onClick={() => { stopPolling(); setStep(STEPS.PHONE); setError(''); setPollCount(0); }}
                className="text-xs text-stadi-green hover:underline mt-3 block mx-auto"
              >
                ← Didn't receive prompt? Start again
              </button>
            )}
          </div>
        )}

        {/* ── SUCCESS STEP ─────────────────────────────────── */}
        {step === STEPS.SUCCESS && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-stadi-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={44} className="text-stadi-green" />
            </div>
            <h2 className="text-xl font-bold text-stadi-dark mb-1">
              {receipt?.free ? '🎉 Enrolled Free!' : '🎉 Payment Successful!'}
            </h2>
            {!receipt?.free && receipt?.amount_kes > 0 && (
              <p className="text-stadi-gray text-sm mb-1">
                KES {receipt.amount_kes?.toLocaleString()} received
                {receipt.mpesa_transaction_id && ` · Ref: ${receipt.mpesa_transaction_id}`}
              </p>
            )}
            <p className="text-stadi-gray text-sm mb-6">
              You are now enrolled in <strong>{course.title}</strong>. Let's start learning!
            </p>

            <div className="bg-stadi-green-light rounded-xl p-4 mb-5 text-left space-y-2">
              {['Access all lessons immediately','Download for offline viewing','Pass the assessment to earn your certificate'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-stadi-green">
                  <CheckCircle size={14} className="shrink-0" /> {f}
                </div>
              ))}
            </div>

            <Button variant="primary" className="w-full" onClick={handleContinue}>
              Start Learning Now <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* ── FAILED STEP ──────────────────────────────────── */}
        {step === STEPS.FAILED && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={44} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-stadi-dark mb-2">Payment Not Completed</h2>
            <p className="text-stadi-gray text-sm mb-2">{error}</p>
            <p className="text-xs text-stadi-gray mb-6">
              If M-Pesa was deducted but you see this screen, WhatsApp us at +254 701901244 with your name and phone number.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setStep(STEPS.PHONE); setError(''); setPollCount(0); }}>
                Try Again
              </Button>
              <a href="https://wa.me/254701901244" target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="ghost" className="w-full border border-gray-200">WhatsApp Support</Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
