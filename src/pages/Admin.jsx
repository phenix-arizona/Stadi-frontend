import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, CreditCard, Award,
  TrendingUp, AlertTriangle, RefreshCw, Search, Shield,
  Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  BarChart3, Flame, MessageSquare, Download, Filter,
  ArrowUpRight, ArrowDownRight, Clock, Zap, Bell,
  MoreVertical, UserCheck, UserX, Globe, Activity, DollarSign} from 'lucide-react';
import { adminAPI } from '../lib/api';
import { Skeleton, Badge, Button, Input, Modal } from '../components/ui';
import useAppStore from '../store/app.store';
import useAuthStore from '../store/auth.store';
import api from '../lib/api';

// ── Reusable components ───────────────────────────────────────
function KPICard({ icon: Icon, label, value, change, changeType = 'up', color = 'green', loading }) {
  const bg = { green: 'bg-stadi-green', orange: 'bg-stadi-orange', blue: 'bg-blue-600', red: 'bg-red-500', purple: 'bg-purple-600' };
  const changeBg = changeType === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50';
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${bg[color]} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon size={20} className="text-white" />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${changeBg}`}>
            {changeType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}%
          </span>
        )}
      </div>
      {loading ? <Skeleton className="h-8 w-20 mb-1" /> : <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>}
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    published:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_review:   'bg-amber-50 text-amber-700 border-amber-200',
    draft:       'bg-gray-50 text-gray-600 border-gray-200',
    unpublished: 'bg-gray-50 text-gray-500 border-gray-200',
    completed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:     'bg-amber-50 text-amber-700 border-amber-200',
    failed:      'bg-red-50 text-red-600 border-red-200',
    refunded:    'bg-blue-50 text-blue-600 border-blue-200',
    true:        'bg-emerald-50 text-emerald-700 border-emerald-200',
    false:       'bg-red-50 text-red-600 border-red-200',
    open:        'bg-amber-50 text-amber-700 border-amber-200',
    resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const labels = {
    published:'Published', in_review:'In Review', draft:'Draft', unpublished:'Unpublished',
    completed:'Paid ✓', pending:'Pending', failed:'Failed', refunded:'Refunded',
    true:'Valid ✓', false:'Revoked', open:'Open', resolved:'Resolved',
  };
  const key = String(status);
  const cls = map[key] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {labels[key] || key}
    </span>
  );
}

function Table({ cols, children, loading, emptyMsg = 'No data found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {cols.map(c => (
              <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td colSpan={cols.length} className="px-4 py-3">
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                </tr>
              ))
            : children
          }
        </tbody>
      </table>
      {!loading && !children?.length && (
        <div className="text-center py-12 text-gray-400 text-sm">{emptyMsg}</div>
      )}
    </div>
  );
}

function Pager({ page, setPage, total, perPage = 25 }) {
  const pages = Math.ceil((total || 0) / perPage);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-500">{total ? `${total.toLocaleString()} total` : ''}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
          {page}{pages > 1 ? ` / ${pages}` : ''}
        </span>
        <button onClick={() => setPage(p => p + 1)} disabled={!total || page >= pages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Admin sidebar ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',     icon: LayoutDashboard, label: 'Overview',      badge: null },
  { id: 'users',        icon: Users,           label: 'Users',         badge: null },
  { id: 'courses',      icon: BookOpen,        label: 'Courses',       badge: 'review' },
  { id: 'payments',     icon: CreditCard,      label: 'Payments',      badge: null },
  { id: 'certificates', icon: Award,           label: 'Certificates',  badge: null },
  { id: 'payouts',      icon: TrendingUp,      label: 'Payouts',       badge: 'payout' },
  { id: 'support',      icon: MessageSquare,   label: 'Support',       badge: 'ticket' },
  { id: 'audit',        icon: Shield,          label: 'Audit Log',     badge: null },
];

export default function AdminPage() {
  const qc = useQueryClient();
  const { addToast } = useAppStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [addInstructorOpen, setAddInstructorOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({ phone: '', name: '' });
  const [addingInstructor, setAddingInstructor] = useState(false);

  // Quick-add inline state (keyboard-first, always visible on Users tab)
  const [quickPhone, setQuickPhone] = useState('');
  const [quickName,  setQuickName]  = useState('');
  const [quickAdding, setQuickAdding] = useState(false);
  const quickPhoneRef = React.useRef(null);

  // Pagination states
  const [pages, setPages] = useState({ users: 1, courses: 1, payments: 1, certs: 1, support: 1 });
  const pg = (k) => pages[k];
  const spg = (k) => (v) => setPages(p => ({ ...p, [k]: typeof v === 'function' ? v(p[k]) : v }));

  // Filter states
  const [userSearch,    setUserSearch]    = useState('');
  const [courseStatus,  setCourseStatus]  = useState('');
  const [payStatus,     setPayStatus]     = useState('');
  const [certSearch,    setCertSearch]    = useState('');
  const [supportStatus, setSupportStatus] = useState('open');

  // ── Queries ─────────────────────────────────────────────────
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminAPI.stats,
    refetchInterval: 60_000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userSearch, pg('users')],
    queryFn: () => adminAPI.users({ search: userSearch || undefined, page: pg('users') }),
    enabled: tab === 'users',
    keepPreviousData: true,
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin', 'courses', courseStatus, pg('courses')],
    queryFn: () => adminAPI.courses({ status: courseStatus || undefined, page: pg('courses') }),
    enabled: tab === 'courses' || tab === 'overview',
    keepPreviousData: true,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin', 'payments', payStatus, pg('payments')],
    queryFn: () => adminAPI.payments({ status: payStatus || undefined, page: pg('payments') }),
    enabled: tab === 'payments',
    keepPreviousData: true,
  });

  const { data: certsData, isLoading: certsLoading } = useQuery({
    queryKey: ['admin', 'certs', certSearch, pg('certs')],
    queryFn: () => api.get(`/certificates/admin/all?page=${pg('certs')}&search=${certSearch}`),
    enabled: tab === 'certificates',
    keepPreviousData: true,
  });

  const { data: payoutsData } = useQuery({
    queryKey: ['admin', 'payouts'],
    queryFn: () => adminAPI.payouts({ status: 'pending' }),
    enabled: tab === 'payouts' || tab === 'overview',
  });

  const { data: supportData, isLoading: supportLoading } = useQuery({
    queryKey: ['admin', 'support', supportStatus, pg('support')],
    queryFn: () => api.get(`/support/tickets?status=${supportStatus}&page=${pg('support')}`),
    enabled: tab === 'support',
    keepPreviousData: true,
  });

  const { data: auditData } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: adminAPI.auditLog,
    enabled: tab === 'audit',
  });

  const s   = statsData?.data    || {};
  const users    = usersData?.data    || [];
  const courses  = coursesData?.data  || [];
  const payments = paymentsData?.data || [];
  const certs    = certsData?.data    || [];
  const payouts  = payoutsData?.data  || [];
  const tickets  = supportData?.data  || [];
  const auditLog = auditData?.data    || [];

  // pending counts for badges
  const pendingReviews = courses.filter(c => c.status === 'in_review').length;
  const pendingPayouts = payouts.filter(p => p.status === 'pending').length;
  const openTickets    = s.openTickets || 0;

  // ── Mutations ────────────────────────────────────────────────
  const publishCourse  = useMutation({ mutationFn: (id) => adminAPI.updateCourse(id, { status: 'published' }), onSuccess: () => { qc.invalidateQueries(['admin']); addToast('Course published ✓', 'success'); } });
  const rejectCourse   = useMutation({ mutationFn: (id) => adminAPI.updateCourse(id, { status: 'draft' }),      onSuccess: () => { qc.invalidateQueries(['admin']); addToast('Course returned to draft.', 'info'); } });
  const suspendUser    = useMutation({ mutationFn: ({ id, active }) => adminAPI.updateUser(id, { is_active: active }), onSuccess: () => { qc.invalidateQueries(['admin', 'users']); addToast('User updated.', 'success'); } });
  const refundPay      = useMutation({ mutationFn: ({ id, reason }) => adminAPI.refund(id, reason), onSuccess: () => { qc.invalidateQueries(['admin']); addToast('Refund processed.', 'success'); setConfirmModal(null); } });
  const approvePayout  = useMutation({ mutationFn: (id) => adminAPI.approvePayout(id), onSuccess: () => { qc.invalidateQueries(['admin', 'payouts']); addToast('Payout approved & sent ✓', 'success'); } });
  const rejectPayout   = useMutation({ mutationFn: (id) => api.post(`/payouts/${id}/reject`, { reason: 'Admin rejected' }), onSuccess: () => { qc.invalidateQueries(['admin', 'payouts']); addToast('Payout rejected.', 'info'); } });
  const revokeCert     = useMutation({ mutationFn: ({ id, reason }) => api.patch(`/certificates/${id}/revoke`, { reason }), onSuccess: () => { qc.invalidateQueries(['admin', 'certs']); addToast('Certificate revoked.', 'info'); setConfirmModal(null); } });
  const reinstateCert  = useMutation({ mutationFn: (id) => api.patch(`/certificates/${id}/reinstate`, {}), onSuccess: () => { qc.invalidateQueries(['admin', 'certs']); addToast('Certificate reinstated ✓', 'success'); } });
  const closeTicket    = useMutation({ mutationFn: (id) => api.patch(`/support/tickets/${id}`, { status: 'resolved' }), onSuccess: () => { qc.invalidateQueries(['admin', 'support']); addToast('Ticket resolved ✓', 'success'); } });

  // ── Add Instructor ──────────────────────────────────────────
 // ── Add Instructor ──────────────────────────────────────────
const handleAddInstructor = async () => {
  const phone = newInstructor.phone.trim().replace(/^0/, '+254').replace(/^(?!\+)/, '+254');
  if (!phone.match(/^\+254\d{9}$/)) { addToast('Enter a valid Kenyan number e.g. 0712345678', 'error'); return; }
  setAddingInstructor(true);
  try {
    await adminAPI.setInstructor({ phone, name: newInstructor.name.trim() });
    addToast(`✅ ${newInstructor.name || phone} is now an instructor`, 'success');
    setAddInstructorOpen(false);
    setNewInstructor({ phone: '', name: '' });
    qc.invalidateQueries(['admin', 'users']);
  } catch (e) {
    addToast(e?.message || 'Failed to add instructor. Check the phone number.', 'error');
  } finally { setAddingInstructor(false); }
};

// ── Quick-add instructor (keyboard-first) ──────────────────
const handleQuickAdd = async () => {
  const raw = quickPhone.trim();
  if (!raw) return;
  const phone = raw
    .replace(/\s+/g, '')
    .replace(/^0/, '+254')
    .replace(/^254/, '+254')
    .replace(/^(?!\+)/, '+254');

  if (!phone.match(/^\+254\d{9}$/)) {
    addToast('Enter a valid Kenyan number e.g. 0712 345 678', 'error');
    quickPhoneRef.current?.focus();
    return;
  }

  setQuickAdding(true);
  try {
    await adminAPI.setInstructor({ phone, name: quickName.trim() || undefined });
    addToast(`✅ ${quickName.trim() || phone} is now an instructor`, 'success');
    setQuickPhone('');
    setQuickName('');
    qc.invalidateQueries(['admin', 'users']);
    quickPhoneRef.current?.focus();
  } catch (e) {
    addToast(e?.message || 'Failed. Check the phone number and try again.', 'error');
  } finally {
    setQuickAdding(false);
  }
};

  // ── Layout ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex-shrink-0 flex flex-col hidden lg:flex">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stadi-green rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">Admin Panel</div>
              <div className="text-xs text-gray-400">Stadi Platform</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const badgeCount = item.badge === 'review' ? pendingReviews : item.badge === 'payout' ? pendingPayouts : item.badge === 'ticket' ? openTickets : 0;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${tab === item.id ? 'bg-stadi-green text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="flex items-center gap-3">
                  <item.icon size={16} />
                  {item.label}
                </span>
                {badgeCount > 0 && (
                  <span className="bg-stadi-orange text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center font-bold text-white text-xs">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-gray-300 font-medium truncate">{user?.name || 'Admin'}</div>
              <div className="truncate">{user?.phone}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 z-50 flex overflow-x-auto">
        {NAV_ITEMS.slice(0, 6).map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center py-2 px-1 text-[9px] font-medium min-w-0 transition-colors
              ${tab === item.id ? 'text-stadi-green' : 'text-gray-400'}`}>
            <item.icon size={18} className="mb-0.5" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 capitalize">{tab === 'overview' ? 'Dashboard' : tab}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => qc.invalidateQueries(['admin'])}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <div className="w-8 h-8 bg-stadi-green rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">

          {/* ════ OVERVIEW ════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <KPICard icon={Users}        label="Total Users"       value={s.totalUsers?.toLocaleString()}         color="blue"   loading={statsLoading} />
                <KPICard icon={BookOpen}     label="Enrollments"       value={s.totalEnrollments?.toLocaleString()}   color="green"  loading={statsLoading} />
                <KPICard icon={Award}        label="Certificates"      value={s.totalCertificates?.toLocaleString()}  color="orange" loading={statsLoading} />
                <KPICard icon={CreditCard}   label="Revenue (14d)"     value={s.revenue14d ? `KES ${Math.round(s.revenue14d/1000)}K` : '—'} color="green" loading={statsLoading} />
                <KPICard icon={AlertTriangle}label="Open Tickets"      value={s.openTickets}                          color="red"    loading={statsLoading} />
                <KPICard icon={Activity}     label="In Review"         value={pendingReviews}                         color="purple" loading={false} />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Courses awaiting review */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Courses Awaiting Review</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Submitted by instructors for approval</p>
                    </div>
                    {pendingReviews > 0 && <Badge variant="orange">{pendingReviews} pending</Badge>}
                  </div>
                  {courses.filter(c => c.status === 'in_review').length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400" />
                      All clear — no courses pending review
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {courses.filter(c => c.status === 'in_review').map(c => (
                        <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-sm truncate">{c.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5">by {c.users?.name} · KES {c.price_kes?.toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2 ml-3 shrink-0">
                            <Button size="sm" variant="primary" loading={publishCourse.isPending} onClick={() => publishCourse.mutate(c.id)}>Publish</Button>
                            <Button size="sm" variant="danger"  loading={rejectCourse.isPending}  onClick={() => rejectCourse.mutate(c.id)}>Reject</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending payouts */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Pending Instructor Payouts</h3>
                      <p className="text-xs text-gray-500 mt-0.5">M-Pesa transfers awaiting approval</p>
                    </div>
                    {pendingPayouts > 0 && <Badge variant="orange">{pendingPayouts} pending</Badge>}
                  </div>
                  {payouts.filter(p => p.status === 'pending').length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400" />
                      No pending payouts
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {payouts.filter(p => p.status === 'pending').map(p => (
                        <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{p.users?.name}</div>
                            <div className="text-xs text-gray-400">KES {p.amount?.toLocaleString()} → {p.mpesa_phone || p.users?.phone}</div>
                          </div>
                          <div className="flex gap-2 ml-3 shrink-0">
                            <Button size="sm" variant="primary" loading={approvePayout.isPending} onClick={() => approvePayout.mutate(p.id)}>Approve & Pay</Button>
                            <Button size="sm" variant="ghost"   onClick={() => rejectPayout.mutate(p.id)}>Reject</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent payments */}
              {s.recentPayments?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Recent Payments</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {s.recentPayments.slice(0, 8).map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-2.5">
                        <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-KE')}</div>
                        <div className="font-semibold text-emerald-600 text-sm">+ KES {p.amount_kes?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ USERS ═══════════════════════════════════════════ */}
          {tab === 'users' && (
            <div className="space-y-4">

              {/* ── Quick-add instructor bar ─────────────────────── */}
              <div className="bg-white rounded-2xl border border-stadi-green/30 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck size={15} className="text-stadi-green" />
                  <span className="text-sm font-bold text-gray-900">Add Instructor</span>
                  <span className="text-xs text-gray-400 ml-1">— type directly and press Enter</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={quickPhoneRef}
                    value={quickPhone}
                    onChange={e => setQuickPhone(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
                    placeholder="Phone e.g. 0712 345 678 *"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white"
                    autoComplete="off"
                    type="tel"
                  />
                  <input
                    value={quickName}
                    onChange={e => setQuickName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
                    placeholder="Full name (optional)"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white"
                    autoComplete="off"
                  />
                  <button
                    onClick={handleQuickAdd}
                    disabled={!quickPhone.trim() || quickAdding}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-stadi-green text-white text-sm font-semibold rounded-xl hover:bg-stadi-green/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {quickAdding
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <UserCheck size={15} />
                    }
                    {quickAdding ? 'Adding…' : 'Make Instructor'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Works for existing users or new phone numbers. Number is auto-formatted to +254XXXXXXXXX.
                  Press <kbd className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono">Enter</kbd> in any field to submit.
                </p>
              </div>

              {/* ── Search + table ────────────────────────────────── */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={userSearch} onChange={e => { setUserSearch(e.target.value); spg('users')(1); }}
                    placeholder="Search by name or phone number..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white" />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table cols={['User', 'Phone', 'Role', 'County', 'Language', 'Status', 'Joined', 'Actions']} loading={usersLoading}>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-stadi-green-light text-stadi-green font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name?.[0] || '?'}
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{u.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.phone}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={u.role.includes('admin') ? 'published' : 'draft'} />
                        <span className="ml-1.5 text-xs text-gray-500 capitalize">{u.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{u.county || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{u.language || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {u.is_active
                            ? <><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /><span className="text-xs text-emerald-600 font-medium">Active</span></>
                            : <><div className="w-1.5 h-1.5 bg-red-500 rounded-full" /><span className="text-xs text-red-500 font-medium">Suspended</span></>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {!u.role.includes('admin') && (
                            <button onClick={() => suspendUser.mutate({ id: u.id, active: !u.is_active })}
                              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors
                                ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                              {u.is_active ? <><UserX size={12} /> Suspend</> : <><UserCheck size={12} /> Restore</>}
                            </button>
                          )}
                          {u.role === 'learner' && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.patch('/admin/users/set-instructor', { phone: u.phone });
                                  addToast(`✅ ${u.name || u.phone} is now an instructor`, 'success');
                                  qc.invalidateQueries(['admin', 'users']);
                                } catch (e) {
                                  addToast(e?.message || 'Failed to update role.', 'error');
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-stadi-green hover:bg-stadi-green-light transition-colors"
                            >
                              <UserCheck size={12} /> Make Instructor
                            </button>
                          )}
                          {u.role === 'instructor' && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.patch(`/admin/users/${u.id}`, { role: 'learner' });
                                  addToast(`${u.name || u.phone} role set back to learner.`, 'info');
                                  qc.invalidateQueries(['admin', 'users']);
                                } catch (e) {
                                  addToast(e?.message || 'Failed to update role.', 'error');
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <UserX size={12} /> Remove Instructor
                            </button>
                          )}
                          {/* ── Finance & HR role assignment ── */}
                          {!['finance','hr','admin','super_admin'].includes(u.role) && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.post('/hr/staff', { phone: u.phone, name: u.name, role: 'finance' });
                                  addToast(`✅ ${u.name || u.phone} is now a Finance Officer`, 'success');
                                  qc.invalidateQueries(['admin', 'users']);
                                } catch (e) {
                                  addToast(e?.message || 'Failed to assign role.', 'error');
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <DollarSign size={12} /> Make Finance
                            </button>
                          )}
                          {!['finance','hr','admin','super_admin'].includes(u.role) && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.post('/hr/staff', { phone: u.phone, name: u.name, role: 'hr' });
                                  addToast(`✅ ${u.name || u.phone} is now an HR Officer`, 'success');
                                  qc.invalidateQueries(['admin', 'users']);
                                } catch (e) {
                                  addToast(e?.message || 'Failed to assign role.', 'error');
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                              <Users size={12} /> Make HR
                            </button>
                          )}
                          {['finance','hr'].includes(u.role) && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.patch(`/admin/users/${u.id}`, { role: 'learner' });
                                  addToast(`${u.name || u.phone} role removed.`, 'info');
                                  qc.invalidateQueries(['admin', 'users']);
                                } catch (e) {
                                  addToast(e?.message || 'Failed to update role.', 'error');
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <UserX size={12} /> Remove Role
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
                <Pager page={pg('users')} setPage={spg('users')} total={usersData?.meta?.total} />
              </div>
            </div>
          )}

          {/* ════ COURSES ══════════════════════════════════════════ */}
          {tab === 'courses' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[['', 'All'], ['published', 'Published'], ['in_review', 'In Review'], ['draft', 'Draft'], ['unpublished', 'Unpublished']].map(([val, label]) => (
                  <button key={val} onClick={() => { setCourseStatus(val); spg('courses')(1); }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all
                      ${courseStatus === val ? 'bg-stadi-green text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-stadi-green'}`}>
                    {label}
                    {val === 'in_review' && pendingReviews > 0 && <span className="ml-1.5 bg-stadi-orange text-white text-[9px] rounded-full px-1.5 py-0.5">{pendingReviews}</span>}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table cols={['Title', 'Instructor', 'Category', 'Price', 'Enrolled', 'Rating', 'Status', 'Actions']} loading={coursesLoading}>
                  {courses.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-medium text-gray-900 text-sm truncate">{c.title}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.users?.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.categories?.name}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-sm">KES {c.price_kes?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.enrolment_count?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-yellow-500 font-semibold text-sm">★ {parseFloat(c.avg_rating || 0).toFixed(1)}</td>
                      <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {c.status === 'in_review' && (
                            <>
                              <Button size="sm" variant="primary" loading={publishCourse.isPending} onClick={() => publishCourse.mutate(c.id)}>Publish</Button>
                              <Button size="sm" variant="danger"  onClick={() => rejectCourse.mutate(c.id)}>Reject</Button>
                            </>
                          )}
                          {c.status === 'published' && (
                            <button onClick={() => adminAPI.updateCourse(c.id, { status: 'unpublished' }).then(() => qc.invalidateQueries(['admin']))}
                              className="text-xs text-gray-500 hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                              Unpublish
                            </button>
                          )}
                          {c.status === 'unpublished' && (
                            <button onClick={() => adminAPI.updateCourse(c.id, { status: 'published' }).then(() => qc.invalidateQueries(['admin']))}
                              className="text-xs text-stadi-green px-2.5 py-1.5 rounded-lg hover:bg-stadi-green-light transition-colors font-medium">
                              Re-publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
                <Pager page={pg('courses')} setPage={spg('courses')} total={coursesData?.meta?.total} />
              </div>
            </div>
          )}

          {/* ════ PAYMENTS ════════════════════════════════════════ */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[['', 'All'], ['completed', 'Paid'], ['pending', 'Pending'], ['failed', 'Failed'], ['refunded', 'Refunded']].map(([val, label]) => (
                  <button key={val} onClick={() => { setPayStatus(val); spg('payments')(1); }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all
                      ${payStatus === val ? 'bg-stadi-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-stadi-green'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table cols={['Date', 'Learner', 'Course', 'Amount', 'M-Pesa Ref', 'Status', 'Action']} loading={paymentsLoading}>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{p.users?.name || '—'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{p.users?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{p.courses?.title}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">KES {p.amount_kes?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.mpesa_transaction_id || '—'}</td>
                      <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                      <td className="px-4 py-3">
                        {p.status === 'completed' && (
                          <button onClick={() => setConfirmModal({ type: 'refund', id: p.id, title: `Refund KES ${p.amount_kes?.toLocaleString()} to ${p.users?.name}?` })}
                            className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                            Issue Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
                <Pager page={pg('payments')} setPage={spg('payments')} total={paymentsData?.meta?.total} />
              </div>
            </div>
          )}

          {/* ════ CERTIFICATES ════════════════════════════════════ */}
          {tab === 'certificates' && (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={certSearch} onChange={e => { setCertSearch(e.target.value); spg('certs')(1); }}
                  placeholder="Search by certificate number..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table cols={['Cert #', 'Learner', 'Course', 'Category', 'Issued', 'Status', 'Actions']} loading={certsLoading}>
                  {certs.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-semibold">{c.certificate_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{c.users?.name}</div>
                        <div className="text-[10px] text-gray-400">{c.users?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{c.courses?.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.courses?.categories?.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(c.issued_at).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3"><StatusPill status={c.is_valid} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.pdf_url && (
                            <a href={c.pdf_url} target="_blank" rel="noreferrer"
                              className="text-xs text-stadi-green hover:underline flex items-center gap-1">
                              <Download size={11} /> PDF
                            </a>
                          )}
                          {c.is_valid
                            ? <button onClick={() => setConfirmModal({ type: 'revoke', id: c.id, title: `Revoke certificate ${c.certificate_number}?` })}
                                className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-medium">Revoke</button>
                            : <button onClick={() => reinstateCert.mutate(c.id)}
                                className="text-xs text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors font-medium">Reinstate</button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
                <Pager page={pg('certs')} setPage={spg('certs')} total={certsData?.meta?.total} />
              </div>
            </div>
          )}

          {/* ════ PAYOUTS ══════════════════════════════════════════ */}
          {tab === 'payouts' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Instructor Payout Requests</h3>
                <p className="text-xs text-gray-500 mt-0.5">Approve and trigger M-Pesa B2C transfers</p>
              </div>
              <Table cols={['Instructor', 'Phone', 'Amount', 'Status', 'Requested', 'Actions']}>
                {payouts.length === 0 ? [] : payouts.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.users?.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.mpesa_phone || p.users?.phone}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">KES {p.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(p.requested_at).toLocaleDateString('en-KE')}</td>
                    <td className="px-4 py-3">
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" loading={approvePayout.isPending} onClick={() => approvePayout.mutate(p.id)}>Approve & Pay M-Pesa</Button>
                          <Button size="sm" variant="ghost"   onClick={() => rejectPayout.mutate(p.id)}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
              {payouts.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400" />
                  No pending payouts
                </div>
              )}
            </div>
          )}

          {/* ════ SUPPORT ══════════════════════════════════════════ */}
          {tab === 'support' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved'], ['', 'All']].map(([val, label]) => (
                  <button key={val} onClick={() => { setSupportStatus(val); spg('support')(1); }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all
                      ${supportStatus === val ? 'bg-stadi-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-stadi-green'}`}>
                    {label}
                    {val === 'open' && openTickets > 0 && <span className="ml-1.5 bg-red-500 text-white text-[9px] rounded-full px-1.5">{openTickets}</span>}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table cols={['Ticket', 'User', 'Issue', 'Channel', 'Created', 'Status', 'Action']} loading={supportLoading}>
                  {tickets.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{t.id?.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{t.users?.name || '—'}</div>
                        <div className="text-[10px] text-gray-400">{t.users?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">
                        <div className="font-medium capitalize mb-0.5">{t.issue_type?.replace('_', ' ')}</div>
                        <div className="truncate text-gray-400">{t.description?.slice(0, 60)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.channel === 'whatsapp' ? 'green' : 'gray'} className="capitalize">
                          {t.channel || 'web'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                      <td className="px-4 py-3">
                        {t.status !== 'resolved' && (
                          <button onClick={() => closeTicket.mutate(t.id)}
                            className="text-xs text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
                <Pager page={pg('support')} setPage={spg('support')} total={supportData?.meta?.total} />
              </div>
            </div>
          )}

          {/* ════ AUDIT LOG ════════════════════════════════════════ */}
          {tab === 'audit' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Admin Audit Log</h3>
                <p className="text-xs text-gray-500 mt-0.5">All administrative actions recorded with timestamps</p>
              </div>
              <Table cols={['Time', 'Admin', 'Action', 'Entity', 'IP Address']}>
                {auditLog.length === 0 ? [] : auditLog.map(log => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-KE')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.users?.name || 'System'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{log.entity_type || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </Table>
              {auditLog.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No audit entries yet</div>}
            </div>
          )}
        </div>
      </main>

      {/* ── Add Instructor Modal ──────────────────────────────────── */}
      <Modal isOpen={addInstructorOpen} onClose={() => { setAddInstructorOpen(false); setNewInstructor({ phone: '', name: '' }); }} title="Add Instructor" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Enter the phone number of an existing Stadi user to make them an instructor,
            or provide a new phone number to create their account.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Phone Number *</label>
            <input
              value={newInstructor.phone}
              onChange={e => setNewInstructor(v => ({ ...v, phone: e.target.value }))}
              placeholder="e.g. 0712 345 678"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">Kenyan number — will be formatted to +254XXXXXXXXX</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Full Name</label>
            <input
              value={newInstructor.name}
              onChange={e => setNewInstructor(v => ({ ...v, name: e.target.value }))}
              placeholder="e.g. Achieng Otieno"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green"
            />
            <p className="text-xs text-gray-400 mt-1">Optional — updates the user's display name</p>
          </div>
          <div className="bg-stadi-green-light rounded-xl p-3 space-y-1">
            <p className="text-xs text-stadi-green font-semibold">What happens when you add an instructor:</p>
            <p className="text-xs text-gray-600">• Their account role changes to <strong>instructor</strong></p>
            <p className="text-xs text-gray-600">• They can log into stadi.ke and access the Instructor Portal at <strong>/instructor</strong></p>
            <p className="text-xs text-gray-600">• They can create, submit, and earn from courses</p>
            <p className="text-xs text-gray-600">• They <strong>cannot</strong> access the Admin dashboard</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="primary" className="flex-1" loading={addingInstructor}
              disabled={!newInstructor.phone.trim()}
              onClick={handleAddInstructor}>
              <UserCheck size={14} /> Make Instructor
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setAddInstructorOpen(false); setNewInstructor({ phone: '', name: '' }); }}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm modal ─────────────────────────────────────────── */}
      <Modal isOpen={!!confirmModal} onClose={() => { setConfirmModal(null); setConfirmReason(''); }} title="Confirm Action" size="sm">
        <div className="p-6">
          <p className="text-gray-600 text-sm mb-4">{confirmModal?.title}</p>
          <Input label="Reason (required)" placeholder="Enter reason for this action..."
            value={confirmReason} onChange={e => setConfirmReason(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && confirmReason.trim()) {
              if (confirmModal?.type === 'refund') refundPay.mutate({ id: confirmModal.id, reason: confirmReason });
              if (confirmModal?.type === 'revoke') revokeCert.mutate({ id: confirmModal.id, reason: confirmReason });
            }}}
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <Button variant="danger" className="flex-1"
              loading={refundPay.isPending || revokeCert.isPending}
              disabled={!confirmReason.trim()}
              onClick={() => {
                if (confirmModal?.type === 'refund') refundPay.mutate({ id: confirmModal.id, reason: confirmReason });
                if (confirmModal?.type === 'revoke') revokeCert.mutate({ id: confirmModal.id, reason: confirmReason });
              }}>
              Confirm
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setConfirmModal(null); setConfirmReason(''); }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
