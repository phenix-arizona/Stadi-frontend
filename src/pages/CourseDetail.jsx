// ── CourseDetail.jsx ──────────────────────────────────────────
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock, BookOpen, Users, Award, Check, Lock, ChevronDown, ChevronUp,
  Share2, TrendingUp, MapPin, Hammer, Star
} from 'lucide-react';
import { courses as coursesAPI, payments, bookmarks } from '../lib/api';
import useAuthStore  from '../store/auth.store';
import useAppStore   from '../store/app.store';
import { Button, Badge, StarRating, ProgressBar, Skeleton } from '../components/ui';
import { LOGO_FULL, LOGO_NAV } from '../assets/logo';

export function CourseDetailPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const { user, isLoggedIn, openAuth } = useAuthStore();
  const { addToast }  = useAppStore();
  const [openModule, setOpenModule]   = useState(null);
  const [paying,     setPaying]       = useState(false);
  const [phone,      setPhone]        = useState(user?.phone || '');

  const { data, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn:  () => coursesAPI.bySlug(slug),
  });

  const course = data?.data;

  const handleEnrol = async () => {
    if (!isLoggedIn) { openAuth(); return; }
    if (!phone.match(/^\+254\d{9}$/)) { addToast('Enter a valid Kenyan phone for M-Pesa', 'error'); return; }
    setPaying(true);
    try {
      const res = await payments.initiate(course.id, phone);
      addToast('M-Pesa prompt sent! Enter your PIN to complete payment.', 'success', 6000);
      // Poll for payment status
      const payId = res.data.paymentId;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const status = await payments.status(payId);
        if (status.data.status === 'completed') {
          clearInterval(poll);
          addToast('🎉 Enrolled successfully!', 'success');
          qc.invalidateQueries(['course', slug]);
          navigate(`/learn/${course.id}`);
        }
        if (status.data.status === 'failed' || attempts > 20) {
          clearInterval(poll);
          addToast('Payment not completed. Please try again.', 'error');
          setPaying(false);
        }
      }, 3000);
    } catch (e) {
      addToast(e?.message || 'Payment failed. Try again.', 'error');
      setPaying(false);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`I found this skill course on Stadi — KES ${course.price_kes} for "${course.title}". Earn up to KES ${course.income_max_kes?.toLocaleString()}/mo!\n\nhttps://stadi.co.ke/courses/${course.slug}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

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
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-xl font-bold">Course not found</h2>
      <Link to="/courses" className="text-stadi-green hover:underline text-sm mt-3 block">← Browse all courses</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-stadi-dark text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2">
            <div className="text-stadi-orange text-sm font-semibold mb-2">
              {course.categories?.icon_emoji} {course.categories?.name}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display' }}>
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
              {course.total_duration_s > 0 && <span className="flex items-center gap-1"><Clock size={13} />{Math.round(course.total_duration_s/3600)}h total</span>}
            </div>
            {course.users && (
              <p className="text-xs text-gray-400 mt-3">
                Instructor: <span className="text-white font-medium">{course.users.name}</span>
              </p>
            )}
          </div>

          {/* Enrolment card — sticky on desktop */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-stadi-dark">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" />
            ) : (
              <div className="h-36 bg-gradient-to-br from-stadi-green/20 to-stadi-orange/20 flex items-center justify-center text-5xl">
                {course.categories?.icon_emoji}
              </div>
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
                    <p className="text-[11px] text-stadi-orange font-semibold mb-3">
                      🔥 {course.weeklyEnrolments} enrolled this week
                    </p>
                  )}
                  {isLoggedIn && !course.enrolled && (
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+254712345678"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-stadi-green"
                    />
                  )}
                  <Button
                    variant="primary" className="w-full mb-2"
                    loading={paying}
                    onClick={isLoggedIn ? handleEnrol : openAuth}
                  >
                    {paying ? 'Waiting for M-Pesa...' : course.is_free ? 'Enrol Free' : `Pay KES ${course.price_kes} via M-Pesa`}
                  </Button>
                  <p className="text-xs text-gray-400 text-center">30-day money-back guarantee</p>
                </>
              )}
              <button onClick={shareWhatsApp}
                className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-stadi-green border border-stadi-green/30 rounded-xl py-2 hover:bg-stadi-green-light">
                <Share2 size={13} /> Share on WhatsApp
              </button>
              <div className="mt-4 space-y-1.5">
                {['Offline download available','15 language options','Verified certificate','7-day refund policy'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-stadi-gray">
                    <Check size={12} className="text-stadi-green" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
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
                  <h3 className="font-semibold text-sm text-stadi-green mb-2">💡 Start a Business with This Skill</h3>
                  <p className="text-sm text-stadi-gray leading-relaxed">{course.business_guide}</p>
                </div>
              )}
            </div>
          )}

          {/* Curriculum */}
          {course.modules?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-stadi-dark mb-4">Course Curriculum</h2>
              <p className="text-xs text-stadi-gray mb-4">{course.total_lessons} lessons · {Math.round(course.total_duration_s/3600)}h total</p>
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
                      </div>
                      {openModule === mi ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {openModule === mi && mod.lessons?.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between px-6 py-2.5 text-sm border-t border-gray-50 bg-gray-50/50">
                        <div className="flex items-center gap-2 text-stadi-gray">
                          {lesson.is_preview || course.enrolled
                            ? <BookOpen size={13} className="text-stadi-green" />
                            : <Lock size={13} className="text-gray-400" />}
                          {lesson.title}
                        </div>
                        {lesson.duration_seconds > 0 && (
                          <span className="text-xs text-gray-400">
                            {Math.round(lesson.duration_seconds/60)}min
                          </span>
                        )}
                      </div>
                    ))}
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
                <div className="w-14 h-14 bg-stadi-green-light rounded-2xl flex items-center justify-center text-2xl shrink-0">
                  {course.users.avatar_url
                    ? <img src={course.users.avatar_url} className="w-full h-full rounded-2xl object-cover" />
                    : '👨🏿‍🏫'}
                </div>
                <div>
                  <div className="font-bold text-stadi-dark">{course.users.name}</div>
                  <div className="text-xs text-stadi-gray flex items-center gap-1 mb-2"><MapPin size={10} />Kenya</div>
                  {course.users.bio && <p className="text-sm text-stadi-gray leading-relaxed">{course.users.bio}</p>}
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
                    {r.comment && <p className="text-sm text-stadi-gray leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trust signals sidebar */}
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
            <h3 className="font-bold text-sm text-stadi-green mb-2">🛡️ 7-Day Money-Back Guarantee</h3>
            <p className="text-xs text-stadi-gray">Not satisfied? Get a full refund within 7 days, no questions asked (if &lt;20% completed).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── About.jsx ─────────────────────────────────────────────────
export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-5">
          <img
            src={LOGO_FULL}
            alt="Stadi — Learn Skills. Start Earning."
            className="h-14 w-auto"
            draggable={false}
          />
        </div>
        <Badge variant="green" className="mb-4">🇰🇪 Made in Kenya, for Kenya</Badge>
        <h1 className="text-3xl font-bold text-stadi-dark mb-4" style={{ fontFamily: 'Playfair Display' }}>
          About Stadi
        </h1>
        <p className="text-stadi-gray text-lg leading-relaxed max-w-2xl mx-auto">
          We built Stadi because Felix Sawo saw firsthand what happens when a young person in Kisumu has the drive to learn a skill, but no access to affordable, locally-relevant training.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card p-7">
          <h2 className="text-xl font-bold text-stadi-dark mb-3" style={{ fontFamily: 'Playfair Display' }}>Our Mission</h2>
          <p className="text-stadi-gray leading-relaxed">
            To make quality vocational training accessible to every Kenyan — regardless of geography, language, income, or internet connectivity. Every learner deserves to learn in their mother tongue, on a device they already own, and start earning within weeks.
          </p>
        </div>
        <div className="card p-7">
          <h2 className="text-xl font-bold text-stadi-dark mb-3" style={{ fontFamily: 'Playfair Display' }}>Our Approach</h2>
          <p className="text-stadi-gray leading-relaxed">
            Skills-to-income, not just skills. We don't just teach theory — every Stadi course includes real income data from graduates in your county, the tools you need, and how to turn your certificate into your first client.
          </p>
        </div>
      </div>

      {/* Founder */}
      <div className="card p-8 mb-8 border-l-4 border-stadi-green" id="mission">
        <div className="flex gap-5">
          <div className="w-16 h-16 bg-stadi-green rounded-2xl flex items-center justify-center text-3xl shrink-0">👨🏿‍💼</div>
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
            { name: 'KNQA', desc: 'Content aligned with Kenya National Qualifications Authority framework. Our certificates are structured for future KNQA recognition.' },
            { name: 'TVET', desc: 'Course curriculum developed in alignment with Kenya\'s TVET authority standards for vocational training.' },
            { name: 'NITA', desc: 'Platform registered with National Industrial Training Authority as a recognised training provider.' },
            { name: 'ODPC', desc: 'Registered with the Office of Data Protection Commissioner under the Kenya Data Protection Act 2019.' },
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
          <div>📍 Kisumu City, Western Kenya</div>
          <div>✉️ info@stadi.co.ke</div>
          <div>📱 WhatsApp: +254 700 000 000</div>
          <a href="https://stadi.co.ke" className="text-stadi-green hover:underline">🌐 stadi.co.ke</a>
        </div>
      </div>
    </div>
  );
}

// ── CertificateVerifyPage ─────────────────────────────────────
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
    } catch (e) {
      setError('Certificate not found. Please check the number and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">📜</div>
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
          <div className={`text-lg font-bold mb-4 ${result.valid ? 'text-stadi-green' : 'text-red-600'}`}>
            {result.valid ? '✅ Valid Certificate' : '❌ Certificate Revoked'}
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
