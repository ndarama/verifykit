import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem('vk_token', data.token);
      router.push('/dashboard');
    } else {
      const txt = await res.text();
      setErr(txt || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        {err && <div className="mb-3 text-red-600">{err}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-2 border rounded" />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-2 border rounded" />
          <button className="w-full p-2 bg-indigo-600 text-white rounded">Sign In</button>
        </form>
      </div>
    </div>
  );
}
