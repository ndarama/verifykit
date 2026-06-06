import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-2xl w-full p-8">
        <h1 className="text-4xl font-bold mb-4">VerifyKit — Next.js + SQLite</h1>
        <p className="mb-6 text-slate-600">Minimal port to Next.js with SQLite backend. Use the links below to try the API.</p>

        <div className="space-x-4">
          <Link href="/register"><a className="px-4 py-2 bg-indigo-600 text-white rounded">Register</a></Link>
          <Link href="/login"><a className="px-4 py-2 bg-slate-700 text-white rounded">Login</a></Link>
          <Link href="/dashboard"><a className="px-4 py-2 border rounded">Dashboard</a></Link>
        </div>
      </div>
    </div>
  );
}
