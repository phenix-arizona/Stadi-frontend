import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../lib/api';
import { Skeleton, Button, Badge } from '../components/ui';
import useAppStore from '../store/app.store';

export default function AdminPage() {
  const { addToast } = useAppStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: statsData } = useQuery({ queryKey: ['admin','stats'],    queryFn: adminAPI.stats });
  const { data: usersData } = useQuery({ queryKey: ['admin','users'],    queryFn: () => adminAPI.users({}) });
  const { data: coursesData}= useQuery({ queryKey: ['admin','courses'],  queryFn: () => adminAPI.courses({ status: 'in_review' }) });
  const { data: payoutsData}= useQuery({ queryKey: ['admin','payouts'],  queryFn: () => adminAPI.payouts({ status: 'pending' }) });

  const stats   = statsData?.data || {};
  const users   = usersData?.data || [];
  const courses = coursesData?.data || [];
  const payouts = payoutsData?.data || [];

  const approveCourse = useMutation({
    mutationFn: (id) => adminAPI.updateCourse(id, { status: 'published' }),
    onSuccess:  () => { qc.invalidateQueries(['admin','courses']); addToast('Course published!', 'success'); },
  });

  const approvePayout = useMutation({
    mutationFn: (id) => adminAPI.approvePayout(id),
    onSuccess:  () => { qc.invalidateQueries(['admin','payouts']); addToast('Payout approved!', 'success'); },
  });

  const TABS = ['overview','users','courses','payouts','audit'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stadi-dark mb-6" style={{ fontFamily: 'Playfair Display' }}>
        🛡️ Admin Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors
              ${activeTab === t ? 'border-stadi-green text-stadi-green' : 'border-transparent text-stadi-gray hover:text-stadi-green'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users',      value: stats.totalUsers,       icon: '👥' },
              { label: 'Total Enrolled',   value: stats.totalEnrollments, icon: '📚' },
              { label: 'Certificates',     value: stats.totalCertificates,icon: '🏆' },
              { label: 'Open Tickets',     value: stats.openTickets,      icon: '🎫' },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-stadi-green">{s.value ?? <Skeleton className="h-6 w-12 mx-auto" />}</div>
                <div className="text-xs text-stadi-gray">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Pending reviews */}
          {courses.length > 0 && (
            <div className="card p-5 mb-4">
              <h3 className="font-bold text-stadi-dark mb-3 flex items-center gap-2">
                📋 Courses Awaiting Review <Badge variant="orange">{courses.length}</Badge>
              </h3>
              <div className="space-y-2">
                {courses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-stadi-dark text-sm">{c.title}</div>
                      <div className="text-xs text-stadi-gray">By {c.users?.name} · KES {c.price_kes}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" loading={approveCourse.isPending} onClick={() => approveCourse.mutate(c.id)}>Publish</Button>
                      <Button size="sm" variant="danger" onClick={() => adminAPI.updateCourse(c.id, { status: 'draft' }).then(() => qc.invalidateQueries(['admin','courses']))}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {payouts.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-stadi-dark mb-3 flex items-center gap-2">
                💰 Pending Payouts <Badge variant="orange">{payouts.length}</Badge>
              </h3>
              <div className="space-y-2">
                {payouts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-stadi-dark text-sm">{p.users?.name}</div>
                      <div className="text-xs text-stadi-gray">KES {p.amount?.toLocaleString()} · {p.mpesa_phone}</div>
                    </div>
                    <Button size="sm" variant="primary" loading={approvePayout.isPending} onClick={() => approvePayout.mutate(p.id)}>
                      Approve & Pay
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {['Name','Phone','Role','County','Active','Joined'].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stadi-gray uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-stadi-dark">{u.name || '–'}</td>
                  <td className="px-4 py-3 text-stadi-gray">{u.phone}</td>
                  <td className="px-4 py-3"><Badge variant={u.role==='super_admin'?'orange':'green'}>{u.role}</Badge></td>
                  <td className="px-4 py-3 text-stadi-gray">{u.county||'–'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold ${u.is_active?'text-stadi-green':'text-red-500'}`}>{u.is_active?'Active':'Suspended'}</span></td>
                  <td className="px-4 py-3 text-stadi-gray text-xs">{new Date(u.created_at).toLocaleDateString('en-KE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
