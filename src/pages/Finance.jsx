import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
  CreditCard, RefreshCw, Download, Filter, Search,
  CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight,
  BarChart3, PieChart, FileText, AlertCircle, Wallet
} from 'lucide-react';
import { financeAPI } from '../lib/api';
import { Skeleton, Badge, Button, Input, Modal } from '../components/ui';
import useAppStore from '../store/app.store';
import useAuthStore from '../store/auth.store';

// ── Helpers ───────────────────────────────────────────────────
const fmtKes = (n) => `KES ${(n || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function KPICard({ icon: Icon, label, value, sub, color = 'green', loading }) {
  const colors = {
    green:  'bg-stadi-green text-white',
    orange: 'bg-stadi-orange text-white',
    blue:   'bg-blue-600 text-white',
    red:    'bg-red-500 text-white',
    purple: 'bg-purple-600 text-white',
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className={`w-11 h-11 ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      {loading ? <Skeleton className="h-8 w-24 mb-1" /> : (
        <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      )}
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const m = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    failed:    'bg-red-50 text-red-600 border-red-200',
    refunded:  'bg-blue-50 text-blue-600 border-blue-200',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected:  'bg-red-50 text-red-600 border-red-200',
  };
  const l = { completed:'Paid ✓', pending:'Pending', failed:'Failed', refunded:'Refunded', approved:'Approved ✓', rejected:'Rejected' };
  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${m[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{l[status] || status}</span>;
}

const TABS = [
  { id: 'overview',     icon: BarChart3,   label: 'Overview' },
  { id: 'transactions', icon: CreditCard,  label: 'Transactions' },
  { id: 'payouts',      icon: Wallet,      label: 'Instructor Payouts' },
  { id: 'courses',      icon: PieChart,    label: 'Revenue by Course' },
  { id: 'records',      icon: FileText,    label: 'Finance Records' },
];

export default function FinancePage() {
  const qc = useQueryClient();
  const { addToast } = useAppStore();
  const { user } = useAuthStore();

  const [tab,        setTab]        = useState('overview');
  const [period,     setPeriod]     = useState('');
  const [txStatus,   setTxStatus]   = useState('');
  const [txPage,     setTxPage]     = useState(1);
  const [txSearch,   setTxSearch]   = useState('');
  const [rejectModal,setRejectModal]= useState(null);
  const [rejectReason,setRejectReason] = useState('');
  const [addRecModal,setAddRecModal]= useState(false);
  const [recForm, setRecForm] = useState({ type:'income', category:'course_revenue', description:'', amountKes:'', reference:'', periodMonth: new Date().toISOString().slice(0,7) });

  const { data: summaryData, isLoading: sumLoading } = useQuery({
    queryKey: ['finance','summary', period],
    queryFn:  () => financeAPI.summary(period),
    refetchInterval: 60000,
  });
  const { data: monthlyData } = useQuery({
    queryKey: ['finance','monthly'],
    queryFn:  financeAPI.revenueByMonth,
    enabled:  tab === 'overview',
  });
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['finance','tx', txStatus, txPage],
    queryFn:  () => financeAPI.transactions({ status: txStatus || undefined, page: txPage }),
    enabled:  tab === 'transactions',
    keepPreviousData: true,
  });
  const { data: payoutsData, isLoading: payLoading } = useQuery({
    queryKey: ['finance','payouts'],
    queryFn:  () => financeAPI.payouts({}),
    enabled:  tab === 'payouts',
  });
  const { data: courseRevData, isLoading: crLoading } = useQuery({
    queryKey: ['finance','courses'],
    queryFn:  financeAPI.revenueByCourse,
    enabled:  tab === 'courses',
  });
  const { data: recordsData } = useQuery({
    queryKey: ['finance','records', period],
    queryFn:  () => financeAPI.records({ month: period || undefined }),
    enabled:  tab === 'records',
  });

  const s   = summaryData?.data || {};
  const tx  = txData?.data  || [];
  const pay = payoutsData?.data || [];
  const cr  = courseRevData?.data || [];
  const rec = recordsData?.data || [];
  const monthly = monthlyData?.data || [];

  const approvePayout = useMutation({
    mutationFn: (id) => financeAPI.approvePayout(id),
    onSuccess:  () => { qc.invalidateQueries(['finance']); addToast('Payout approved ✓', 'success'); },
  });
  const rejectPayout = useMutation({
    mutationFn: ({ id, reason }) => financeAPI.rejectPayout(id, reason),
    onSuccess:  () => { qc.invalidateQueries(['finance']); addToast('Payout rejected.', 'info'); setRejectModal(null); setRejectReason(''); },
  });
  const addRecord = useMutation({
    mutationFn: (data) => financeAPI.addRecord(data),
    onSuccess:  () => { qc.invalidateQueries(['finance','records']); addToast('Record added ✓', 'success'); setAddRecModal(false); setRecForm({ type:'income', category:'course_revenue', description:'', amountKes:'', reference:'', periodMonth: new Date().toISOString().slice(0,7) }); },
    onError:    (e) => addToast(e?.message || 'Failed', 'error'),
  });

  // Max revenue for bar chart
  const maxRev = Math.max(...monthly.map(m => m.revenue), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Finance Portal</h1>
              <p className="text-sm text-gray-500 mt-0.5">Revenue, payments & payouts — Stadi Platform</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={period} onChange={e => setPeriod(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stadi-green bg-white">
                <option value="">All time</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(); d.setMonth(d.getMonth() - i);
                  const v = d.toISOString().slice(0,7);
                  return <option key={v} value={v}>{d.toLocaleDateString('en-KE',{month:'long',year:'numeric'})}</option>;
                })}
              </select>
              <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries(['finance'])}>
                <RefreshCw size={14} /> Refresh
              </Button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                  ${tab === t.id ? 'border-stadi-green text-stadi-green' : 'border-transparent text-gray-500 hover:text-stadi-green'}`}>
                <t.icon size={15} />{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <KPICard icon={DollarSign}    label="Total Revenue"        value={fmtKes(s.totalRevenue)}      color="green"  loading={sumLoading} />
              <KPICard icon={TrendingUp}    label="Stadi Net (30%)"      value={fmtKes(s.stadiShare)}        color="blue"   loading={sumLoading} />
              <KPICard icon={Wallet}        label="Instructor Share (70%)" value={fmtKes(s.instructorShare)} color="purple" loading={sumLoading} />
              <KPICard icon={Clock}         label="Pending Payouts"       value={fmtKes(s.pendingPayouts)}    color="orange" loading={sumLoading} />
              <KPICard icon={CreditCard}    label="Total Enrolments"      value={s.totalEnrollments?.toLocaleString()} color="green" loading={sumLoading} />
            </div>

            {/* Revenue bar chart */}
            {monthly.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-5 text-sm">Monthly Revenue Trend</h3>
                <div className="flex items-end gap-3 h-40 overflow-x-auto pb-2">
                  {monthly.slice(-12).map((m) => (
                    <div key={m.month} className="flex flex-col items-center gap-1 min-w-[52px]">
                      <div className="text-[10px] text-stadi-green font-semibold">
                        {m.revenue >= 1000 ? `${Math.round(m.revenue/1000)}K` : m.revenue}
                      </div>
                      <div
                        className="w-10 bg-stadi-green rounded-t-lg transition-all hover:bg-stadi-green/80"
                        style={{ height: `${Math.max(4, Math.round((m.revenue / maxRev) * 120))}px` }}
                        title={`${m.month}: ${fmtKes(m.revenue)}`}
                      />
                      <div className="text-[10px] text-gray-400 whitespace-nowrap">{m.month.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue split */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Revenue Split</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Stadi Platform (30%)', value: s.stadiShare, pct: 30, color: 'bg-stadi-green' },
                    { label: 'Instructor Payouts (70%)', value: s.instructorShare, pct: 70, color: 'bg-stadi-orange' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-900">{fmtKes(item.value)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Key Ratios</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Avg revenue per enrolment', value: fmtKes(s.avgRevenuePerEnrolment) },
                    { label: 'Total users on platform', value: s.totalUsers?.toLocaleString() },
                    { label: 'Total enrolments', value: s.totalEnrollments?.toLocaleString() },
                    { label: 'Completed payouts', value: fmtKes(s.completedPayouts) },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                      <span className="text-sm text-gray-500">{r.label}</span>
                      <span className="font-semibold text-gray-900 text-sm">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TRANSACTIONS ─────────────────────────────────────── */}
        {tab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[['','All'], ['completed','Paid'], ['pending','Pending'], ['failed','Failed'], ['refunded','Refunded']].map(([v,l]) => (
                <button key={v} onClick={() => { setTxStatus(v); setTxPage(1); }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all
                    ${txStatus === v ? 'bg-stadi-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-stadi-green'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    {['Date','Learner','Course','Amount','M-Pesa Ref','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {txLoading ? Array.from({length:6}).map((_,i) => (
                      <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                    )) : tx.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-gray-400">No transactions found</td></tr>
                    ) : tx.map(t => (
                      <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(t.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{t.users?.name || '—'}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{t.users?.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{t.courses?.title}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{fmtKes(t.amount_kes)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.mpesa_transaction_id || '—'}</td>
                        <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <span className="text-xs text-gray-500">{txData?.meta?.total?.toLocaleString() || 0} total</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setTxPage(p => Math.max(1,p-1))} disabled={txPage===1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14}/></button>
                  <span className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg">Page {txPage}</span>
                  <button onClick={() => setTxPage(p => p+1)} disabled={tx.length < 25}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14}/></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PAYOUTS ───────────────────────────────────────────── */}
        {tab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Instructor Payout Requests</h3>
              <p className="text-xs text-gray-400 mt-0.5">Review and approve M-Pesa B2C transfers to instructors</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50">
                  {['Instructor','Phone','Amount','Status','Requested','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {payLoading ? Array.from({length:4}).map((_,i) => (
                    <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td></tr>
                  )) : pay.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                      <p className="text-gray-400 text-sm">No pending payouts</p>
                    </td></tr>
                  ) : pay.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.users?.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.mpesa_phone || p.users?.phone}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{fmtKes(p.amount)}</td>
                      <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(p.requested_at)}</td>
                      <td className="px-4 py-3">
                        {p.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="primary" loading={approvePayout.isPending} onClick={() => approvePayout.mutate(p.id)}>
                              Approve & Pay
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRejectModal(p.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REVENUE BY COURSE ─────────────────────────────────── */}
        {tab === 'courses' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Revenue by Course</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50">
                  {['Rank','Course','Category','Enrolments','Total Revenue','Stadi Net'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {crLoading ? Array.from({length:6}).map((_,i) => (
                    <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td></tr>
                  )) : cr.map((c,i) => (
                    <tr key={c.courseId} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i < 3 ? 'bg-stadi-green-light/20' : ''}`}>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${i===0?'text-stadi-orange':i===1?'text-gray-500':i===2?'text-amber-600':'text-gray-300'}`}>
                          #{i+1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate text-sm">{c.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.category}</td>
                      <td className="px-4 py-3 text-gray-700">{c.count.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{fmtKes(c.revenue)}</td>
                      <td className="px-4 py-3 font-semibold text-stadi-green">{fmtKes(Math.round(c.revenue * 0.30))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cr.length === 0 && !crLoading && <div className="text-center py-12 text-gray-400 text-sm">No revenue data yet</div>}
            </div>
          </div>
        )}

        {/* ── FINANCE RECORDS ───────────────────────────────────── */}
        {tab === 'records' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Finance Records</h3>
              <Button variant="primary" size="sm" onClick={() => setAddRecModal(true)}>+ Add Record</Button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    {['Date','Type','Category','Description','Amount','Reference','Recorded by'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {rec.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No records for this period</td></tr>
                    ) : rec.map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type==='income'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-600'}`}>
                            {r.type === 'income' ? '↑ Income' : '↓ Expense'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">{r.category?.replace('_',' ')}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{r.description}</td>
                        <td className={`px-4 py-3 font-bold text-sm ${r.type==='income'?'text-emerald-600':'text-red-500'}`}>
                          {r.type==='income'?'+':'-'} {fmtKes(r.amount_kes)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{r.reference || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{r.users?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Payout Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Payout" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Provide a reason for rejecting this payout request. The instructor will be notified.</p>
          <Input label="Reason *" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Insufficient account balance, pending review..." autoFocus />
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" loading={rejectPayout.isPending} disabled={!rejectReason.trim()}
              onClick={() => rejectPayout.mutate({ id: rejectModal, reason: rejectReason })}>
              Confirm Rejection
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Add Record Modal */}
      <Modal isOpen={addRecModal} onClose={() => setAddRecModal(false)} title="Add Finance Record" size="sm">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Type *</label>
              <select value={recForm.type} onChange={e => setRecForm(f => ({...f, type: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Category *</label>
              <select value={recForm.category} onChange={e => setRecForm(f => ({...f, category: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green">
                {['course_revenue','payout','hosting','marketing','salary','misc'].map(c => (
                  <option key={c} value={c}>{c.replace('_',' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Description *" value={recForm.description} onChange={e => setRecForm(f => ({...f, description: e.target.value}))} placeholder="Brief description..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (KES) *" type="number" value={recForm.amountKes} onChange={e => setRecForm(f => ({...f, amountKes: e.target.value}))} placeholder="0" />
            <Input label="Month *" type="month" value={recForm.periodMonth} onChange={e => setRecForm(f => ({...f, periodMonth: e.target.value}))} />
          </div>
          <Input label="Reference (optional)" value={recForm.reference} onChange={e => setRecForm(f => ({...f, reference: e.target.value}))} placeholder="Invoice / receipt number" />
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" loading={addRecord.isPending}
              disabled={!recForm.description || !recForm.amountKes}
              onClick={() => addRecord.mutate(recForm)}>
              Add Record
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setAddRecModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
