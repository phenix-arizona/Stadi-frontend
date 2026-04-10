import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery }          from '@tanstack/react-query';
import { Flame, Award, BookOpen, TrendingUp, Share2, ChevronRight, Gift, Bell, Clock, Check } from 'lucide-react';
import { userAPI, streaks as streakAPI, certificates, referrals, bookmarks, notifications as notifAPI } from '../lib/api';
import { Skeleton, ProgressBar, Badge, EmptyState, Button } from '../components/ui';
import useAuthStore from '../store/auth.store';
import CourseCard from '../components/course/CourseCard';

export default function DashboardPage() {
  const { user, isAdmin, isInstructor } = useAuthStore();

  const userIsAdmin      = typeof isAdmin      === 'function' ? isAdmin()      : isAdmin;
  const userIsInstructor = typeof isInstructor === 'function' ? isInstructor() : isInstructor;

  const { data: statsData,  isLoading: statsLoading }  = useQuery({ queryKey: ['user','stats'],        queryFn: userAPI.stats });
  const { data: contData }                              = useQuery({ queryKey: ['progress','continue'], queryFn: () => import('../lib/api').then(m=>m.progress.continuelearning()) });
  const { data: streakData }                            = useQuery({ queryKey: ['streak','my'],         queryFn: streakAPI.get });
  const { data: enrollData, isLoading: enrollLoading }  = useQuery({ queryKey: ['user','enrollments'], queryFn: userAPI.enrollments });
  const { data: certsData }                             = useQuery({ queryKey: ['certificates','my'],   queryFn: certificates.list });
  const { data: refData }                               = useQuery({ queryKey: ['referral','my'],       queryFn: referrals.get });

  const stats    = statsData?.data  || {};
  const streak   = streakData?.data || {};
  const cont     = contData?.data;
  const enrolled = enrollData?.data || [];
  const certs    = certsData?.data  || [];
  const referral = refData?.data    || {};

  const shareReferral = () => {
    const text = encodeURIComponent(
      `Join me on Stadi — learn skills and start earning in Kenya! 🇰🇪\nUse my referral code ${referral.code} and get KES 50 off your first course.\nhttps://stadi.ke?ref=${referral.code}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Role portal banners ── */}
      {userIsAdmin && (
        <div className="mb-6 rounded-2xl bg-stadi-dark text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-stadi-orange mb-1">Admin Access</div>
            <div className="font-bold text-lg">You have admin privileges.</div>
            <div className="text-sm text-gray-300 mt-0.5">Manage users, courses, payments, and platform settings.</div>
          </div>
          <Link to="/admin" className="shrink-0">
            <Button variant="primary" size="sm">Open Admin Dashboard →</Button>
          </Link>
        </div>
      )}

      {!userIsAdmin && userIsInstructor && (
        <div className="mb-6 rounded-2xl bg-stadi-green text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-stadi-orange mb-1">Instructor Access</div>
            <div className="font-bold text-lg">You have instructor privileges.</div>
            <div className="text-sm text-green-100 mt-0.5">Create and manage your courses, track earnings, and view student progress.</div>
          </div>
          <Link to="/instructor" className="shrink-0">
            <Button variant="secondary" size="sm">Open Instructor Portal →</Button>
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stadi-dark" style={{ fontFamily: 'Playfair Display' }}>
          Habari, {user?.name?.split(' ')[0] || 'Learner'}! 👋
        </h1>
        <p className="text-stadi-gray text-sm mt-1">Keep learning, keep earning.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { icon:'📚', label:'Enrolled',     value: statsLoading ? '–' : stats.enrolled,                color:'stadi-green'  },
          { icon:'✅', label:'Completed',    value: statsLoading ? '–' : stats.completed,               color:'stadi-green'  },
          { icon:'🏆', label:'Certificates', value: statsLoading ? '–' : stats.certificates,            color:'stadi-orange' },
          { icon:'🔥', label:'Day Streak',   value: statsLoading ? '–' : streak.current_streak  || 0,   color:'stadi-orange' },
          { icon:'📅', label:'Days Learned', value: statsLoading ? '–' : streak.total_days_learned || 0, color:'stadi-green' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold text-${s.color}`}>{s.value}</div>
            <div className="text-xs text-stadi-gray">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">

          {/* Continue learning */}
          {cont && (
            <div className="card p-5 border-l-4 border-stadi-orange bg-stadi-orange-light/30">
              <div className="text-xs font-semibold text-stadi-orange uppercase tracking-wide mb-2">📖 Continue Learning</div>
              <div className="font-bold text-stadi-dark mb-1">{cont.course?.title}</div>
              <div className="text-sm text-stadi-gray mb-3">Next: {cont.lesson?.title}</div>
              <Link to={`/learn/${cont.lesson?.module_id}/${cont.lesson?.id}`}>
                <Button variant="secondary" size="sm">Continue <ChevronRight size={14} /></Button>
              </Link>
            </div>
          )}

          {/* ── My Courses — card grid ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stadi-dark">My Courses</h2>
              <Link to="/courses" className="text-xs text-stadi-green hover:underline">Find more →</Link>
            </div>

            {enrollLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    <Skeleton className="h-40 w-full rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : enrolled.length === 0 ? (
              <EmptyState
                emoji="📚"
                title="No courses yet"
                description="Browse our courses and find a skill that earns you money."
                action={
                  <Link to="/courses">
                    <Button variant="primary" size="sm">Explore Courses</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {enrolled.map(e => {
                  // Compute progress percentage from enrollment data
                  const total    = e.courses?.total_lessons || 0;
                  const done     = e.lessons_done || 0;
                  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                  // Merge enrollment data into the course shape CourseCard expects
                  const course = {
                    ...e.courses,
                    // completed_at lives on the enrollment row, not the course
                    _completedAt: e.completed_at,
                  };

                  return (
                    <CourseCard
                      key={e.id}
                      course={course}
                      enrolled={true}
                      progress={progress}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Certificates */}
          {certs.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-stadi-dark mb-4">My Certificates</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {certs.map(c => (
                  <div key={c.id} className="card p-4 bg-gradient-to-br from-stadi-green/5 to-stadi-orange/5">
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="font-semibold text-stadi-dark text-sm">{c.courses?.title}</div>
                    <div className="text-xs text-stadi-gray mb-2">Cert # {c.certificate_number}</div>
                    <div className="flex gap-2">
                      {c.pdf_url && (
                        <a href={c.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-stadi-green hover:underline">
                          📄 Download
                        </a>
                      )}
                      <button
                        onClick={() => {
                          const t = encodeURIComponent(
                            `I earned my Stadi Certificate in ${c.courses?.title}! Verify it here: https://stadi.ke/certificates/verify/${c.certificate_number}`
                          );
                          window.open(`https://wa.me/?text=${t}`, '_blank');
                        }}
                        className="text-xs text-stadi-green hover:underline"
                      >
                        💬 Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Streak card */}
          <div className="card p-5 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-stadi-orange">{streak.current_streak || 0}</div>
            <div className="text-sm font-medium text-stadi-dark">Day Streak</div>
            <div className="text-xs text-stadi-gray mt-1">Longest: {streak.longest_streak || 0} days</div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-5 rounded-sm ${i < Math.min(streak.current_streak || 0, 7) ? 'bg-stadi-orange' : 'bg-gray-100'}`}
                />
              ))}
            </div>
            <p className="text-xs text-stadi-gray mt-2">Watch 1 lesson daily to keep your streak!</p>
          </div>

          {/* Referral */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={18} className="text-stadi-orange" />
              <h3 className="font-bold text-stadi-dark text-sm">Refer & Earn</h3>
            </div>
            <div className="bg-stadi-orange-light rounded-xl px-3 py-2.5 text-center mb-3">
              <div className="font-mono font-bold text-stadi-orange text-sm">{referral.code || '...'}</div>
            </div>
            <p className="text-xs text-stadi-gray mb-3">
              Refer 3 friends = 1 FREE course! <strong>{referral.totalReferrals || 0}/3</strong> referred.
            </p>
            <button
              onClick={shareReferral}
              className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <Share2 size={13} /> Share on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}