import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, TrendingUp, Users, DollarSign, Plus, Eye,
  Edit3, Send, Upload, Clock, CheckCircle, AlertCircle,
  ChevronRight, ArrowUpRight, BarChart3, Award, Loader2,
  Globe, Video, FileText, Settings, Play, Star
} from 'lucide-react';
import api from '../lib/api';
import { Skeleton, Badge, Button, Input, Modal, ProgressBar } from '../components/ui';
import useAuthStore from '../store/auth.store';
import useAppStore  from '../store/app.store';

const TABS = [
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
  { id: 'courses',   icon: BookOpen,  label: 'My Courses' },
  { id: 'earnings',  icon: TrendingUp,label: 'Earnings'   },
  { id: 'students',  icon: Users,     label: 'Students'   },
  { id: 'new',       icon: Plus,      label: 'New Course' },
];

function StatusBadge({ status }) {
  const m = {
    published:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✓ Published' },
    in_review:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',    label: '⏳ In Review' },
    draft:       { cls: 'bg-gray-50 text-gray-600 border-gray-200',        label: '✏️ Draft' },
    unpublished: { cls: 'bg-gray-50 text-gray-400 border-gray-200',        label: '⏸ Unpublished' },
  };
  const config = m[status] || m.draft;
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${config.cls}`}>{config.label}</span>;
}

// ── New Course Form ───────────────────────────────────────────
function NewCourseForm({ onSuccess }) {
  const { addToast } = useAppStore();
  const qc           = useQueryClient();
  const [form, setForm] = useState({
    title: '', categoryId: '', priceKes: '', difficulty: 'beginner',
    description: '', incomeMinKes: '', incomeMaxKes: '', languages: ['english','swahili'],
  });

  const { data: catsRes } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/courses/categories') });
  const cats = catsRes?.data || [];

  const createCourse = useMutation({
    mutationFn: () => api.post('/courses', {
      title: form.title, categoryId: form.categoryId, description: form.description,
      priceKes: parseInt(form.priceKes) || 0, difficulty: form.difficulty,
      languages: form.languages, incomeMinKes: parseInt(form.incomeMinKes) || null,
      incomeMaxKes: parseInt(form.incomeMaxKes) || null,
    }),
    onSuccess: (res) => {
      addToast('Course created! Now add modules and lessons.', 'success');
      qc.invalidateQueries(['instructor-dashboard']);
      onSuccess?.(res.data);
    },
    onError: (e) => addToast(e?.message || 'Failed to create course', 'error'),
  });

  const LANGS = [
    { code: 'english', label: 'English' }, { code: 'swahili', label: 'Kiswahili' },
    { code: 'dholuo', label: 'Dholuo' },   { code: 'luhya', label: 'Luhya' },
    { code: 'kikuyu', label: 'Kikuyu' },   { code: 'kalenjin', label: 'Kalenjin' },
    { code: 'kamba', label: 'Kamba' },     { code: 'kisii', label: 'Kisii' },
    { code: 'meru', label: 'Meru' },       { code: 'mijikenda', label: 'Mijikenda' },
    { code: 'somali', label: 'Somali' },   { code: 'maasai', label: 'Maa' },
    { code: 'turkana', label: 'Turkana' }, { code: 'teso', label: 'Ateso' },
    { code: 'taita', label: 'Kidawida' },
  ];

  const toggleLang = (code) => setForm(f => ({
    ...f, languages: f.languages.includes(code) ? f.languages.filter(l => l !== code) : [...f.languages, code]
  }));

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const valid = form.title && form.categoryId && form.priceKes && form.description;

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Create a New Course</h2>
          <p className="text-sm text-gray-500">Fill in the basic details. You can add videos and lessons after creation.</p>
        </div>

        <Input label="Course Title *" value={form.title} onChange={set('title')}
          placeholder="e.g. Solar Panel Installation & Repair" />

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Category *</label>
          <select value={form.categoryId} onChange={set('categoryId')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white">
            <option value="">Select a category</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon_emoji} {c.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Course Price (KES) *" type="number" value={form.priceKes} onChange={set('priceKes')}
            placeholder="e.g. 300" />
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Difficulty *</label>
            <select value={form.difficulty} onChange={set('difficulty')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">Description *</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            placeholder="Describe what learners will achieve from this course..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Min Monthly Earning (KES)" type="number" value={form.incomeMinKes} onChange={set('incomeMinKes')}
            placeholder="e.g. 15000" />
          <Input label="Max Monthly Earning (KES)" type="number" value={form.incomeMaxKes} onChange={set('incomeMaxKes')}
            placeholder="e.g. 35000" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Course Languages</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {LANGS.map(l => (
              <button key={l.code} type="button" onClick={() => toggleLang(l.code)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border-2 transition-all font-medium
                  ${form.languages.includes(l.code) ? 'border-stadi-green bg-stadi-green-light text-stadi-green' : 'border-gray-200 text-gray-500 hover:border-stadi-green/40'}`}>
                {l.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Select all languages you'll record video in. More languages = more learners.</p>
        </div>

        <div className="bg-stadi-orange-light rounded-xl p-4 border border-stadi-orange/20">
          <p className="text-xs text-stadi-orange font-semibold mb-1">📋 After creating your course:</p>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Add course modules (chapters)</li>
            <li>2. Add lessons to each module</li>
            <li>3. Upload video for each lesson and language</li>
            <li>4. Add quiz questions for the final assessment</li>
            <li>5. Submit for review — our team approves within 48 hours</li>
          </ol>
        </div>

        <Button variant="primary" className="w-full" size="lg"
          loading={createCourse.isPending} disabled={!valid}
          onClick={() => createCourse.mutate()}>
          Create Course Draft
        </Button>
      </div>
    </div>
  );
}

// ── Instructor dashboard ──────────────────────────────────────
export default function InstructorPage() {
  const { user }      = useAuthStore();
  const { addToast }  = useAppStore();
  const qc            = useQueryClient();
  const navigate      = useNavigate();
  const [tab, setTab] = useState('dashboard');

  const { data: dashRes, isLoading } = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn:  () => api.get('/instructor/dashboard'),
  });

  const { data: earningsRes } = useQuery({
    queryKey: ['instructor-earnings'],
    queryFn:  () => api.get('/payouts/earnings'),
    enabled:  tab === 'earnings',
  });

  const submitCourse = useMutation({
    mutationFn: (id) => api.post(`/instructor/courses/${id}/submit`),
    onSuccess:  () => { qc.invalidateQueries(['instructor-dashboard']); addToast('Course submitted for review! ⏳', 'success'); },
    onError:    (e) => addToast(e?.message || 'Submission failed', 'error'),
  });

  const requestPayout = useMutation({
    mutationFn: () => api.post('/payouts/request', { phone: user?.phone }),
    onSuccess:  () => addToast('Payout requested! Admin will process within 24 hours.', 'success'),
    onError:    (e) => addToast(e?.message || 'Payout request failed', 'error'),
  });

  const dash     = dashRes?.data || {};
  const courses  = dash.courses  || [];
  const earnings = earningsRes?.data || [];

  const totalEarned   = earnings.reduce((s, e) => s + (e.net_amount || 0), 0);
  const totalStudents = courses.reduce((s, c) => s + (c.enrolment_count || 0), 0);
  const avgRating     = courses.length ? (courses.reduce((s, c) => s + (parseFloat(c.avg_rating) || 0), 0) / courses.length).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Instructor Portal</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Welcome back, {user?.name?.split(' ')[0] || 'Instructor'} 👋
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setTab('new')}>
              <Plus size={14}/> New Course
            </Button>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                  ${tab === t.id ? 'border-stadi-green text-stadi-green' : 'border-transparent text-gray-500 hover:text-stadi-green'}`}>
                <t.icon size={15}/>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* ── DASHBOARD ──────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: BookOpen,  label: 'Total Courses', value: isLoading ? null : courses.length, color: 'bg-blue-500' },
                { icon: Users,     label: 'Total Students', value: isLoading ? null : totalStudents.toLocaleString(), color: 'bg-stadi-green' },
                { icon: DollarSign,label: 'Earnings (KES)', value: isLoading ? null : `KES ${(dash.totalEarned||0).toLocaleString()}`, color: 'bg-stadi-orange' },
                { icon: Star,      label: 'Avg Rating', value: isLoading ? null : avgRating, color: 'bg-purple-500' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                    <s.icon size={18} className="text-white" />
                  </div>
                  {isLoading ? <Skeleton className="h-7 w-20 mb-1"/> : <div className="text-2xl font-bold text-gray-900">{s.value}</div>}
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pending payout */}
            {(dash.pendingPayout || 0) > 0 && (
              <div className="bg-stadi-orange-light rounded-2xl border border-stadi-orange/20 p-5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">Payout Available</div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    <strong className="text-stadi-orange">KES {dash.pendingPayout?.toLocaleString()}</strong> ready to withdraw via M-Pesa
                  </div>
                </div>
                <Button variant="secondary" size="sm" loading={requestPayout.isPending} onClick={() => requestPayout.mutate()}>
                  Request Payout
                </Button>
              </div>
            )}

            {/* Course overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Your Courses</h3>
                <button onClick={() => setTab('courses')} className="text-sm text-stadi-green hover:underline flex items-center gap-1">
                  View all <ChevronRight size={14}/>
                </button>
              </div>
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-gray-500 text-sm mb-4">No courses yet. Create your first course to start earning!</p>
                  <Button variant="primary" size="sm" onClick={() => setTab('new')}><Plus size={14}/> Create First Course</Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {courses.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">{c.title}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{c.enrolment_count} students</span>
                          {c.avg_rating > 0 && <span className="text-xs text-yellow-500">★ {parseFloat(c.avg_rating).toFixed(1)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <StatusBadge status={c.status} />
                        {c.status === 'draft' && (
                          <Button size="sm" variant="outline" loading={submitCourse.isPending} onClick={() => submitCourse.mutate(c.id)}>
                            <Send size={12}/> Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Onboarding checklist for new instructors */}
            {courses.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Getting Started on Stadi</h3>
                <div className="space-y-3">
                  {[
                    { done: true,  title: 'Create your instructor account', desc: 'You\'re in!' },
                    { done: false, title: 'Create your first course', desc: 'Click "New Course" to get started', action: () => setTab('new') },
                    { done: false, title: 'Add course modules and lessons', desc: 'Organize your content into structured lessons' },
                    { done: false, title: 'Upload video lessons', desc: 'Record in at least English + Swahili for maximum reach' },
                    { done: false, title: 'Add quiz questions', desc: 'Minimum 5 questions for the final assessment' },
                    { done: false, title: 'Submit for review', desc: 'Our team reviews and publishes within 48 hours' },
                  ].map((step, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${step.done ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
                        ${step.done ? 'bg-emerald-500' : 'border-2 border-gray-300'}`}>
                        {step.done && <Check size={11} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${step.done ? 'text-emerald-700' : 'text-gray-900'}`}>{step.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{step.desc}</div>
                      </div>
                      {step.action && !step.done && (
                        <Button size="sm" variant="primary" onClick={step.action}><ChevronRight size={12}/></Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MY COURSES ──────────────────────────────────────────── */}
        {tab === 'courses' && (
          <div className="space-y-4">
            {courses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="font-bold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-500 text-sm mb-5">Create your first course to reach learners across Kenya.</p>
                <Button variant="primary" onClick={() => setTab('new')}><Plus size={14}/> Create First Course</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-24 bg-gradient-to-br from-stadi-green/10 to-stadi-orange/10 flex items-center justify-center">
                      {c.thumbnail_url
                        ? <img src={c.thumbnail_url} className="w-full h-full object-cover" alt="" />
                        : <BookOpen size={32} className="text-stadi-green/40" />
                      }
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 flex-1">{c.title}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Users size={11}/>{c.enrolment_count} students</span>
                        {c.avg_rating > 0 && <span className="flex items-center gap-1 text-yellow-500"><Star size={11}/>★ {parseFloat(c.avg_rating).toFixed(1)}</span>}
                        <span className="flex items-center gap-1"><Clock size={11}/>Updated {new Date(c.updated_at || c.published_at).toLocaleDateString('en-KE')}</span>
                      </div>
                      <div className="flex gap-2">
                        {c.status === 'draft' && (
                          <Button size="sm" variant="primary" loading={submitCourse.isPending} onClick={() => submitCourse.mutate(c.id)}>
                            <Send size={12}/> Submit for Review
                          </Button>
                        )}
                        {c.status === 'published' && (
                          <Link to={`/courses/${c.slug}`}>
                            <Button size="sm" variant="outline"><Eye size={12}/> View Course</Button>
                          </Link>
                        )}
                        {c.status === 'in_review' && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                            <Loader2 size={11} className="animate-spin"/> Under review
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EARNINGS ─────────────────────────────────────────────── */}
        {tab === 'earnings' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-2xl font-bold text-stadi-green">KES {(dash.totalEarned || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">Total Earned</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-2xl font-bold text-stadi-orange">KES {(dash.pendingPayout || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">Pending Payout</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">Total Students</div>
              </div>
            </div>

            {(dash.totalEarned || 0) > 0 && (
              <div className="bg-stadi-green-light rounded-2xl border border-stadi-green/20 p-5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">Ready to withdraw</div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    Minimum payout is KES 1,000. Sent via M-Pesa to {user?.phone}
                  </div>
                </div>
                <Button variant="primary" loading={requestPayout.isPending}
                  disabled={(dash.totalEarned || 0) < 1000}
                  onClick={() => requestPayout.mutate()}>
                  Request Payout
                </Button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Earnings per Course</h3>
              </div>
              {courses.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No earnings yet. Publish a course to start earning.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {courses.filter(c => c.status === 'published').map(c => {
                    const courseEarnings = earnings.filter(e => e.course_id === c.id);
                    const total = courseEarnings.reduce((s, e) => s + (e.net_amount || 0), 0);
                    return (
                      <div key={c.id} className="flex items-center justify-between px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm truncate">{c.title}</div>
                          <div className="text-xs text-gray-400">{c.enrolment_count} enrolments</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-stadi-green">KES {total.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">earned</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revenue model explainer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">How Earnings Work</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2"><CheckCircle size={14} className="text-stadi-green mt-0.5 shrink-0"/>You earn <strong>70%</strong> of every course sale. Stadi keeps 30%.</div>
                <div className="flex items-start gap-2"><CheckCircle size={14} className="text-stadi-green mt-0.5 shrink-0"/>Payments are processed within <strong>7 days</strong> of each month-end.</div>
                <div className="flex items-start gap-2"><CheckCircle size={14} className="text-stadi-green mt-0.5 shrink-0"/>Minimum payout threshold: <strong>KES 1,000</strong>.</div>
                <div className="flex items-start gap-2"><CheckCircle size={14} className="text-stadi-green mt-0.5 shrink-0"/>All payouts via <strong>M-Pesa B2C</strong> to your registered phone.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENTS ─────────────────────────────────────────────── */}
        {tab === 'students' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Student Analytics</h3>
            <p className="text-gray-500 text-sm mb-2 max-w-md mx-auto">
              Detailed student engagement analytics — completion rates, watch times, assessment scores — are coming in Phase 2 (Month 6).
            </p>
            <p className="text-gray-400 text-xs">
              Current student count across your courses: <strong className="text-gray-700">{totalStudents.toLocaleString()}</strong>
            </p>
          </div>
        )}

        {/* ── NEW COURSE ────────────────────────────────────────────── */}
        {tab === 'new' && (
          <NewCourseForm onSuccess={(course) => {
            setTab('courses');
          }} />
        )}
      </div>
    </div>
  );
}
