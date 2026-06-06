/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageId } from '../types';
import { verificationService } from '../classes';
import { Shield, Sparkles, LogIn, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface LoginViewProps {
  setCurrentPage: (page: PageId) => void;
}

export default function LoginView({ setCurrentPage }: LoginViewProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      verificationService.login(formData.email, formData.password);
      setSuccessMsg("Authorization passed. Directing to corporate dashboard...");
      setTimeout(() => {
        setCurrentPage('dashboard');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Credential authentication failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 md:py-20 animate-fade-in space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl mb-2 text-indigo-600 shadow-sm border border-indigo-100">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access Portal</h2>
        <p className="text-sm text-slate-600">
          Sign in to authorize and manage ID scan policies.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500" />

        {errorMsg && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px]">Permission Denied</span>
              <p className="mt-0.5 text-rose-700 font-sans">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs animate-pulse">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px]">Access Granted</span>
              <p className="mt-0.5 text-emerald-700 font-sans">{successMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Official Corporate Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., sarah@rwandatech.rw"
                className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Secure Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5">
            <span className="text-slate-500 font-medium">Test credentials: <code className="font-mono bg-slate-100 p-0.5 rounded text-slate-800 text-[10px]">sarah@rwandatech.rw / password123</code></span>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to VerifyKit</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          No registered hub?{' '}
          <button
            onClick={() => setCurrentPage('register')}
            className="text-indigo-600 font-bold hover:underline focus:outline-none cursor-pointer"
          >
            Create corporate account
          </button>
        </div>
      </div>
    </div>
  );
}
