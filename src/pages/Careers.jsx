import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  MapPin, Clock, Briefcase, ChevronRight, X, Upload,
  CheckCircle, Search, Building2, Users, TrendingUp, Heart,
  ArrowLeft, ExternalLink
} from 'lucide-react';
import { careersAPI } from '../lib/api';
import { Skeleton, Button, Input, Badge } from '../components/ui';
import useAppStore from '../store/app.store';

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

const TYPE_LABELS = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract:  'Contract',
  intern:    'Internship',
};

const DEPT_COLORS = {
  Technology:  'bg-blue-50 text-blue-700',
  Content:     'bg-purple-50 text-purple-700',
  Marketing:   'bg-pink-50 text-pink-700',
  Operations:  'bg-orange-50 text-orange-700',
  Finance:     'bg-emerald-50 text-emerald-700',
  HR:          'bg-teal-50 text-teal-700',
  Management:  'bg-gray-100 text-gray-700',
};

// ── Why Work at Stadi ─────────────────────────────────────────
const PERKS = [
  { icon: TrendingUp, title: 'Impact at scale',      desc: 'Your work directly improves livelihoods for thousands of Kenyans across all 47 counties.' },
  { icon: Heart,      title: 'Mission-driven culture', desc: 'We\'re building Kenya\'s vocational future. Every role matters, from engineering to curriculum.' },
  { icon: MapPin,     title: 'Kisumu-based',          desc: 'Proudly headquartered in Kisumu City, Western Kenya — with remote-friendly policies.' },
  { icon: Users,      title: 'Small, tight team',     desc: 'Work directly with the founder and see your contributions shipped and celebrated weekly.' },
];

// ── Apply Modal ───────────────────────────────────────────────
function ApplyModal({ job, onClose }) {
  const { addToast } = useAppStore();
  const [form, setForm] = useState({
    applicant_name:  '',
    applicant_email: '',
    applicant_phone: '',
    cover_letter:    '',
    linkedin_url:    '',
    years_experience:'',
    current_role:    '',
  });
  const [submitted, setSubmitted] = useState(false);

  const apply = useMutation({
    mutationFn: (data) => careersAPI.apply(data),
    onSuccess: () => setSubmitted(true),
    onError:   (e) => addToast(e?.message || 'Application failed. Please try again.', 'error'),
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const valid = form.applicant_name && form.applicant_email && form.cover_letter;

  if (submitted) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-stadi-green-light rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-stadi-green" />
        </div>
        <h3 className="text-xl font-bold text-stadi-dark mb-2">Application Sent!</h3>
        <p className="text-stadi-gray text-sm mb-2">
          Thanks <strong>{form.applicant_name}</strong> — we've received your application for <strong>{job.title}</strong>.
        </p>
        <p className="text-stadi-gray text-sm mb-6">We review all applications within 5 business days and will reach out via email if you're shortlisted.</p>
        <Button variant="primary" className="w-full" onClick={onClose}>Done</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-stadi-dark">Apply — {job.title}</h3>
            <p className="text-xs text-stadi-gray mt-0.5">{job.department} · {job.location}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full name *" value={form.applicant_name}
              onChange={set('applicant_name')} placeholder="Your full name" autoFocus />
            <Input label="Email *" type="email" value={form.applicant_email}
              onChange={set('applicant_email')} placeholder="you@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone (WhatsApp)" value={form.applicant_phone}
              onChange={set('applicant_phone')} placeholder="+254 7XX XXX XXX" />
            <Input label="Years of experience" type="number" value={form.years_experience}
              onChange={set('years_experience')} placeholder="3" />
          </div>
          <Input label="Current role / title" value={form.current_role}
            onChange={set('current_role')} placeholder="e.g. Frontend Developer at XYZ" />
          <div>
            <label className="block text-sm font-medium text-stadi-dark mb-1.5">
              Cover letter * <span className="text-stadi-gray font-normal">(why Stadi, why this role)</span>
            </label>
            <textarea value={form.cover_letter} onChange={set('cover_letter')} rows={5}
              placeholder="Tell us about yourself, your motivation, and what you'd bring to Stadi..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" />
          </div>
          <Input label="LinkedIn / Portfolio URL" value={form.linkedin_url}
            onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/yourname" />

          <div className="bg-stadi-green-light rounded-xl p-4 text-xs text-stadi-gray">
            <strong className="text-stadi-green">Note:</strong> We're a small team based in Kisumu.
            We value passion for Kenya's vocational future over credentials. All applications are read by the founder.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" loading={apply.isPending}
            disabled={!valid} onClick={() => apply.mutate({ ...form, job_id: job.id })}>
            Submit Application
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Job Detail View ───────────────────────────────────────────
function JobDetail({ job, onBack, onApply }) {
  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stadi-gray hover:text-stadi-green mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to all jobs
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Top banner */}
        <div className="bg-gradient-to-br from-stadi-green to-[#0d4a2f] p-6 text-white">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 mb-3 inline-block`}>
            {job.department}
          </span>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>{job.title}</h1>
          <div className="flex flex-wrap gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1.5"><MapPin size={13} />{job.location}</span>
            <span className="flex items-center gap-1.5"><Briefcase size={13} />{TYPE_LABELS[job.employment_type] || job.employment_type}</span>
            {job.deadline && <span className="flex items-center gap-1.5"><Clock size={13} />Closes {fmtDate(job.deadline)}</span>}
            {job.salary_min && <span className="flex items-center gap-1.5">
              KES {Number(job.salary_min).toLocaleString()}–{Number(job.salary_max).toLocaleString()}/mo
            </span>}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h2 className="font-bold text-stadi-dark mb-2">About this role</h2>
            <p className="text-stadi-gray text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h2 className="font-bold text-stadi-dark mb-2">Requirements</h2>
              <ul className="space-y-1.5">
                {job.requirements.split('\n').filter(Boolean).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stadi-gray">
                    <CheckCircle size={14} className="text-stadi-green shrink-0 mt-0.5" />
                    {r.replace(/^[-•*]\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nice to have */}
          {job.nice_to_have && (
            <div>
              <h2 className="font-bold text-stadi-dark mb-2">Nice to have</h2>
              <ul className="space-y-1.5">
                {job.nice_to_have.split('\n').filter(Boolean).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stadi-gray">
                    <div className="w-1.5 h-1.5 rounded-full bg-stadi-orange shrink-0 mt-1.5" />
                    {r.replace(/^[-•*]\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <Button variant="primary" className="w-full sm:w-auto px-8" onClick={onApply}>
              Apply for this position →
            </Button>
            <p className="text-xs text-stadi-gray mt-2">Takes about 5 minutes. No CV upload required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────
function JobCard({ job, onClick, onApply }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-stadi-green/30 transition-all duration-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${DEPT_COLORS[job.department] || 'bg-gray-100 text-gray-600'}`}>
              {job.department}
            </span>
            <span className="text-xs text-stadi-gray bg-gray-50 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[job.employment_type] || job.employment_type}
            </span>
          </div>
          <h3 className="font-bold text-stadi-dark text-base leading-snug">{job.title}</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-stadi-gray mb-3">
        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        {job.salary_min && (
          <span className="flex items-center gap-1 text-stadi-green font-semibold">
            KES {Number(job.salary_min).toLocaleString()}–{Number(job.salary_max).toLocaleString()}/mo
          </span>
        )}
        {job.deadline && <span className="flex items-center gap-1"><Clock size={11} />Closes {fmtDate(job.deadline)}</span>}
      </div>

      <p className="text-sm text-stadi-gray leading-relaxed line-clamp-2 mb-4">
        {job.description}
      </p>

      <div className="flex gap-2">
        <button onClick={onClick}
          className="flex-1 text-sm font-medium text-stadi-green border border-stadi-green/30 rounded-xl py-2 hover:bg-stadi-green-light transition-colors">
          View Details
        </button>
        <button onClick={onApply}
          className="flex-1 text-sm font-bold bg-stadi-green text-white rounded-xl py-2 hover:bg-opacity-90 transition-colors">
          Apply Now →
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyJob,    setApplyJob]    = useState(null);
  const [deptFilter,  setDeptFilter]  = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [search,      setSearch]      = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['careers', 'jobs'],
    queryFn:  () => careersAPI.jobs(),
  });

  const jobs = (data?.data || []).filter(j => {
    const matchDept = !deptFilter || j.department === deptFilter;
    const matchType = !typeFilter || j.employment_type === typeFilter;
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchType && matchSearch;
  });

  const allDepts = [...new Set((data?.data || []).map(j => j.department))];

  if (selectedJob) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <JobDetail
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
        onApply={() => { setApplyJob(selectedJob); setSelectedJob(null); }}
      />
      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d4a2f] via-stadi-green to-[#1e7a55] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-white/20">
            We're hiring — Kisumu, Kenya
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Build the future of vocational<br className="hidden sm:block" /> training in Kenya
          </h1>
          <p className="text-white/80 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Join the Stadi team and help 5 million Kenyans learn practical skills, earn income,
            and build better lives — one course at a time.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
            <span className="flex items-center gap-2"><Building2 size={14} />Kisumu HQ</span>
            <span className="flex items-center gap-2"><Users size={14} />Small team, big impact</span>
            <span className="flex items-center gap-2"><Heart size={14} />Mission-driven</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Why Stadi */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {PERKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-stadi-green-light rounded-xl flex items-center justify-center mb-3">
                <Icon size={18} className="text-stadi-green" />
              </div>
              <h3 className="font-bold text-stadi-dark text-sm mb-1">{title}</h3>
              <p className="text-xs text-stadi-gray leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-stadi-dark mb-1" style={{ fontFamily: 'Playfair Display' }}>
            Open Positions
          </h2>
          <p className="text-stadi-gray text-sm">
            {isLoading ? '...' : `${data?.data?.length || 0} open role${data?.data?.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search roles..."
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white">
            <option value="">All Departments</option>
            {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white">
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Jobs grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Briefcase size={40} className="mx-auto text-gray-200 mb-4" />
            <h3 className="font-bold text-stadi-dark mb-1">No open positions right now</h3>
            <p className="text-stadi-gray text-sm">Check back soon — we're growing fast.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => setSelectedJob(job)}
                onApply={() => setApplyJob(job)}
              />
            ))}
          </div>
        )}

        {/* Speculative CTA */}
        <div className="mt-12 bg-stadi-green-light rounded-2xl p-8 text-center border border-stadi-green/20">
          <h3 className="font-bold text-stadi-dark text-lg mb-2">Don't see your role?</h3>
          <p className="text-stadi-gray text-sm mb-4 max-w-md mx-auto">
            We're always looking for talented people who believe in Stadi's mission.
            Send a speculative application and we'll keep you in mind.
          </p>
          <button onClick={() => setApplyJob({ id: 'speculative', title: 'Speculative Application', department: 'General', location: 'Kisumu, Kenya', employment_type: 'full_time' })}
            className="bg-stadi-green text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-opacity-90 transition-all">
            Send Speculative Application →
          </button>
        </div>
      </div>

      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  );
}
