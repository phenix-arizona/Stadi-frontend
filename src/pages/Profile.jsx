// ── Profile.jsx ───────────────────────────────────────────────
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userAPI }     from '../lib/api';
import useAuthStore    from '../store/auth.store';
import useAppStore     from '../store/app.store';
import { Button, Input } from '../components/ui';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { addToast }      = useAppStore();
  const [form, setForm] = useState({
    name:    user?.name || '',
    email:   user?.email || '',
    county:  user?.county || '',
    language:user?.language || 'english',
    bio:     user?.bio || '',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => userAPI.updateProfile(form),
    onSuccess: (res) => {
      setUser({ ...user, ...form });
      addToast('Profile updated!', 'success');
    },
    onError: () => addToast('Update failed. Try again.', 'error'),
  });

  const LANGUAGES = ['english','swahili','dholuo','luhya','kikuyu','kalenjin','kamba','kisii'];
  const COUNTIES  = ['Nairobi','Mombasa','Kisumu','Nakuru','Kakamega','Siaya','Homa Bay','Migori','Kisii','Nyamira','Bungoma','Busia','Vihiga','Trans Nzoia','Uasin Gishu','Nandi','Kericho','Bomet','Nyeri','Muranga','Kiambu','Machakos','Makueni','Kitui','Meru','Embu','Tharaka Nithi','Isiolo','Marsabit','Mandera','Wajir','Garissa','Lamu','Kwale','Kilifi','Taita Taveta','Samburu','Turkana','West Pokot','Elgeyo Marakwet','Kajiado','Laikipia','Nyahururu','Nyandarua','Kirinyaga','Murang\'a'].sort();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stadi-dark mb-6" style={{ fontFamily: 'Playfair Display' }}>Profile Settings</h1>

      <div className="card p-6 space-y-5">
        <Input label="Full name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Your full name" />
        <Input label="Email (optional)" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="your@email.com" />

        <div>
          <label className="block text-sm font-medium text-stadi-dark mb-1.5">Preferred language</label>
          <select value={form.language} onChange={e => setForm(f=>({...f,language:e.target.value}))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stadi-green capitalize">
            {LANGUAGES.map(l => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stadi-dark mb-1.5">Your county</label>
          <select value={form.county} onChange={e => setForm(f=>({...f,county:e.target.value}))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stadi-green">
            <option value="">Select county</option>
            {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stadi-dark mb-1.5">Bio (optional)</label>
          <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))}
            rows={3} placeholder="Tell instructors a bit about yourself..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stadi-green resize-none" />
        </div>

        <div className="bg-stadi-green-light rounded-xl p-4">
          <p className="text-xs text-stadi-green font-medium">Phone: {user?.phone}</p>
          <p className="text-xs text-stadi-gray mt-1">Phone number is your login — it cannot be changed.</p>
        </div>

        <Button variant="primary" className="w-full" loading={isPending} onClick={() => mutate()}>
          Save Profile
        </Button>
      </div>
    </div>
  );
}
