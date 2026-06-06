import { useState } from 'react';
import { useRouter } from 'next/router';

export default function RegisterPage() {
  const [form, setForm] = useState({ companyName: '', companyEmail: '', companyContact: '', repName: '', repPosition: '', password: '' });
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem('vk_token', data.token);
      router.push('/dashboard');
    } else {
      const txt = await res.text();
      setErr(txt || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Register Company</h2>
        {err && <div className="mb-3 text-red-600">{err}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Company Name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Company Email" value={form.companyEmail} onChange={e => setForm({ ...form, companyEmail: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Company Contact" value={form.companyContact} onChange={e => setForm({ ...form, companyContact: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Representative Name" value={form.repName} onChange={e => setForm({ ...form, repName: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Representative Position" value={form.repPosition} onChange={e => setForm({ ...form, repPosition: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-2 border rounded" />
          <button className="w-full p-2 bg-indigo-600 text-white rounded">Create Account</button>
        </form>
      </div>
    </div>
  );
}
