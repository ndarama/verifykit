import { useState } from 'react';
import { useRouter } from 'next/router';

export default function VerifyPage() {
  const [fileName, setFileName] = useState('jean_claude_id.jpg');
  const [scenario, setScenario] = useState<'match'|'mismatch'|'invalid_id'>('match');
  const [result, setResult] = useState<any | null>(null);
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setResult(null);
    const token = localStorage.getItem('vk_token');
    const res = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ fileName, fileType: 'image/jpeg', scenario }) });
    if (res.ok) {
      const data = await res.json();
      setResult(data.record || data);
    } else {
      const txt = await res.text(); setErr(txt || 'Verification failed');
      if (res.status === 401) router.push('/login');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">New Identity Verification</h2>
        {err && <div className="mb-3 text-red-600">{err}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input value={fileName} onChange={e => setFileName(e.target.value)} className="w-full p-2 border rounded" />
          <select value={scenario} onChange={e => setScenario(e.target.value as any)} className="w-full p-2 border rounded">
            <option value="match">Match</option>
            <option value="mismatch">Mismatch</option>
            <option value="invalid_id">Invalid ID</option>
          </select>
          <button className="w-full p-2 bg-indigo-600 text-white rounded">Run Verification</button>
        </form>

        {result && (
          <div className="mt-4 p-3 bg-slate-50 border rounded">
            <div><strong>Result:</strong> {result.status}</div>
            <div className="text-sm text-slate-700">ID Name: {result.extractedData?.names}</div>
            <div className="text-xs text-slate-500">Similarity: {result.extractedData?.similarityScore}</div>
          </div>
        )}
      </div>
    </div>
  );
}
