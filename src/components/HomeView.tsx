/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageId } from '../types';
import { ShieldCheck, ArrowRight, Eye, RefreshCw, Cpu, Database, CheckSquare, Sparkles } from 'lucide-react';
import { verificationService } from '../classes';

interface HomeViewProps {
  setCurrentPage: (page: PageId) => void;
}

export default function HomeView({ setCurrentPage }: HomeViewProps) {
  const activeUser = verificationService.getActiveUser();

  const handleStart = () => {
    if (activeUser) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('register');
    }
  };

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-indigo-600" />,
      title: 'Neural OCR Extraction',
      description: 'Automatically isolate, extract, and align individual document fields with deep accuracy.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      title: 'Fuzzy Match Verification',
      description: 'Cross-check extracted cardholder name records against submitted company rosters instantaneously.'
    },
    {
      icon: <Database className="w-6 h-6 text-indigo-600" />,
      title: 'Durable Local Storage',
      description: 'Safely cache and audit historic compliance records client-side using encapsulated localStorage workflows.'
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-indigo-600" />,
      title: 'Interactive Audit Log',
      description: 'Review interactive execution logs in real-time to follow every verification trace clearly.'
    }
  ];

  return (
    <div id="home-view-container" className="space-y-16 py-12 md:py-20 animate-fade-in">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Compliance Framework</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none pb-2">
          Automated Identity Verification <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-500 bg-clip-text text-transparent">
            Built for Enterprise Trust
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          VerifyKit streamlines company onboarding policies. Instantly upload partner and employee identity credentials, extract card records, and compare results for seamless compliance validations.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-100 hover:shadow-xl transition-all hover:-translate-y-0.5 pointer-events-auto"
          >
            <span>{activeUser ? 'Access Dashboard' : 'Get Started Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCurrentPage('about')}
            className="px-6 py-3 text-slate-700 hover:text-slate-900 bg-white border border-slate-200 font-medium rounded-xl hover:bg-slate-50 transition-all hover:-translate-y-0.5"
          >
            How it Works
          </button>
        </div>
      </div>

      {/* Visual Mock Showcase (Clean Design) */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 relative">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-500" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive Verification Sandbox</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              VerifyKit enables compliance officers to enter partner directories, submit JPG front scans, and receive realtime structured validation. Try registering your company, start a request, and inspect how data compares with verified standards.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Process Genuine ID documents with real OCR extraction.</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Validate nested identity field groups and format accuracy.</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Download verified certificates or reject anomalous uploads.</span>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-mono text-xs font-bold text-slate-400">DEMO WORKFLOW</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                Live Sample
              </span>
            </div>
            
            <div className="space-y-2.5 font-sans">
              <div className="text-xs">
                <span className="block font-bold text-slate-500">Document Type</span>
                <span className="font-medium text-slate-800">International ID Document</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block font-bold text-slate-500">Holder Name</span>
                  <span className="font-semibold text-slate-900">Jean Claude Habimana</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500">ID Serial No.</span>
                  <span className="font-mono font-semibold text-slate-900">198 7654 3210 5</span>
                </div>
              </div>
              
              <div className="mt-2 text-center py-2 rounded-lg bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-100">
                Status: Verified ✓
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Engineered for Transparency</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2">
            Engineered with high compliance standards to ensure complete data integrity.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="p-2.5 bg-slate-50 rounded-xl inline-block">{feat.icon}</div>
              <h4 className="font-bold text-slate-900 text-base">{feat.title}</h4>
              <p className="text-slate-500 text-xs leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
