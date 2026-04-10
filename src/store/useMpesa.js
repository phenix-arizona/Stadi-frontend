import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { payments } from '../lib/api';
import useAppStore from './app.store';

// ── useMpesa ──────────────────────────────────────────────────
// Handles the full M-Pesa STK push flow:
//   1. Initiate payment
//   2. Poll for status every 3s (up to 20 attempts = 60s)
//   3. Support retry on failure (up to 3 attempts)
//   4. Surface typed error messages
//
// Usage:
//   const { pay, retry, paying, paymentId, canRetry, status } = useMpesa();

export function useMpesa({ onSuccess, invalidateKeys = [] } = {}) {
  const qc = useQueryClient();
  const { addToast } = useAppStore();

  const [paying,    setPaying]    = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [canRetry,  setCanRetry]  = useState(false);
  const [status,    setStatus]    = useState(null); // 'pending' | 'completed' | 'failed'
  const pollRef = useRef(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(payId, courseSlug, courseId) {
    let attempts = 0;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await payments.status(payId);
        const s   = res.data;

        setStatus(s.status);

        if (s.status === 'completed') {
          stopPolling();
          setPaying(false);
          addToast('Enrolled successfully! Starting your course...', 'success', 5000);
          invalidateKeys.forEach(k => qc.invalidateQueries(k));
          onSuccess?.({ courseId, courseSlug });
          return;
        }

        if (s.status === 'failed') {
          stopPolling();
          setPaying(false);
          setCanRetry(s.canRetry);
          addToast('Payment not completed. ' + (s.canRetry ? 'You can retry below.' : 'Please try again later.'), 'error', 6000);
          return;
        }

        if (s.expired || attempts >= 20) {
          stopPolling();
          setPaying(false);
          setCanRetry(true);
          addToast('Payment timed out. Please retry or check if funds were deducted.', 'error', 8000);
        }

      } catch {
        if (attempts >= 20) {
          stopPolling();
          setPaying(false);
          addToast('Could not confirm payment status. Please contact support if funds were deducted.', 'error', 8000);
        }
      }
    }, 3000);
  }

  async function pay(courseId, phone, courseSlug) {
    setPaying(true);
    setCanRetry(false);
    setStatus('pending');
    stopPolling();

    try {
      const res = await payments.initiate(courseId, phone);
      const id  = res.data.paymentId;
      setPaymentId(id);
      addToast('M-Pesa prompt sent! Check your phone and enter your PIN.', 'success', 7000);
      startPolling(id, courseSlug, courseId);
    } catch (err) {
      setPaying(false);
      setStatus(null);
      addToast(err?.message || 'Could not initiate payment. Please try again.', 'error', 6000);
    }
  }

  async function retry(courseSlug, courseId) {
    if (!paymentId) return;
    setPaying(true);
    setCanRetry(false);
    setStatus('pending');
    stopPolling();

    try {
      const res = await payments.retry(paymentId);
      const id  = res.data.paymentId;
      setPaymentId(id);
      addToast('M-Pesa prompt resent. Enter your PIN to complete payment.', 'success', 7000);
      startPolling(id, courseSlug, courseId);
    } catch (err) {
      setPaying(false);
      setCanRetry(false);
      addToast(err?.message || 'Retry failed. Please start a new payment.', 'error', 6000);
    }
  }

  return { pay, retry, paying, paymentId, canRetry, status };
}
