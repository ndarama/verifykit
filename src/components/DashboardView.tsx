/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageId, VerificationRecord } from '../types';
import { verificationService } from '../classes';
import { 
  Shield, CheckCircle, AlertOctagon, FileText, ArrowUpRight, 
  Search, SlidersHorizontal, Trash2, HelpCircle, UserPlus, 
  Download, Filter 
} from 'lucide-react';

interface DashboardViewProps {
  setCurrentPage: (page: PageId) => void;
  setSelectedRecord: (record: VerificationRecord | null) => void;
}

export default function DashboardView({ setCurrentPage, setSelectedRecord }: DashboardViewProps) {
  const activeUser = verificationService.getActiveUser();
  const records = verificationService.getRecords();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Verified' | 'Rejected'>('all');

  // Guard against unauthenticated access
  if (!activeUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4 font-sans text-slate-800">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold">Unauthorized Session</h3>
        <p className="text-slate-500 text-sm">Please log in to access your company dashboard.</p>
        <button
          onClick={() => setCurrentPage('login')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Calculate Metrics
  const totalRequests = records.length;
  const verifiedCount = records.filter(r => r.status === 'Verified').length;
  const rejectedCount = records.filter(r => r.status === 'Rejected').length;

  const filteredRecords = records.filter(rec => {
    // Search keyword
    const names = rec.extractedData?.names || '';
    const idNo = rec.extractedData?.idNo || '';
    const matchesSearch = 
      names.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStartVerification = () => {
    setCurrentPage('verify');
  };

  const handleViewRecord = (rec: VerificationRecord) => {
    setSelectedRecord(rec);
    setCurrentPage('result');
  };

  return (
    <div className="space-y-8 py-8 animate-fade-in font-sans">
      {/* Welcome Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-600 uppercase tracking-wider">
            <span>Corporate Command Hub</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            Welcome back, {activeUser.repName}
          </h2>
          <div className="text-xs text-slate-500">
            Registered Hub: <span className="font-bold text-slate-700">{activeUser.company.name}</span> &nbsp;|&nbsp; Authorization: <span className="font-mono text-slate-700">{activeUser.repPosition}</span>
          </div>
        </div>

        <button
          onClick={handleStartVerification}
          className="flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>New ID Verification Request</span>
        </button>
      </div>

      {/* Metrics Block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Metric */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-indigo-600" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Requests Audited</span>
            <FileText className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">{totalRequests}</span>
            <span className="text-xs text-slate-500">records</span>
          </div>
        </div>

        {/* Verified Metric */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Accounts</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 text-emerald-600">{verifiedCount}</span>
            <span className="text-xs text-slate-500">subjects matched</span>
          </div>
        </div>

        {/* Rejected Metric */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-rose-500" />
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected Requests</span>
            <AlertOctagon className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 text-rose-600">{rejectedCount}</span>
            <span className="text-xs text-slate-500">mismatches found</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table Block */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-150 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">ID Verification Registry</h3>
            <p className="text-xs text-slate-505">Search and inspect extracted details of past compliance matches</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex items-center bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 h-9">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none w-36 sm:w-48"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 h-9">
              {(['all', 'Verified', 'Rejected'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setStatusFilter(type)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                    statusFilter === type
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-150'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2.5">
            <div className="inline-flex p-3 bg-slate-50 rounded-full border">
              <Filter className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold">No audits match your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms or verify another user identity card.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-450 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-5">ID Code</th>
                    <th className="py-3 px-5">Scanned ID Holder Name</th>
                    <th className="py-3 px-5">Origin Jurisdiction</th>
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5">Extracted Document</th>
                    <th className="py-3 px-5">Compliance Status</th>
                    <th className="py-3 px-5 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-400">
                        {record.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          {record.extractedData ? record.extractedData.names : 'Corrupted Scanned card'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {record.extractedData ? `NID: ${record.extractedData.idNo}` : 'Unreadable OCR'}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium text-xs">
                        {record.extractedData ? record.extractedData.country : 'Unknown Country'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {record.timestamp}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-700">
                        <div>{record.extractedData ? record.extractedData.document : 'Failed OCR Extraction'}</div>
                        <span className="text-[10px] font-mono text-slate-400">{record.fileName}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${
                            record.status === 'Verified'
                              ? 'bg-teal-50 border-teal-250 text-teal-800'
                              : 'bg-rose-50 border-rose-250 text-rose-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            record.status === 'Verified' ? 'bg-teal-500' : 'bg-rose-500'
                          }`} />
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-medium">
                        <button
                          onClick={() => handleViewRecord(record)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50/55 hover:bg-indigo-100/55 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <span>Details</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List View */}
            <div className="md:hidden divide-y divide-slate-150" id="mobile-registry-list">
              {filteredRecords.map((record) => (
                <div key={record.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block">#{record.id}</span>
                      <div className="font-extrabold text-slate-900 leading-tight">
                        {record.extractedData ? record.extractedData.names : 'Corrupted Scanned card'}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {record.extractedData ? `NID: ${record.extractedData.idNo}` : 'Unreadable OCR'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                        record.status === 'Verified'
                          ? 'bg-teal-50 border-teal-200 text-teal-800'
                          : 'bg-rose-50 border-rose-250 text-rose-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 block uppercase">Origin</span>
                      <span className="font-semibold text-slate-800">{record.extractedData ? record.extractedData.country : 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 block uppercase">Timestamp</span>
                      <span className="text-slate-500 font-medium">{record.timestamp}</span>
                    </div>
                    <div className="col-span-2 border-t pt-1.5 mt-1 border-slate-150">
                      <span className="text-[8px] font-black text-slate-400 block uppercase">Document</span>
                      <span className="font-medium text-slate-800">{record.extractedData ? record.extractedData.document : 'Failed OCR'}</span>
                      <span className="block text-[9px] font-mono text-slate-400 truncate">{record.fileName}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleViewRecord(record)}
                      className="w-full text-center inline-flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-850 bg-indigo-50/50 hover:bg-indigo-100/50 py-2 rounded-xl border border-indigo-200 transition font-bold cursor-pointer"
                    >
                      <span>Inspect Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
