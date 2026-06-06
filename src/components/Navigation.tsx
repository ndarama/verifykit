/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageId } from '../types';
import { verificationService } from '../classes';
import { Shield, CheckCircle, Terminal, LogOut, User, Menu, X, BookOpen, HelpCircle, ShieldAlert, FileText, Mail } from 'lucide-react';

interface NavigationProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  isConsoleOpen: boolean;
  toggleConsole: () => void;
}

export default function Navigation({
  currentPage,
  setCurrentPage,
  isConsoleOpen,
  toggleConsole,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeUser = verificationService.getActiveUser();

  const handleLogout = () => {
    verificationService.logout();
    setCurrentPage('homepage');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'homepage' as PageId, label: 'Home' },
    { id: 'about' as PageId, label: 'About Us' },
    { id: 'faq' as PageId, label: 'FAQ' },
    { id: 'contact' as PageId, label: 'Contact' },
  ];

  const legalLinks = [
    { id: 'privacy' as PageId, label: 'Privacy Policy' },
    { id: 'terms' as PageId, label: 'Terms' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and branding */}
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage('homepage')}
              className="flex items-center focus:outline-none text-left"
            >
              <img 
                src="https://res.cloudinary.com/dulzeafbm/image/upload/v1780747407/Logo_amvgv0.png" 
                alt="VerifyKit Logo" 
                className="w-48 h-14 object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          {/* Desktop links */}
          <nav className="hidden md:flex space-x-1 items-center">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === link.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}

            <span className="h-4 w-px bg-slate-200 mx-2" />

            {/* If logged in */}
            {activeUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'dashboard' || currentPage === 'verify' || currentPage === 'result'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold max-w-44 truncate hidden lg:block">
                  {activeUser.company.name} ({activeUser.repName})
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors"
                  title="Logout representative"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('login')}
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setCurrentPage('register')}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md shadow-indigo-100"
                >
                  Get Started
                </button>
              </div>
            )}

            <span className="h-4 w-px bg-slate-200 mx-2" />

            {/* Developer Terminal Toggle */}
            <button
              onClick={toggleConsole}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                isConsoleOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{isConsoleOpen ? 'Close Console' : 'Open Console'}</span>
            </button>
          </nav>

          {/* Mobile menu and mobile console toggle */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleConsole}
              className={`p-2 rounded-lg border flex items-center justify-center ${
                isConsoleOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Toggle Dev Console"
            >
              <Terminal className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-3 px-4 space-y-2 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentPage(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-base font-medium ${
                  currentPage === link.id ? 'bg-indigo-50 text-indigo-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-2.5 pb-1 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase px-3 mb-1">Legal Documents</div>
            {legalLinks.map((lib) => (
              <button
                key={lib.id}
                onClick={() => {
                  setCurrentPage(lib.id);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                {lib.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3">
            {activeUser ? (
              <div className="space-y-2">
                <div className="px-3 py-1 text-xs text-slate-500 font-semibold truncate bg-slate-50 rounded border">
                  Company: <span className="text-slate-800 font-bold">{activeUser.company.name}</span>
                </div>
                <button
                  onClick={() => {
                    setCurrentPage('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <User className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Representative</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setCurrentPage('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('register');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 text-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-100"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
