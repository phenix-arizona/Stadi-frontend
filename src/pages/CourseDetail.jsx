// ── CourseDetail.jsx ──────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link }        from 'react-router-dom';
import { useQuery, useQueryClient }            from '@tanstack/react-query';
import {
  Clock, BookOpen, Users, Award, Check, Lock, ChevronDown, ChevronUp,
  Share2, TrendingUp, MapPin, Hammer, Star, Play, AlertCircle,
  RefreshCw, CheckCircle, XCircle, Smartphone,
} from 'lucide-react';
import { courses as coursesAPI, payments, bookmarks } from '../lib/api';
import useAuthStore  from '../store/auth.store';
import useAppStore   from '../store/app.store';
import { Button, Badge, StarRating, ProgressBar, Skeleton } from '../components/ui';
import { LOGO_FULL, LOGO_NAV } from '../assets/logo';

// ── Category images ───────────────────────────────────────────
const CATEGORY_IMAGES = {
  energy:       'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=200&fit=crop&auto=format',
  technology:   'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=200&fit=crop&auto=format',
  textile:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=200&fit=crop&auto=format',
  fisheries:    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=200&fit=crop&auto=format',
  agriculture:  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=200&fit=crop&auto=format',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=200&fit=crop&auto=format',
  beauty:       'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=200&fit=crop&auto=format',
  hospitality:  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=200&fit=crop&auto=format',
  automotive:   'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=200&fit=crop&auto=format',
  business:     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=200&fit=crop&auto=format',
  default:      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=200&fit=crop&auto=format',
};

// ── Helpers ───────────────────────────────────────────────────
function formatUserPhone(p) {
  if (!p) return '';
  if (p.startsWith('+254')) return p;
  if (p.startsWith('0'))    return '+254' + p.slice(1);
  if (p.startsWith('254'))  return '+' + p;
  return p;
}

function fmtDuration(s) {
  if (!s) return '';
  const m = Math.round(s / 60);
  return m < 60 ? `${m}min` : `${Math.floor(m/60)}h ${m%60}m`;
}

// ── M-Pesa payment state machine ─────────────────────────────
// States: idle | prompting | polling | success | failed | timeout | cancelled
const MPESA_ERRORS = {
  1:    'Insufficient funds. Top up your M-Pesa and try again.',
  1032: 'Payment cancelled. Press "Try Again" when ready.',
  1037: 'Request timed out. Please try again.',
  2001: 'Wrong M-Pesa PIN entered. Please try again.',
  default: 'Payment was not completed. Please try again.',
};

function getMpesaErrorMsg(code, fallback) {
  return MPESA_ERRORS[code] || fallback || MPESA_ERRORS.default;
}

// ── M-Pesa status panel ───────────────────────────────────────
function MpesaStatusPanel({ state, error, onRetry, onCancel, courseName, amount }) {
  if (state === 'idle') return null;

  const panels = {
    prompting: {
      icon: <Smartphone size={28} className="text-stadi-green animate-bounce" />,
      title: 'Check your phone',
      body:  `An M-Pesa prompt has been sent. Enter your PIN to pay KES ${amount?.toLocaleString()} for "${courseName}".`,
      sub:   'The prompt expires in 2 minutes.',
      color: 'border-stadi-green/30 bg-stadi-green-light',
    },
    polling: {
      icon: <RefreshCw size={28} className="text-stadi-orange animate-spin" />,
      title: 'Confirming payment…',
      body:  'Waiting for M-Pesa confirmation. This usually takes 5–30 seconds.',
      sub:   null,
      color: 'border-stadi-orange/30 bg-orange-50',
    },
    success: {
      icon: <CheckCircle size={28} className="text-stadi-green" />,
      title: 'Payment successful!',
      body:  `You're enrolled in "${courseName}". Redirecting you to the course…`,
      sub:   null,
      color: 'border-stadi-green/40 bg-stadi-green-light',
    },
    failed: {
      icon: <XCircle size={28} className="text-red-500" />,
      title: 'Payment not completed',
      body:  error || MPESA_ERRORS.default,
      sub:   null,
      color: 'border-red-200 bg-red-50',
    },
    timeout: {
      icon: <AlertCircle size={28} className="text-amber-500" />,
      title: 'Request timed out',
      body:  'We didn\'t receive confirmation from M-Pesa. If money was deducted, it will be refunded within 24 hours.',
      sub:   null,
      color: 'border-amber-200 bg-amber-50',
    },
  };

  const p = panels[state] || panels.failed;

  return (
    <div className={`rounded-2xl border p-4 mb-4 ${p.color}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{p.icon}</div>
        <div className="flex-1">
          <p className="font-bold text-stadi-dark text-sm mb-1">{p.title}</p>
          <p className="text-xs text-stadi-gray leading-relaxed">{p.body}</p>
          {p.sub && <p className="text-xs text-stadi-gray/60 mt-1">{p.sub}</p>}
        </div>
      </div>
      {(state === 'failed' || state === 'timeout') && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onRetry}
            className="flex-1 text-xs font-semibold bg-stadi-green text-white py-2 rounded-xl hover:bg-opacity-90 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={onCancel}
            className="text-xs font-medium text-stadi-gray hover:text-red-500 px-3 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Free lesson preview modal ─────────────────────────────────
function LessonPreviewModal({ lesson, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Video */}
        <div className="relative bg-black" style={{ paddingBottom:'56.25%' }}>
          {lesson.video_url ? (
            <video
              src={lesson.video_url}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
              No preview video available
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-stadi-green uppercase tracking-wider">Free Preview</span>
              <h3 className="font-bold text-stadi-dark text-base mt-0.5">{lesson.title}</h3>
              {lesson.description && (
                <p className="text-sm text-stadi-gray mt-1 leading-relaxed">{lesson.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-stadi-dark text-xs border border-gray-200 rounded-lg px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// COURSE DETAIL PAGE
// ═════════════════════════════════════════════════════════════
export function CourseDetailPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const { user, isLoggedIn, openAuth } = useAuthStore();
  const { addToast }  = useAppStore();

  const [openModule,    setOpenModule]    = useState(null);
  const [phone,         setPhone]         = useState(formatUserPhone(user?.phone));
  const [mpesaState,    setMpesaState]    = useState('idle');  // idle|prompting|polling|success|failed|timeout
  const [mpesaError,    setMpesaError]    = useState('');
  const [previewLesson, setPreviewLesson] = useState(null);
  const pollRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn:  () => coursesAPI.bySlug(slug),
  });

  const course = data?.data;

  // ── M-Pesa enrolment ──────────────────────────────────────
  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const resetMpesa = () => {
    stopPolling();
    setMpesaState('idle');
    setMpesaError('');
  };

  const handleEnrol = async () => {
    if (!isLoggedIn) { openAuth(); return; }
    if (!phone.match(/^\+254\d{9}$/)) {
      addToast('Enter a valid Kenyan phone for M-Pesa — e.g. +254712345678', 'error');
      return;
    }

    resetMpesa();
    setMpesaState('prompting');

    let payId;
    try {
      const res = await payments.initiate(course.id, phone);
      payId = res.data.paymentId;
    } catch (e) {
      // Surface the exact Safaricom error if available
      const msg = e?.message || e?.error || 'Could not reach M-Pesa. Check your connection and try again.';
      setMpesaState('failed');
      setMpesaError(msg);
      return;
    }

    // Small delay then start polling
    await new Promise(r => setTimeout(r, 1500));
    setMpesaState('polling');

    let attempts = 0;
    const MAX_ATTEMPTS = 24; // 24 × 3 s = 72 s max

    pollRef.current = setInterval(async () => {
      attempts++;

      try {
        const status = await payments.status(payId);
        const st     = status.data?.status;
        const code   = status.data?.resultCode;

        if (st === 'completed') {
          stopPolling();
          setMpesaState('success');
          qc.invalidateQueries(['course', slug]);
          setTimeout(() => navigate(`/learn/${course.id}`), 1800);
          return;
        }

        if (st === 'failed' || st === 'cancelled') {
          stopPolling();
          const msg = getMpesaErrorMsg(code, status.data?.resultDesc);
          setMpesaState('failed');
          setMpesaError(msg);
          return;
        }

        // Timed out
        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setMpesaState('timeout');
        }

      } catch {
        // Network blip — keep polling, don't abort
        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setMpesaState('timeout');
        }
      }
    }, 3000);
  };

  // ── Share ─────────────────────────────────────────────────
  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `I found this skill course on Stadi — KES ${course.price_kes} for "${course.title}". ` +
      `Earn up to KES ${course.income_max_kes?.toLocaleString()}/mo!\n\nhttps://stadi.co.ke/courses/${course.slug}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // ── Lesson click — free preview or lock ───────────────────
  const handleLessonClick = (lesson) => {
    if (lesson.is_preview || course.enrolled) {
      setPreviewLesson(lesson);
    } else {
      addToast('Enrol to unlock this lesson.', 'info');
    }
  };

  // Count free preview lessons
  const previewCount = course?.modules?.reduce(
    (acc, m) => acc + (m.lessons?.filter(l => l.is_preview).length || 0), 0
  ) || 0;

  // ── Loading ───────────────────────────────────────────────
  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!course) return (
    <div className="text-center py-24">
      <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 opacity-40">
        <img
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=64&h=64&fit=crop&auto=format"
          alt="Not found"
          className="w-full h-full object-cover"
        />
      </div>
      <h2 className="text-xl font-bold">Course not found</h2>
      <Link to="/courses" className="text-stadi-green hover:underline text-sm mt-3 block">
        ← Browse all courses
      </Link>
    </div>
  );

  const catSlug   = course.categories?.slug || 'default';
  const catImgSm  = CATEGORY_IMAGES[catSlug] || CATEGORY_IMAGES.default;
  const isPaying  = ['prompting','polling'].includes(mpesaState);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero banner ── */}
      <div className="bg-stadi-dark text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2">

            {/* Category — image + name */}
            <div className="flex items-center gap-2 mb-2">
              <img
                src={catImgSm}
                alt={course.categories?.name}
                className="w-5 h-5 rounded object-cover"
                loading="lazy"
              />
              <span className="text-stadi-orange text-sm font-semibold">
                {course.categories?.name}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily:'Playfair Display' }}>
              {course.title}
            </h1>
            <p className="text-gray-300 mb-4 leading-relaxed">{course.description}</p>

            {/* Income badge */}
            {course.income_min_kes && (
              <div className="inline-flex items-center gap-2 bg-stadi-orange/20 border border-stadi-orange/40 rounded-xl px-4 py-2 mb-4">
                <TrendingUp size={16} className="text-stadi-orange" />
                <span className="text-stadi-orange font-bold text-sm">
                  Earn KES {course.income_min_kes?.toLocaleString()}–{course.income_max_kes?.toLocaleString()}/month
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
              {course.avg_rating > 0 && <StarRating rating={course.avg_rating} count={course.review_count} />}
              <span className="flex items-center gap-1"><Users size={13} />{course.enrolment_count} enrolled</span>
              <span className="flex items-center gap-1"><BookOpen size={13} />{course.total_lessons} lessons</span>
              {course.total_duration_s > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={13} />{Math.round(course.total_duration_s / 3600)}h total
                </span>
              )}
              {previewCount > 0 && (
                <span className="flex items-center gap-1 text-stadi-orange font-medium">
                  <Play size={13} fill="currentColor" />{previewCount} free preview{previewCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {course.users && (
              <p className="text-xs text-gray-400 mt-3">
                Instructor: <span className="text-white font-medium">{course.users.name}</span>
              </p>
            )}
          </div>

          {/* ── Enrolment card ── */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-stadi-dark">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" />
            ) : (
              <img
                src={CATEGORY_IMAGES[catSlug] || CATEGORY_IMAGES.default}
                alt={course.categories?.name}
                className="w-full h-36 object-cover"
              />
            )}
            <div className="p-5">
              {course.enrolled && course.progressPct > 0 ? (
                <div className="mb-4">
                  <ProgressBar value={course.progressPct} label="Your progress" />
                  <Link to={`/learn/${course.id}`}>
                    <Button variant="primary" className="w-full mt-3">Continue Learning →</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-stadi-dark mb-1">
                    {course.is_free ? 'Free' : `KES ${course.price_kes?.toLocaleString()}`}
                  </div>

                  {course.weeklyEnrolments > 0 && (
                    <p className="text-[11px] text-stadi-orange font-semibold mb-3 flex items-center gap-1">
                      <TrendingUp size={10} /> {course.weeklyEnrolments} enrolled this week
                    </p>
                  )}

                  {/* M-Pesa status panel */}
                  <MpesaStatusPanel
                    state={mpesaState}
                    error={mpesaError}
                    onRetry={handleEnrol}
                    onCancel={resetMpesa}
                    courseName={course.title}
                    amount={course.price_kes}
                  />

                  {/* Phone input — only when idle/failed/timeout */}
                  {isLoggedIn && !course.enrolled && mpesaState === 'idle' && (
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+254712345678"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-stadi-green"
                    />
                  )}

                  {/* CTA button */}
                  {!course.enrolled && (mpesaState === 'idle' || mpesaState === 'failed' || mpesaState === 'timeout') && (
                    <Button
                      variant="primary"
                      className="w-full mb-2"
                      loading={isPaying}
                      onClick={isLoggedIn ? handleEnrol : openAuth}
                    >
                      {course.is_free
                        ? 'Enrol Free'
                        : `Pay KES ${course.price_kes} via M-Pesa`}
                    </Button>
                  )}

                  {isPaying && (
                    <Button variant="outline" className="w-full mb-2 text-xs" onClick={resetMpesa}>
                      Cancel
                    </Button>
                  )}

                  {mpesaState === 'idle' && (
                    <p className="text-xs text-gray-400 text-center">7-day money-back guarantee</p>
                  )}
                </>
              )}

              <button
                onClick={shareWhatsApp}
                className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-stadi-green border border-stadi-green/30 rounded-xl py-2 hover:bg-stadi-green-light transition-colors"
              >
                <Share2 size={13} /> Share on WhatsApp
              </button>

              <div className="mt-4 space-y-1.5">
                {[
                  'Offline download available',
                  '15 language options',
                  'Verified certificate',
                  '7-day refund policy',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-stadi-gray">
                    <Check size={12} className="text-stadi-green" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">

          {/* What you'll learn */}
          {course.what_you_learn?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-stadi-dark mb-4">What You'll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {course.what_you_learn.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-stadi-gray">
                    <Check size={14} className="text-stadi-green mt-0.5 shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income guide */}
          {course.income_min_kes && (
            <div className="card p-6 border-l-4 border-stadi-orange">
              <h2 className="text-lg font-bold text-stadi-dark mb-4 flex items-center gap-2">
                <TrendingUp className="text-stadi-orange" size={20} /> Earn with This Skill
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-stadi-orange-light rounded-xl p-4 text-center">
                  <div className="text-xs text-stadi-orange font-semibold uppercase mb-1">Entry Level</div>
                  <div className="text-2xl font-bold text-stadi-orange">KES {course.income_min_kes?.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">per month</div>
                </div>
                <div className="bg-stadi-green-light rounded-xl p-4 text-center">
                  <div className="text-xs text-stadi-green font-semibold uppercase mb-1">Experienced</div>
                  <div className="text-2xl font-bold text-stadi-green">KES {course.income_max_kes?.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">per month</div>
                </div>
              </div>
              {course.income_notes && <p className="text-sm text-stadi-gray mb-4">{course.income_notes}</p>}
              {course.tools_list?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-stadi-dark mb-2 flex items-center gap-1">
                    <Hammer size={14} /> Tools You'll Need
                  </h3>
                  <div className="space-y-1.5">
                    {course.tools_list.map((tool, i) => (
                      <div key={i} className="flex justify-between text-sm text-stadi-gray bg-gray-50 rounded-lg px-3 py-2">
                        <span>{tool.name}</span>
                        <span className="font-semibold text-stadi-dark">KES {tool.price_kes?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {course.business_guide && (
                <div className="mt-4 bg-stadi-green-light rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-stadi-green mb-2">Start a Business with This Skill</h3>
                  <p className="text-sm text-stadi-gray leading-relaxed">{course.business_guide}</p>
                </div>
              )}
            </div>
          )}

          {/* Curriculum — with free preview clicks */}
          {course.modules?.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-stadi-dark">Course Curriculum</h2>
                {previewCount > 0 && (
                  <span className="text-xs text-stadi-orange font-semibold bg-stadi-orange/10 px-2.5 py-1 rounded-full">
                    {previewCount} free lesson{previewCount > 1 ? 's' : ''} available
                  </span>
                )}
              </div>
              <p className="text-xs text-stadi-gray mb-4">
                {course.total_lessons} lessons · {Math.round(course.total_duration_s / 3600)}h total
              </p>
              <div className="space-y-2">
                {course.modules.map((mod, mi) => (
                  <div key={mod.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenModule(openModule === mi ? null : mi)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-stadi-dark text-sm">{mod.title}</span>
                        <span className="text-xs text-stadi-gray ml-2">{mod.lessons?.length} lessons</span>
                        {mod.lessons?.some(l => l.is_preview) && (
                          <span className="ml-2 text-[10px] text-stadi-orange font-semibold">
                            · has preview
                          </span>
                        )}
                      </div>
                      {openModule === mi ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {openModule === mi && mod.lessons?.map((lesson) => {
                      const canPreview = lesson.is_preview || course.enrolled;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={`w-full flex items-center justify-between px-6 py-2.5 text-sm border-t border-gray-50 transition-colors text-left
                            ${canPreview
                              ? 'bg-gray-50/50 hover:bg-stadi-green-light cursor-pointer'
                              : 'bg-gray-50/30 cursor-default'}`}
                        >
                          <div className="flex items-center gap-2 text-stadi-gray">
                            {canPreview
                              ? <Play size={13} className="text-stadi-green" fill="currentColor" />
                              : <Lock size={13} className="text-gray-400" />}
                            <span className={canPreview ? 'text-stadi-dark' : ''}>{lesson.title}</span>
                            {lesson.is_preview && !course.enrolled && (
                              <span className="text-[10px] text-stadi-orange font-semibold ml-1">Preview</span>
                            )}
                          </div>
                          {lesson.duration_seconds > 0 && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {fmtDuration(lesson.duration_seconds)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructor */}
          {course.users && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-stadi-dark mb-4">Your Instructor</h2>
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-stadi-green-light">
                  {course.users.avatar_url ? (
                    <img
                      src={course.users.avatar_url}
                      className="w-full h-full object-cover"
                      alt={course.users.name}
                    />
                  ) : (
                    <img
                      src={`https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=56&h=56&fit=crop&crop=face&auto=format`}
                      className="w-full h-full object-cover"
                      alt={course.users.name}
                    />
                  )}
                </div>
                <div>
                  <div className="font-bold text-stadi-dark">{course.users.name}</div>
                  <div className="text-xs text-stadi-gray flex items-center gap-1 mb-2">
                    <MapPin size={10} />Kenya
                  </div>
                  {course.users.bio && (
                    <p className="text-sm text-stadi-gray leading-relaxed">{course.users.bio}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {course.reviews?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-stadi-dark mb-2">Learner Reviews</h2>
              <div className="flex items-center gap-3 mb-5">
                <div className="text-4xl font-bold text-stadi-dark">{course.avg_rating.toFixed(1)}</div>
                <div>
                  <StarRating rating={course.avg_rating} size={18} />
                  <div className="text-xs text-stadi-gray mt-0.5">{course.review_count} reviews</div>
                </div>
              </div>
              <div className="space-y-4">
                {course.reviews.map(r => (
                  <div key={r.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-stadi-green-light rounded-full flex items-center justify-center text-xs font-bold text-stadi-green">
                          {r.users?.name?.[0]}
                        </div>
                        <span className="text-sm font-medium text-stadi-dark">{r.users?.name}</span>
                      </div>
                      <StarRating rating={r.rating} size={11} />
                    </div>
                    {r.comment && (
                      <p className="text-sm text-stadi-gray leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Trust signals sidebar ── */}
        <div className="hidden md:block space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-sm text-stadi-dark mb-3">This course includes</h3>
            <ul className="space-y-2 text-xs text-stadi-gray">
              {[
                `${course.total_lessons} on-demand video lessons`,
                'Offline download for studying without data',
                '15 language options available',
                'Quizzes after each module',
                'Final assessment to earn certificate',
                'Verifiable QR-code certificate',
                'Lifetime course access',
                'WhatsApp support available',
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={12} className="text-stadi-green shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 bg-stadi-green-light border-stadi-green/20">
            <h3 className="font-bold text-sm text-stadi-green mb-2 flex items-center gap-1.5">
              <Award size={14} /> 7-Day Money-Back Guarantee
            </h3>
            <p className="text-xs text-stadi-gray">
              Not satisfied? Get a full refund within 7 days, no questions asked (if &lt;20% completed).
            </p>
          </div>
        </div>
      </div>

      {/* ── Free lesson preview modal ── */}
      {previewLesson && (
        <LessonPreviewModal
          lesson={previewLesson}
          onClose={() => setPreviewLesson(null)}
        />
      )}
    </div>
  );
}

// ── About page (unchanged except emoji → images) ─────────────
export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-5">
          <img src={LOGO_FULL} alt="Stadi — Learn Skills. Start Earning." className="h-14 w-auto" draggable={false} />
        </div>
        <Badge variant="green" className="mb-4">Made in Kenya, for Kenya</Badge>
        <h1 className="text-3xl font-bold text-stadi-dark mb-4" style={{ fontFamily:'Playfair Display' }}>
          About Stadi
        </h1>
        <p className="text-stadi-gray text-lg leading-relaxed max-w-2xl mx-auto">
          We built Stadi because Felix Sawo saw firsthand what happens when a young person in Kisumu has the drive to learn a skill, but no access to affordable, locally-relevant training.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card p-7">
          <h2 className="text-xl font-bold text-stadi-dark mb-3" style={{ fontFamily:'Playfair Display' }}>Our Mission</h2>
          <p className="text-stadi-gray leading-relaxed">
            To make quality vocational training accessible to every Kenyan — regardless of geography, language, income, or internet connectivity. Every learner deserves to learn in their mother tongue, on a device they already own, and start earning within weeks.
          </p>
        </div>
        <div className="card p-7">
          <h2 className="text-xl font-bold text-stadi-dark mb-3" style={{ fontFamily:'Playfair Display' }}>Our Approach</h2>
          <p className="text-stadi-gray leading-relaxed">
            Skills-to-income, not just skills. We don't just teach theory — every Stadi course includes real income data from graduates in your county, the tools you need, and how to turn your certificate into your first client.
          </p>
        </div>
      </div>

      {/* Founder */}
      <div className="card p-8 mb-8 border-l-4 border-stadi-green" id="mission">
        <div className="flex gap-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
            <img
              src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=64&h=64&fit=crop&crop=face&auto=format"
              alt="Felix Sawo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-stadi-dark text-lg">Felix Sawo</h3>
            <p className="text-stadi-orange text-sm font-semibold mb-3">Founder & CEO · Kisumu, Kenya</p>
            <p className="text-stadi-gray leading-relaxed text-sm">
              "I grew up in western Kenya. I watched talented people around me unable to get TVET training because it was too expensive, too far, or only in English. That's why I built Stadi — to make skills training as accessible as sending a WhatsApp message."
            </p>
          </div>
        </div>
      </div>

      {/* Regulatory */}
      <div className="bg-stadi-green-light rounded-2xl p-7">
        <h3 className="font-bold text-stadi-dark text-lg mb-4 text-center">Regulatory Compliance & Partnerships</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name:'KNQA', desc:"Content aligned with Kenya National Qualifications Authority framework. Our certificates are structured for future KNQA recognition." },
            { name:'TVET', desc:"Course curriculum developed in alignment with Kenya's TVET authority standards for vocational training." },
            { name:'NITA', desc:'Platform registered with National Industrial Training Authority as a recognised training provider.' },
            { name:'ODPC', desc:'Registered with the Office of Data Protection Commissioner under the Kenya Data Protection Act 2019.' },
          ].map(item => (
            <div key={item.name} className="bg-white rounded-xl p-4">
              <div className="font-bold text-stadi-green text-sm mb-1">{item.name}</div>
              <p className="text-xs text-stadi-gray leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="text-center mt-12">
        <h3 className="font-bold text-stadi-dark text-lg mb-4">Get in Touch</h3>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-stadi-gray">
          <div className="flex items-center gap-1.5"><MapPin size={14} className="text-stadi-green" /> Kisumu City, Western Kenya</div>
          <div>stadiafrika@gmail.com</div>
          <div>WhatsApp: +254 701901244</div>
          <a href="https://stadi.co.ke" className="text-stadi-green hover:underline">stadi.co.ke</a>
        </div>
      </div>
    </div>
  );
}

// ── Certificate verify page (unchanged) ──────────────────────
export function CertificateVerifyPage() {
  const [num,    setNum]    = useState('');
  const [result, setResult] = useState(null);
  const [loading,setLoading]= useState(false);
  const [error,  setError]  = useState('');

  const verify = async () => {
    if (!num.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { certificates } = await import('../lib/api');
      const res = await certificates.verify(num.trim());
      setResult(res.data);
    } catch {
      setError('Certificate not found. Please check the number and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
        <img
          src="https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=64&h=64&fit=crop&auto=format"
          alt="Certificate"
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-2xl font-bold text-stadi-dark mb-2">Verify a Certificate</h1>
      <p className="text-stadi-gray text-sm mb-8">Enter the certificate number to verify authenticity</p>
      <div className="flex gap-2 mb-6">
        <input
          value={num}
          onChange={e => setNum(e.target.value)}
          placeholder="e.g. STD-2024-AB12CD34"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green"
          onKeyDown={e => e.key === 'Enter' && verify()}
        />
        <Button variant="primary" loading={loading} onClick={verify}>Verify</Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {result && (
        <div className={`rounded-2xl p-6 text-left ${result.valid ? 'bg-stadi-green-light border border-stadi-green/30' : 'bg-red-50 border border-red-200'}`}>
          <div className={`text-lg font-bold mb-4 flex items-center gap-2 ${result.valid ? 'text-stadi-green' : 'text-red-600'}`}>
            {result.valid ? <CheckCircle size={20} /> : <XCircle size={20} />}
            {result.valid ? 'Valid Certificate' : 'Certificate Revoked'}
          </div>
          {result.valid && (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-stadi-gray">Learner</dt><dd className="font-semibold text-stadi-dark">{result.learnerName}</dd></div>
              <div><dt className="text-stadi-gray">Course</dt><dd className="font-semibold text-stadi-dark">{result.courseTitle}</dd></div>
              <div><dt className="text-stadi-gray">Certificate #</dt><dd className="font-semibold text-stadi-dark">{result.certificateNumber}</dd></div>
              <div><dt className="text-stadi-gray">Issued</dt><dd className="font-semibold text-stadi-dark">{new Date(result.issuedAt).toLocaleDateString('en-KE', { year:'numeric', month:'long', day:'numeric' })}</dd></div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
