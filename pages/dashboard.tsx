import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    setErr('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('vk_token') : null;
    const res = await fetch('/api/records', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    if (res.ok) {
      const data = await res.json();
      setRecords(data.records || []);
    } else {
      setErr('Failed to load records');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="space-x-2">
            <Link href="/verify">New Verify</Link>
            <button onClick={() => { localStorage.removeItem('vk_token'); window.location.href = '/'; }} className="px-3 py-1 border rounded">Logout</button>
          </div>
        </div>

        {err && <div className="text-red-600 mb-4">{err}</div>}

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Recent Records</h2>
          {records.length === 0 && <div className="text-slate-500">No records yet.</div>}
          <ul>
            {records.map(r => (
              <li key={r.id} className="border-b py-2">
                <div className="text-sm text-slate-600">{r.timestamp} — <strong>{r.status}</strong></div>
                <div className="text-xs text-slate-700">{r.fileName} — {r.reason || ''}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
