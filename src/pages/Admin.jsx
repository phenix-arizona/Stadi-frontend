import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, BookOpen, CreditCard, Award, TrendingUp, AlertCircle, RefreshCw, Search, Shield } from 'lucide-react';
import { adminAPI } from '../lib/api';
import { Skeleton, Badge, Button, Input, Modal } from '../components/ui';
import useAppStore from '../store/app.store';
import api from '../lib/api';

function StatCard({ icon: Icon, label, value, color = 'green' }) {
  const colors = { green:'bg-stadi-green-light text-stadi-green', orange:'bg-stadi-orange-light text-stadi-orange', blue:'bg-blue-50 text-blue-600', red:'bg-red-50 text-red-500' };
  return (
    <div className="card p-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}><Icon size={20}/></div>
      <div className="text-2xl font-bold text-stadi-dark">{value ?? <Skeleton className="h-7 w-16"/>}</div>
      <div className="text-sm text-stadi-gray mt-0.5">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { published:{v:'green',l:'Published'}, in_review:{v:'orange',l:'In Review'}, draft:{v:'gray',l:'Draft'}, unpublished:{v:'gray',l:'Unpublished'}, completed:{v:'green',l:'Paid'}, pending:{v:'orange',l:'Pending'}, failed:{v:'red',l:'Failed'}, refunded:{v:'blue',l:'Refunded'}, true:{v:'green',l:'Valid'}, false:{v:'red',l:'Revoked'} };
  const m = map[String(status)] || {v:'gray',l:String(status)};
  return <Badge variant={m.v}>{m.l}</Badge>;
}

const TABS = ['overview','users','courses','payments','certificates','payouts','audit'];

export default function AdminPage() {
  const qc = useQueryClient();
  const { addToast } = useAppStore();
  const [tab, setTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [courseStatus, setCourseStatus] = useState('in_review');
  const [payStatus, setPayStatus] = useState('');
  const [certSearch, setCertSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [pages, setPages] = useState({users:1,courses:1,payments:1,certs:1});
  const setPage = (k,v) => setPages(p=>({...p,[k]:v}));

  const { data: statsData } = useQuery({ queryKey:['admin','stats'], queryFn:adminAPI.stats, refetchInterval:60000 });
  const { data: usersData, isLoading: ul } = useQuery({ queryKey:['admin','users',userSearch,pages.users], queryFn:()=>adminAPI.users({search:userSearch,page:pages.users}), enabled:tab==='users' });
  const { data: coursesData, isLoading: cl } = useQuery({ queryKey:['admin','courses',courseStatus,pages.courses], queryFn:()=>adminAPI.courses({status:courseStatus,page:pages.courses}), enabled:tab==='courses'||tab==='overview' });
  const { data: paymentsData, isLoading: pl } = useQuery({ queryKey:['admin','payments',payStatus,pages.payments], queryFn:()=>adminAPI.payments({status:payStatus,page:pages.payments}), enabled:tab==='payments' });
  const { data: certsData, isLoading: certl } = useQuery({ queryKey:['admin','certs',certSearch,pages.certs], queryFn:()=>api.get(`/certificates/admin/all?page=${pages.certs}&search=${certSearch}`), enabled:tab==='certificates' });
  const { data: payoutsData } = useQuery({ queryKey:['admin','payouts'], queryFn:()=>adminAPI.payouts({status:'pending'}), enabled:tab==='payouts'||tab==='overview' });
  const { data: auditData } = useQuery({ queryKey:['admin','audit'], queryFn:adminAPI.auditLog, enabled:tab==='audit' });

  const stats=statsData?.data||{}; const users=usersData?.data||[]; const courses=coursesData?.data||[];
  const payments=paymentsData?.data||[]; const certs=certsData?.data||[]; const payouts=payoutsData?.data||[]; const auditLog=auditData?.data||[];

  const publishCourse = useMutation({ mutationFn:(id)=>adminAPI.updateCourse(id,{status:'published'}), onSuccess:()=>{qc.invalidateQueries(['admin']);addToast('Course published!','success');} });
  const rejectCourse  = useMutation({ mutationFn:(id)=>adminAPI.updateCourse(id,{status:'draft'}),      onSuccess:()=>{qc.invalidateQueries(['admin']);addToast('Course rejected.','info');} });
  const suspendUser   = useMutation({ mutationFn:({id,active})=>adminAPI.updateUser(id,{is_active:active}), onSuccess:()=>{qc.invalidateQueries(['admin','users']);addToast('User updated.','success');} });
  const refundPay     = useMutation({ mutationFn:({id,reason})=>adminAPI.refund(id,reason), onSuccess:()=>{qc.invalidateQueries(['admin']);addToast('Refund processed.','success');setConfirmModal(null);} });
  const approvePayout = useMutation({ mutationFn:(id)=>adminAPI.approvePayout(id), onSuccess:()=>{qc.invalidateQueries(['admin','payouts']);addToast('Payout approved!','success');} });
  const revokeCert    = useMutation({ mutationFn:({id,reason})=>api.patch(`/certificates/${id}/revoke`,{reason}), onSuccess:()=>{qc.invalidateQueries(['admin','certs']);addToast('Certificate revoked.','info');setConfirmModal(null);} });
  const reinstateCert = useMutation({ mutationFn:(id)=>api.patch(`/certificates/${id}/reinstate`,{}), onSuccess:()=>{qc.invalidateQueries(['admin','certs']);addToast('Certificate reinstated.','success');} });

  const TH = ({cols}) => <thead><tr className="bg-gray-50 border-b border-gray-100">{cols.map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stadi-gray uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>;
  const LoadRow = ({cols}) => Array.from({length:4}).map((_,i)=><tr key={i}><td colSpan={cols} className="px-4 py-3"><Skeleton className="h-5 w-full"/></td></tr>);
  const Pager = ({k,data,size=25}) => (
    <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
      <span className="text-xs text-stadi-gray">{data?.meta?.total||0} total</span>
      <div className="flex gap-2">
        <button onClick={()=>setPage(k,p=>Math.max(1,p-1))} disabled={pages[k]===1} className="text-xs px-3 py-1.5 border rounded-lg disabled:opacity-40">← Prev</button>
        <span className="text-xs px-3 py-1.5">Page {pages[k]}</span>
        <button onClick={()=>setPage(k,p=>p+1)} disabled={(data?.data||[]).length<size} className="text-xs px-3 py-1.5 border rounded-lg disabled:opacity-40">Next →</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-stadi-dark">🛡️ Admin Dashboard</h1><p className="text-stadi-gray text-sm mt-0.5">Stadi Learning Platform · Control Centre</p></div>
          <Button size="sm" variant="outline" onClick={()=>qc.invalidateQueries(['admin'])}><RefreshCw size={14}/> Refresh</Button>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px capitalize transition-all
                ${tab===t?'border-stadi-green text-stadi-green':'border-transparent text-stadi-gray hover:text-stadi-green'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <StatCard icon={Users}        label="Total Users"       value={stats.totalUsers?.toLocaleString()}        color="green"/>
              <StatCard icon={BookOpen}     label="Enrollments"       value={stats.totalEnrollments?.toLocaleString()}  color="blue"/>
              <StatCard icon={Award}        label="Certificates"      value={stats.totalCertificates?.toLocaleString()} color="orange"/>
              <StatCard icon={AlertCircle}  label="Open Tickets"      value={stats.openTickets}                         color="red"/>
              <StatCard icon={CreditCard}   label="Revenue (14d)"     value={stats.revenue14d?`KES ${(stats.revenue14d/1000).toFixed(0)}K`:'—'} color="green"/>
              <StatCard icon={TrendingUp}   label="In Review"         value={courses.filter(c=>c.status==='in_review').length} color="orange"/>
            </div>
            {courses.filter(c=>c.status==='in_review').length>0&&(
              <div className="card p-5 mb-4">
                <h3 className="font-bold text-stadi-dark mb-3 flex items-center gap-2">📋 Courses Awaiting Review <Badge variant="orange">{courses.filter(c=>c.status==='in_review').length}</Badge></h3>
                <div className="space-y-2">{courses.filter(c=>c.status==='in_review').map(c=>(
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div><div className="font-medium text-stadi-dark text-sm">{c.title}</div><div className="text-xs text-stadi-gray">by {c.users?.name} · KES {c.price_kes}</div></div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" loading={publishCourse.isPending} onClick={()=>publishCourse.mutate(c.id)}>Publish</Button>
                      <Button size="sm" variant="danger" onClick={()=>rejectCourse.mutate(c.id)}>Reject</Button>
                    </div>
                  </div>
                ))}</div>
              </div>
            )}
            {payouts.length>0&&(
              <div className="card p-5">
                <h3 className="font-bold text-stadi-dark mb-3 flex items-center gap-2">💰 Pending Payouts <Badge variant="orange">{payouts.length}</Badge></h3>
                <div className="space-y-2">{payouts.map(p=>(
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div><div className="font-medium text-stadi-dark text-sm">{p.users?.name}</div><div className="text-xs text-stadi-gray">KES {p.amount?.toLocaleString()} → {p.mpesa_phone}</div></div>
                    <Button size="sm" variant="primary" loading={approvePayout.isPending} onClick={()=>approvePayout.mutate(p.id)}>Approve & Pay</Button>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {tab==='users'&&(
          <div>
            <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={userSearch} onChange={e=>{setUserSearch(e.target.value);setPage('users',1);}} placeholder="Search by name or phone..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green"/>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <TH cols={['Name','Phone','Role','County','Language','Status','Joined','Action']}/>
                  <tbody>
                    {ul?<LoadRow cols={8}/>:users.map(u=>(
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-stadi-dark">{u.name||'—'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stadi-gray">{u.phone}</td>
                        <td className="px-4 py-3"><Badge variant={u.role.includes('admin')?'orange':'green'}>{u.role}</Badge></td>
                        <td className="px-4 py-3 text-xs text-stadi-gray">{u.county||'—'}</td>
                        <td className="px-4 py-3 text-xs capitalize text-stadi-gray">{u.language||'—'}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-semibold ${u.is_active?'text-stadi-green':'text-red-500'}`}>{u.is_active?'Active':'Suspended'}</span></td>
                        <td className="px-4 py-3 text-xs text-stadi-gray">{new Date(u.created_at).toLocaleDateString('en-KE')}</td>
                        <td className="px-4 py-3">{!u.role.includes('admin')&&<button onClick={()=>suspendUser.mutate({id:u.id,active:!u.is_active})} className={`text-xs font-medium ${u.is_active?'text-red-500':'text-stadi-green'} hover:underline`}>{u.is_active?'Suspend':'Restore'}</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager k="users" data={usersData}/>
            </div>
          </div>
        )}

        {/* COURSES */}
        {tab==='courses'&&(
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all','published','in_review','draft','unpublished'].map(s=>(
                <button key={s} onClick={()=>{setCourseStatus(s==='all'?'':s);setPage('courses',1);}}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-all ${courseStatus===(s==='all'?'':s)?'bg-stadi-green text-white':'bg-gray-100 text-stadi-gray hover:bg-stadi-green-light'}`}>{s}</button>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <TH cols={['Title','Instructor','Price','Enrolled','Rating','Status','Actions']}/>
                  <tbody>
                    {cl?<LoadRow cols={7}/>:courses.map(c=>(
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-stadi-dark max-w-[200px] truncate text-sm">{c.title}</td>
                        <td className="px-4 py-3 text-xs text-stadi-gray">{c.users?.name}</td>
                        <td className="px-4 py-3 font-medium">KES {c.price_kes}</td>
                        <td className="px-4 py-3 text-stadi-gray">{c.enrolment_count}</td>
                        <td className="px-4 py-3 text-yellow-500 font-medium">★ {parseFloat(c.avg_rating||0).toFixed(1)}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status}/></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {c.status==='in_review'&&<><Button size="sm" variant="primary" loading={publishCourse.isPending} onClick={()=>publishCourse.mutate(c.id)}>Publish</Button><Button size="sm" variant="danger" onClick={()=>rejectCourse.mutate(c.id)}>Reject</Button></>}
                            {c.status==='published'&&<Button size="sm" variant="ghost" onClick={()=>adminAPI.updateCourse(c.id,{status:'unpublished'}).then(()=>qc.invalidateQueries(['admin','courses']))}>Unpublish</Button>}
                            {c.status==='unpublished'&&<Button size="sm" variant="outline" onClick={()=>adminAPI.updateCourse(c.id,{status:'published'}).then(()=>qc.invalidateQueries(['admin','courses']))}>Re-publish</Button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager k="courses" data={coursesData}/>
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab==='payments'&&(
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all','completed','pending','failed','refunded'].map(s=>(
                <button key={s} onClick={()=>{setPayStatus(s==='all'?'':s);setPage('payments',1);}}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-all ${payStatus===(s==='all'?'':s)?'bg-stadi-green text-white':'bg-gray-100 text-stadi-gray hover:bg-stadi-green-light'}`}>{s}</button>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <TH cols={['Date','Learner','Course','Amount','M-Pesa Ref','Status','Action']}/>
                  <tbody>
                    {pl?<LoadRow cols={7}/>:payments.map(p=>(
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-stadi-gray whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                        <td className="px-4 py-3"><div className="text-xs font-medium text-stadi-dark">{p.users?.name||'—'}</div><div className="text-[10px] text-gray-400">{p.users?.phone}</div></td>
                        <td className="px-4 py-3 text-xs text-stadi-gray max-w-[140px] truncate">{p.courses?.title}</td>
                        <td className="px-4 py-3 font-bold">KES {p.amount_kes?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stadi-gray">{p.mpesa_transaction_id||'—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                        <td className="px-4 py-3">{p.status==='completed'&&<button onClick={()=>setConfirmModal({type:'refund',id:p.id,title:`Refund KES ${p.amount_kes?.toLocaleString()} to ${p.users?.name}?`})} className="text-xs text-red-500 hover:underline font-medium">Refund</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager k="payments" data={paymentsData}/>
            </div>
          </div>
        )}

        {/* CERTIFICATES */}
        {tab==='certificates'&&(
          <div>
            <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={certSearch} onChange={e=>{setCertSearch(e.target.value);setPage('certs',1);}} placeholder="Search by certificate number..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stadi-green"/>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <TH cols={['Certificate #','Learner','Course','Issued','Status','Actions']}/>
                  <tbody>
                    {certl?<LoadRow cols={6}/>:certs.map(c=>(
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-stadi-dark">{c.certificate_number}</td>
                        <td className="px-4 py-3"><div className="text-xs font-medium">{c.users?.name}</div><div className="text-[10px] text-gray-400">{c.users?.phone}</div></td>
                        <td className="px-4 py-3 text-xs text-stadi-gray max-w-[160px] truncate">{c.courses?.title}</td>
                        <td className="px-4 py-3 text-xs text-stadi-gray whitespace-nowrap">{new Date(c.issued_at).toLocaleDateString('en-KE')}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.is_valid}/></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {c.pdf_url&&<a href={c.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-stadi-green hover:underline">PDF</a>}
                            {c.is_valid?<button onClick={()=>setConfirmModal({type:'revoke',id:c.id,title:`Revoke certificate ${c.certificate_number}?`})} className="text-xs text-red-500 hover:underline">Revoke</button>
                              :<button onClick={()=>reinstateCert.mutate(c.id)} className="text-xs text-stadi-green hover:underline">Reinstate</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager k="certs" data={certsData}/>
            </div>
          </div>
        )}

        {/* PAYOUTS */}
        {tab==='payouts'&&(
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <TH cols={['Instructor','Phone','Amount','Status','Requested','Action']}/>
                <tbody>
                  {payouts.length===0?<tr><td colSpan={6} className="text-center py-10 text-stadi-gray text-sm">No pending payouts</td></tr>
                  :payouts.map(p=>(
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.users?.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stadi-gray">{p.mpesa_phone||p.users?.phone}</td>
                      <td className="px-4 py-3 font-bold">KES {p.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                      <td className="px-4 py-3 text-xs text-stadi-gray">{new Date(p.requested_at).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">{p.status==='pending'&&<Button size="sm" variant="primary" loading={approvePayout.isPending} onClick={()=>approvePayout.mutate(p.id)}>Approve & Pay</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT */}
        {tab==='audit'&&(
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <TH cols={['Time','Admin','Action','Entity','IP']}/>
                <tbody>
                  {auditLog.length===0?<tr><td colSpan={5} className="text-center py-10 text-stadi-gray text-sm">No audit log entries yet</td></tr>
                  :auditLog.map(log=>(
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-stadi-gray whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-KE')}</td>
                      <td className="px-4 py-3 text-xs">{log.users?.name||'System'}</td>
                      <td className="px-4 py-3"><span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{log.action}</span></td>
                      <td className="px-4 py-3 text-xs text-stadi-gray capitalize">{log.entity_type||'—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stadi-gray">{log.ip_address||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmModal&&(
        <Modal isOpen size="sm" onClose={()=>setConfirmModal(null)} title="Confirm Action">
          <div className="p-6">
            <p className="text-stadi-gray mb-4">{confirmModal.title}</p>
            <Input label="Reason (required)" placeholder="Enter reason..." id="confirm-reason" autoFocus/>
            <div className="flex gap-3 mt-4">
              <Button variant="danger" className="flex-1"
                loading={confirmModal.type==='refund'?refundPay.isPending:revokeCert.isPending}
                onClick={()=>{
                  const reason=document.getElementById('confirm-reason')?.value;
                  if(!reason)return;
                  if(confirmModal.type==='refund') refundPay.mutate({id:confirmModal.id,reason});
                  else revokeCert.mutate({id:confirmModal.id,reason});
                }}>
                Confirm
              </Button>
              <Button variant="ghost" className="flex-1" onClick={()=>setConfirmModal(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
