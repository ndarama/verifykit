/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageId, VerificationRecord } from './types';
import Navigation from './components/Navigation';
import ConsoleTerminal from './components/ConsoleTerminal';

// Views
import HomeView from './components/HomeView';
import RegisterView from './components/RegisterView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import VerifyView from './components/VerifyView';
import ResultView from './components/ResultView';
import { AboutView, FaqView, PrivacyView, TermsView, ContactView } from './components/StaticViews';

import { Shield, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('homepage');
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // Direct page render mapping
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'homepage':
        return <HomeView setCurrentPage={setCurrentPage} />;
      case 'register':
        return <RegisterView setCurrentPage={setCurrentPage} />;
      case 'login':
        return <LoginView setCurrentPage={setCurrentPage} />;
      case 'dashboard':
        return (
          <DashboardView 
            setCurrentPage={setCurrentPage} 
            setSelectedRecord={setSelectedRecord} 
          />
        );
      case 'verify':
        return (
          <VerifyView 
            setCurrentPage={setCurrentPage} 
            setSelectedRecord={setSelectedRecord} 
          />
        );
      case 'result':
        return (
          <ResultView 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage} 
            selectedRecord={selectedRecord}
            setSelectedRecord={setSelectedRecord}
          />
        );
      case 'about':
        return <AboutView setCurrentPage={setCurrentPage} />;
      case 'faq':
        return <FaqView />;
      case 'privacy':
        return <PrivacyView />;
      case 'terms':
        return <TermsView />;
      case 'contact':
        return <ContactView />;
      default:
        return <HomeView setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div id="verifykit-layout" className="min-h-screen flex flex-col bg-slate-50 font-sans leading-normal text-slate-800 transition-all pb-11">
      {/* Navigation Topbar */}
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isConsoleOpen={isConsoleOpen}
        toggleConsole={() => setIsConsoleOpen(!isConsoleOpen)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4">
        {renderCurrentPage()}
      </main>

      {/* Corporate Platform Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 mt-auto no-print">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white shadow shadow-blue-200">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">VerifyKit</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              VerifyKit is a secure, sandboxed compliance system tailored for automated company-based ID validations. Powered by recursive validation engines and asynchronous neural scanner modeling.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Enterprise Links</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button onClick={() => setCurrentPage('about')} className="text-slate-600 hover:text-blue-600">
                  Mission &amp; About Us
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('faq')} className="text-slate-600 hover:text-blue-600">
                  Instruction FAQ
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('contact')} className="text-slate-600 hover:text-blue-600">
                  Technical Support
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Legal Regulations</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button onClick={() => setCurrentPage('privacy')} className="text-slate-600 hover:text-blue-600">
                  Privacy Policy (GDPR)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('terms')} className="text-slate-600 hover:text-blue-600">
                  Terms of Agreements
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-150 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-4">
          <div>© 2026 VerifyKit International. All resources reserved.</div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded border">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Operational Standby Mode</span>
          </div>
        </div>
      </footer>

      {/* Realtime Executing Developer Console */}
      <ConsoleTerminal 
        isOpen={isConsoleOpen} 
        onToggle={() => setIsConsoleOpen(!isConsoleOpen)} 
      />
    </div>
  );
}

