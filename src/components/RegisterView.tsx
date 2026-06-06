/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageId, CompanyData } from '../types';
import { verificationService } from '../classes';
import { Shield, Sparkles, Building, User, Mail, Phone, Lock, Eye, AlertCircle, CheckCircle } from 'lucide-react';

interface RegisterViewProps {
  setCurrentPage: (page: PageId) => void;
}

export default function RegisterView({ setCurrentPage }: RegisterViewProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyContact: '',
    repName: '',
    repPosition: '',
    password: '',
    confirmPassword: '',
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

    // Initial password checks before calling class logic
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match. Please ensure consistency.");
      return;
    }

    try {
      const payload: CompanyData = {
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        companyContact: formData.companyContact,
        repName: formData.repName,
        repPosition: formData.repPosition,
        password: formData.password,
      };

      // Call the TS service. This will recursively validate fields too!
      verificationService.register(payload);
      
      setSuccessMsg("Registration successful! Initializing portal workspace...");
      setTimeout(() => {
        setCurrentPage('dashboard');
      }, 1200);

    } catch (err: any) {
      // Capture custom validation exceptions from our VerificationService recursive checker
      setErrorMsg(err.message || "An unexpected registration error occurred.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 animate-fade-in space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Enterprise Workspace</h2>
        <p className="text-sm text-slate-600">
          Set up a dedicated hub to audit, manage, and verify personnel ID credentials.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500" />
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <div>
              <span className="font-bold">Execution Failed</span>
              <p className="mt-0.5 text-rose-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-sm animate-pulse">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
            <div>
              <span className="font-bold">Success</span>
              <p className="mt-0.5 text-emerald-700">{successMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-500" />
              Company Details
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Company Legal Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g., Kigali Tech Hub Ltd"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Corporate Email</label>
                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                    placeholder="e.g., compliance@kigalitech.rw"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">System Contact Phone</label>
                  <input
                    type="text"
                    name="companyContact"
                    value={formData.companyContact}
                    onChange={handleInputChange}
                    placeholder="e.g., +250 788 123 456"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 pb-4 pt-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              Representative Admin
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="repName"
                  value={formData.repName}
                  onChange={handleInputChange}
                  placeholder="e.g., Sarah Jenkins"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Official Position</label>
                <input
                  type="text"
                  name="repPosition"
                  value={formData.repPosition}
                  onChange={handleInputChange}
                  placeholder="e.g., HR Director"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-500" />
              Access Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Secret Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Confirm Secret Match</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Company Account
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            onClick={() => setCurrentPage('login')}
            className="text-indigo-600 font-bold hover:underline focus:outline-none"
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}
