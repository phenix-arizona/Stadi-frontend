import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Briefcase, Calendar, FileText, Plus, Search,
  CheckCircle, XCircle, Clock, RefreshCw, Edit3,
  ChevronLeft, ChevronRight, User, Mail, Phone,
  LayoutDashboard, UserCheck, ClipboardList, Building2
} from 'lucide-react';
import { hrAPI } from '../lib/api';
import { Skeleton, Badge, Button, Input, Modal } from '../components/ui';
import useAppStore from '../store/app.store';
import useAuthStore from '../store/auth.store';

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—';

function KPICard({ icon: Icon, label, value, color = 'green' }) {
  const c = { green:'bg-stadi-green', orange:'bg-stadi-orange', blue:'bg-blue-600', red:'bg-red-500' };
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className={`w-11 h-11 ${c[color]} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const m = {
    pending:     'bg-amber-50 text-amber-700 border-amber-200',
    approved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected:    'bg-red-50 text-red-600 border-red-200',
    cancelled:   'bg-gray-50 text-gray-500 border-gray-200',
    new:         'bg-blue-50 text-blue-700 border-blue-200',
    reviewing:   'bg-purple-50 text-purple-700 border-purple-200',
    shortlisted: 'bg-teal-50 text-teal-700 border-teal-200',
    interview:   'bg-indigo-50 text-indigo-700 border-indigo-200',
    offered:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    withdrawn:   'bg-gray-50 text-gray-500 border-gray-200',
  };
  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${m[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{status}</span>;
}

const TABS = [
  { id:'overview',     icon:LayoutDashboard, label:'Overview' },
  { id:'staff',        icon:Users,           label:'Staff Directory' },
  { id:'leave',        icon:Calendar,        label:'Leave Requests' },
  { id:'jobs',         icon:Briefcase,       label:'Job Listings' },
  { id:'applications', icon:ClipboardList,   label:'Applications' },
];

const LEAVE_TYPES = ['annual','sick','maternity','paternity','unpaid','compassionate'];
const DEPARTMENTS  = ['Technology','Content','Marketing','Operations','Finance','HR','Management'];
const APP_STATUSES = ['new','reviewing','shortlisted','interview','offered','rejected','withdrawn'];

export default function HRPage() {
  const qc = useQueryClient();
  const { addToast } = useAppStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('overview');

  // Modal states
  const [addStaffModal, setAddStaffModal]   = useState(false);
  const [addJobModal,   setAddJobModal]     = useState(false);
  const [editJobData,   setEditJobData]     = useState(null);
  const [leaveModal,    setLeaveModal]      = useState(null);  // leave request to reject
  const [leaveReason,   setLeaveReason]     = useState('');
  const [appModal,      setAppModal]        = useState(null);  // application to update
  const [staffSearch,   setStaffSearch]     = useState('');
  const [deptFilter,    setDeptFilter]      = useState('');
  const [leaveFilter,   setLeaveFilter]     = useState('pending');
  const [appFilter,     setAppFilter]       = useState('new');

  // Forms
  const [staffForm, setStaffForm] = useState({ phone:'', name:'', department:'', jobTitle:'', role:'hr', employeeId:'' });
  const [jobForm,   setJobForm]   = useState({ title:'', department:'', location:'Kisumu, Kenya', employmentType:'full_time', description:'', requirements:'', niceToHave:'', salaryMin:'', salaryMax:'', deadline:'' });

  // ── Queries ──────────────────────────────────────────────────
  const { data: sumData } = useQuery({ queryKey:['hr','summary'], queryFn: hrAPI.summary, refetchInterval:30000 });
  const { data: staffData, isLoading: sl } = useQuery({
    queryKey: ['hr','staff', staffSearch, deptFilter],
    queryFn:  () => hrAPI.staff({ search: staffSearch||undefined, department: deptFilter||undefined }),
    enabled:  tab === 'staff' || tab === 'overview',
  });
  const { data: leaveData, isLoading: ll } = useQuery({
    queryKey: ['hr','leave', leaveFilter],
    queryFn:  () => hrAPI.leave({ status: leaveFilter||undefined }),
    enabled:  tab === 'leave' || tab === 'overview',
  });
  const { data: jobsData, isLoading: jl } = useQuery({
    queryKey: ['hr','jobs'],
    queryFn:  hrAPI.jobs,
    enabled:  tab === 'jobs' || tab === 'overview' || tab === 'applications',
  });
  const { data: appsData, isLoading: al } = useQuery({
    queryKey: ['hr','apps', appFilter],
    queryFn:  () => hrAPI.applications({ status: appFilter||undefined }),
    enabled:  tab === 'applications',
  });

  const sum   = sumData?.data  || {};
  const staff = staffData?.data || [];
  const leave = leaveData?.data || [];
  const jobs  = jobsData?.data  || [];
  const apps  = appsData?.data  || [];

  // ── Mutations ────────────────────────────────────────────────
  const addStaff    = useMutation({ mutationFn: hrAPI.addStaff, onSuccess: () => { qc.invalidateQueries(['hr']); addToast('Staff member added ✓', 'success'); setAddStaffModal(false); setStaffForm({phone:'',name:'',department:'',jobTitle:'',role:'hr',employeeId:''}); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const createJob   = useMutation({ mutationFn: hrAPI.createJob, onSuccess: () => { qc.invalidateQueries(['hr','jobs']); addToast('Job listing created ✓','success'); setAddJobModal(false); setJobForm({title:'',department:'',location:'Kisumu, Kenya',employmentType:'full_time',description:'',requirements:'',niceToHave:'',salaryMin:'',salaryMax:'',deadline:''}); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const updateJob   = useMutation({ mutationFn: ({id,...d})=>hrAPI.updateJob(id,d), onSuccess: () => { qc.invalidateQueries(['hr','jobs']); addToast('Job updated ✓','success'); setEditJobData(null); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const closeJob    = useMutation({ mutationFn: hrAPI.closeJob, onSuccess: () => { qc.invalidateQueries(['hr','jobs']); addToast('Job listing closed.','info'); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const approveLv   = useMutation({ mutationFn: hrAPI.approveLeave, onSuccess: () => { qc.invalidateQueries(['hr','leave']); addToast('Leave approved ✓','success'); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const rejectLv    = useMutation({ mutationFn: ({id,reason})=>hrAPI.rejectLeave(id,reason), onSuccess: () => { qc.invalidateQueries(['hr','leave']); addToast('Leave rejected.','info'); setLeaveModal(null); setLeaveReason(''); }, onError:(e)=>addToast(e?.message||'Failed','error') });
  const updateApp   = useMutation({ mutationFn: ({id,...d})=>hrAPI.updateApplication(id,d), onSuccess: () => { qc.invalidateQueries(['hr','apps']); addToast('Application updated ✓','success'); setAppModal(null); }, onError:(e)=>addToast(e?.message||'Failed','error') });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">HR Portal</h1>
              <p className="text-sm text-gray-500 mt-0.5">Staff, leave, recruitment — Stadi Platform</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries(['hr'])}>
              <RefreshCw size={14}/> Refresh
            </Button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                  ${tab===t.id?'border-stadi-green text-stadi-green':'border-transparent text-gray-500 hover:text-stadi-green'}`}>
                <t.icon size={15}/>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard icon={Users}         label="Total Staff"          value={sum.totalStaff}  color="green" />
              <KPICard icon={Calendar}      label="Pending Leave"        value={sum.openLeave}   color="orange" />
              <KPICard icon={ClipboardList} label="New Applications"     value={sum.openApps}    color="blue" />
              <KPICard icon={Briefcase}     label="Open Job Listings"    value={sum.openJobs}    color="green" />
            </div>

            {/* Pending leave */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Pending Leave Requests</h3>
                <button onClick={() => setTab('leave')} className="text-xs text-stadi-green hover:underline">View all</button>
              </div>
              {leave.filter(l => l.status==='pending').length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm"><CheckCircle size={24} className="mx-auto mb-2 text-emerald-400"/>No pending leave requests</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {leave.filter(l => l.status==='pending').slice(0,5).map(l => (
                    <div key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{l.users?.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 capitalize">{l.leave_type} leave · {l.days} day{l.days!==1?'s':''} · {fmtDate(l.start_date)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary"   loading={approveLv.isPending} onClick={() => approveLv.mutate(l.id)}>Approve</Button>
                        <Button size="sm" variant="ghost"     onClick={() => { setLeaveModal(l.id); }}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active jobs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Active Job Listings</h3>
                <button onClick={() => setTab('jobs')} className="text-xs text-stadi-green hover:underline">Manage</button>
              </div>
              {jobs.filter(j => j.is_active).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No active job listings</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {jobs.filter(j => j.is_active).slice(0,5).map(j => (
                    <div key={j.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{j.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{j.department} · {j.location} · Deadline: {fmtDate(j.deadline)}</div>
                      </div>
                      {j.is_featured && <Badge variant="orange">Featured</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STAFF DIRECTORY ──────────────────────────────────── */}
        {tab === 'staff' && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Search staff..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white"/>
              </div>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white">
                <option value="">All departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Button variant="primary" size="sm" onClick={() => setAddStaffModal(true)}><Plus size={14}/> Add Staff Member</Button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    {['Staff Member','ID','Role','Department','Job Title','Status','Hire Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {sl ? Array.from({length:5}).map((_,i) => <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td></tr>)
                    : staff.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No staff members found. Add your first staff member.</td></tr>
                    ) : staff.map(s => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-stadi-green-light text-stadi-green font-bold text-xs flex items-center justify-center shrink-0">
                              {s.name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{s.name || '—'}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{s.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{s.employee_id || '—'}</td>
                        <td className="px-4 py-3"><Badge variant={s.role.includes('admin')?'orange':'green'}>{s.role}</Badge></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.department || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.job_title || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${s.is_active?'text-emerald-600':'text-red-500'}`}>
                            {s.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(s.hire_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── LEAVE REQUESTS ───────────────────────────────────── */}
        {tab === 'leave' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[['pending','Pending'], ['approved','Approved'], ['rejected','Rejected'], ['','All']].map(([v,l]) => (
                <button key={v} onClick={() => setLeaveFilter(v)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${leaveFilter===v?'bg-stadi-green text-white':'bg-white border border-gray-200 text-gray-600 hover:border-stadi-green'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    {['Employee','Type','Dates','Days','Reason','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {ll ? Array.from({length:5}).map((_,i) => <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td></tr>)
                    : leave.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No leave requests</td></tr>
                    ) : leave.map(l => (
                      <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{l.users?.name}</div>
                          <div className="text-[10px] text-gray-400">{l.users?.department}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 capitalize">{l.leave_type}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">{l.days}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{l.reason || '—'}</td>
                        <td className="px-4 py-3"><StatusPill status={l.status}/></td>
                        <td className="px-4 py-3">
                          {l.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="primary"   loading={approveLv.isPending} onClick={() => approveLv.mutate(l.id)}>Approve</Button>
                              <Button size="sm" variant="ghost"     onClick={() => setLeaveModal(l.id)}>Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── JOB LISTINGS ─────────────────────────────────────── */}
        {tab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Job Listings</h3>
              <Button variant="primary" size="sm" onClick={() => setAddJobModal(true)}><Plus size={14}/> Post New Job</Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {jl ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-48 rounded-2xl"/>)
              : jobs.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Briefcase size={32} className="mx-auto mb-3 text-gray-300"/>
                  <p className="text-gray-500 text-sm mb-3">No job listings yet</p>
                  <Button variant="primary" size="sm" onClick={() => setAddJobModal(true)}><Plus size={13}/> Post First Job</Button>
                </div>
              ) : jobs.map(j => (
                <div key={j.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${j.is_active?'border-gray-100':'border-gray-100 opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">{j.title}</h3>
                        {j.is_featured && <Badge variant="orange">Featured</Badge>}
                        {!j.is_active && <Badge variant="gray">Closed</Badge>}
                      </div>
                      <div className="text-xs text-gray-500">{j.department} · {j.location} · <span className="capitalize">{j.employment_type?.replace('_',' ')}</span></div>
                    </div>
                  </div>
                  {j.salary_min && (
                    <div className="text-xs text-stadi-green font-semibold mb-2">
                      KES {j.salary_min?.toLocaleString()} – {j.salary_max?.toLocaleString()}/mo
                    </div>
                  )}
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{j.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-gray-400">Deadline: {fmtDate(j.deadline)}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditJobData(j); setJobForm({ title:j.title, department:j.department, location:j.location, employmentType:j.employment_type, description:j.description, requirements:j.requirements||'', niceToHave:j.nice_to_have||'', salaryMin:j.salary_min||'', salaryMax:j.salary_max||'', deadline:j.deadline?.slice(0,10)||'' }); }}>
                        <Edit3 size={12}/> Edit
                      </Button>
                      {j.is_active && (
                        <Button size="sm" variant="ghost" onClick={() => { if(window.confirm('Close this listing?')) closeJob.mutate(j.id); }}>
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── APPLICATIONS ─────────────────────────────────────── */}
        {tab === 'applications' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[['new','New'], ['reviewing','Reviewing'], ['shortlisted','Shortlisted'], ['interview','Interview'], ['offered','Offered'], ['rejected','Rejected'], ['','All']].map(([v,l]) => (
                <button key={v} onClick={() => setAppFilter(v)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${appFilter===v?'bg-stadi-green text-white':'bg-white border border-gray-200 text-gray-600 hover:border-stadi-green'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    {['Applicant','Position','Contact','Applied','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {al ? Array.from({length:5}).map((_,i) => <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td></tr>)
                    : apps.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No applications matching filter</td></tr>
                    ) : apps.map(a => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {a.applicant_name?.[0] || '?'}
                            </div>
                            <div className="font-medium text-gray-900 text-sm">{a.applicant_name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate">{a.job_listings?.title}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-500">{a.applicant_email}</div>
                          {a.applicant_phone && <div className="text-[10px] text-gray-400 font-mono">{a.applicant_phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(a.created_at)}</td>
                        <td className="px-4 py-3"><StatusPill status={a.status}/></td>
                        <td className="px-4 py-3">
                          <button onClick={() => setAppModal(a)}
                            className="text-xs text-stadi-green hover:underline font-medium">Update Status</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────────────────── */}

      {/* Add Staff */}
      <Modal isOpen={addStaffModal} onClose={() => setAddStaffModal(false)} title="Add Staff Member" size="sm">
        <div className="p-6 space-y-3">
          <Input label="Phone *" value={staffForm.phone} onChange={e => setStaffForm(f=>({...f,phone:e.target.value}))} placeholder="0712 345 678" autoFocus/>
          <Input label="Full Name" value={staffForm.name} onChange={e => setStaffForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Achieng Otieno"/>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Role</label>
              <select value={staffForm.role} onChange={e => setStaffForm(f=>({...f,role:e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
                {['hr','finance','admin','instructor','learner'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Department</label>
              <select value={staffForm.department} onChange={e => setStaffForm(f=>({...f,department:e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <Input label="Job Title" value={staffForm.jobTitle} onChange={e => setStaffForm(f=>({...f,jobTitle:e.target.value}))} placeholder="e.g. Content Lead"/>
          <Input label="Employee ID" value={staffForm.employeeId} onChange={e => setStaffForm(f=>({...f,employeeId:e.target.value}))} placeholder="e.g. STD-001"/>
          <div className="flex gap-3 pt-1">
            <Button variant="primary" className="flex-1" loading={addStaff.isPending} disabled={!staffForm.phone} onClick={() => addStaff.mutate(staffForm)}>Add Staff Member</Button>
            <Button variant="ghost" className="flex-1" onClick={() => setAddStaffModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Job */}
      <Modal isOpen={addJobModal || !!editJobData} onClose={() => { setAddJobModal(false); setEditJobData(null); }} title={editJobData ? 'Edit Job Listing' : 'Post New Job'} size="md">
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <Input label="Job Title *" value={jobForm.title} onChange={e => setJobForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Content & Curriculum Lead" autoFocus/>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Department *</label>
              <select value={jobForm.department} onChange={e => setJobForm(f=>({...f,department:e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Type</label>
              <select value={jobForm.employmentType} onChange={e => setJobForm(f=>({...f,employmentType:e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
                {[['full_time','Full Time'],['part_time','Part Time'],['contract','Contract'],['intern','Internship']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <Input label="Location" value={jobForm.location} onChange={e => setJobForm(f=>({...f,location:e.target.value}))} placeholder="Kisumu, Kenya"/>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Description *</label>
            <textarea value={jobForm.description} onChange={e => setJobForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Role description..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Requirements</label>
            <textarea value={jobForm.requirements} onChange={e => setJobForm(f=>({...f,requirements:e.target.value}))} rows={2} placeholder="Must-have qualifications..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none"/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Min Salary (KES)" type="number" value={jobForm.salaryMin} onChange={e => setJobForm(f=>({...f,salaryMin:e.target.value}))} placeholder="50000"/>
            <Input label="Max Salary (KES)" type="number" value={jobForm.salaryMax} onChange={e => setJobForm(f=>({...f,salaryMax:e.target.value}))} placeholder="80000"/>
            <Input label="Deadline" type="date" value={jobForm.deadline} onChange={e => setJobForm(f=>({...f,deadline:e.target.value}))}/>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="primary" className="flex-1"
              loading={createJob.isPending || updateJob.isPending}
              disabled={!jobForm.title || !jobForm.department || !jobForm.description}
              onClick={() => editJobData ? updateJob.mutate({id:editJobData.id,...jobForm}) : createJob.mutate(jobForm)}>
              {editJobData ? 'Save Changes' : 'Post Job Listing'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setAddJobModal(false); setEditJobData(null); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Leave */}
      <Modal isOpen={!!leaveModal} onClose={() => { setLeaveModal(null); setLeaveReason(''); }} title="Reject Leave Request" size="sm">
        <div className="p-6 space-y-3">
          <Input label="Reason *" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Reason for rejection..." autoFocus/>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" loading={rejectLv.isPending} disabled={!leaveReason.trim()} onClick={() => rejectLv.mutate({id:leaveModal, reason:leaveReason})}>Confirm Rejection</Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setLeaveModal(null); setLeaveReason(''); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Update Application Status */}
      <Modal isOpen={!!appModal} onClose={() => setAppModal(null)} title={`Update: ${appModal?.applicant_name}`} size="sm">
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="font-medium text-gray-900 mb-1">{appModal?.job_listings?.title}</div>
            <div className="text-gray-500 text-xs">{appModal?.applicant_email}</div>
            {appModal?.cover_letter && <p className="text-gray-600 text-xs mt-2 line-clamp-3">{appModal.cover_letter}</p>}
            {appModal?.linkedin_url && <a href={appModal.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-stadi-green hover:underline mt-1 block">LinkedIn Profile →</a>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Update Status</label>
            <div className="grid grid-cols-2 gap-2">
              {APP_STATUSES.map(s => (
                <button key={s} onClick={() => updateApp.mutate({id:appModal.id, status:s})}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border capitalize transition-all hover:border-stadi-green
                    ${appModal?.status===s ? 'bg-stadi-green text-white border-stadi-green' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Internal Notes</label>
            <textarea defaultValue={appModal?.notes||''} rows={2} id="app-notes"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none"
              placeholder="Notes for internal team..."/>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" loading={updateApp.isPending}
              onClick={() => updateApp.mutate({id:appModal.id, notes: document.getElementById('app-notes')?.value})}>
              Save Notes
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setAppModal(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
