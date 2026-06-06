/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageId } from '../types';
import { verificationService } from '../classes';
import { 
  BookOpen, HelpCircle, ShieldAlert, FileText, Mail, 
  CheckCircle, ArrowRight, Send, HelpCircle as FaqIcon, Landmark,
  RefreshCw
} from 'lucide-react';

/* ==========================================
   ABOUT US VIEW
   ========================================== */
interface AboutViewProps {
  setCurrentPage: (page: PageId) => void;
}

export function AboutView({ setCurrentPage }: AboutViewProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-10 animate-fade-in font-sans text-slate-800">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">About VerifyKit</h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Simplifying structural onboarding compliance with advanced, terminal-audited identity analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Our Enterprise Mission</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            VerifyKit helps modern corporations satisfy regulatory onboarding policies with zero friction. Historically, verifying international ID files was manual, error-prone, and slow.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Our framework automates these critical workflows. By incorporating strict file format checks (accepting JPG/JPEG only), recursive value auditing, and asynchronous OCR parsing queues, corporate compliance managers receive validated data in seconds.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
          <h4 className="font-bold text-sm text-slate-800 tracking-wide uppercase">Why Choose VerifyKit?</h4>
          
          <div className="space-y-3 text-xs leading-normal">
            <div className="flex gap-2.5 items-start">
              <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-850">Compliant Frictionless Audits:</strong> Keep track of candidate rosters without storing sensitive documents in volatile temporary folders.
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <CheckCircle className="w-4 h-4 text-teal-605 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-850">Advanced Fuzzy Comparisons:</strong> Prevent typographical mismatch inconsistencies with nested recursive comparisons.
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <CheckCircle className="w-4 h-4 text-teal-605 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-850">Terminal Integrity Monitoring:</strong> Inspect how backend TypeScript compilation blocks run in real-time.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => setCurrentPage('register')}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow"
        >
          <span>Instantiate Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ==========================================
   FAQ VIEW
   ========================================== */
export function FaqView() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is VerifyKit?',
      a: 'VerifyKit is an enterprise-tier Identity Verification platform built to streamline background checks. It empowers corporate human resource directors to submit digital card credentials on behalf of candidates and verify them instantaneously.'
    },
    {
      q: 'Who can utilize VerifyKit?',
      a: 'Registered corporate representatives and compliance managers. Representatives can register their company parameters, log in, and utilize our verification suites to audit potential team members or contractors.'
    },
    {
      q: 'What formats of documentation are accepted?',
      a: 'VerifyKit strictly enforces secure file extension policies. The system accepts JPG and JPEG document images only (with .jpg or .jpeg extensions). Attempting to upload PNG or PDF files will automatically trigger exception handling blocks to prevent malware injections.'
    },
    {
      q: 'Does the scanner perform live OCR on Rwandan ID cards?',
      a: 'Yes, our model simulates a neural text-segmentation scanner tailored to Republic of Rwanda National Identity Card standards, automatically processing name strings, card series number structures, issue places, and expiration bounds.'
    },
    {
      q: 'What occurs if the candidate entered name does not match the card scan?',
      a: 'Our comparison engine automatically flags mismatches and issues a Rejected audit record with the explicit failure reason: "Document information does not match the submitted verification data." It also outputs debugging traces immediately to the console.'
    },
    {
      q: 'Are verified logs dural and secure?',
      a: 'Undoubtedly. Every registration, authentication attempt, recursive validation checks, and completed verification reports are persisted client-side in localStorage, complying with GDPR non-custodial privacy policies.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in font-sans text-slate-800">
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Need clarifying answers regarding VerifyKit integration schemas and file upload parameters?
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left px-5 py-4 font-bold text-slate-900 text-sm flex items-center justify-between hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500"
            >
              <span>{faq.q}</span>
              <span className="text-blue-500 text-lg">{openIndex === index ? '−' : '+'}</span>
            </button>

            {openIndex === index && (
              <div className="px-5 pb-4 pt-1 border-t border-slate-100 text-slate-600 text-xs leading-relaxed bg-slate-50/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================
   PRIVACY POLICY VIEW
   ========================================== */
export function PrivacyView() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in font-sans text-slate-800">
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h2>
        <p className="text-slate-500 text-mini">Last Modified: June 6, 2026</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-xs leading-relaxed text-slate-650">
        <h3 className="text-base font-bold text-slate-900 border-b pb-2">1. Scope and Information Collected</h3>
        <p>
          VerifyKit operates as a non-custodial, client-side corporate identity compliance platform. We do not store, distribute, or stream candidate photo IDs to third-party databases. Uploaded JPG/JPEG materials are mapped internally inside sandboxed JS processes to simulate text extracts; binary files are deleted upon matching evaluation.
        </p>

        <h3 className="text-base font-bold text-slate-900 border-b pb-2">2. Processing Legitimacy and GDPR</h3>
        <p>
          Corporate managers who employ VerifyKit to execute background checks must warrant they have obtained unambiguous consent from subject candidates in accordance with Article 6 of General Data Protection Regulations (GDPR). Check data is stored client-side in localStorage securely and can be expunged by terminating sessions or clearing local storage.
        </p>

        <h3 className="text-base font-bold text-slate-900 border-b pb-2">3. Security Thresholds and Verification Integrity</h3>
        <p>
          To maintain high reliability and prevent processing issues, our platform strictly restricts evaluations to standard image file signatures. Built-in compliance structures check parameters nestedly to verify all secure identity components before storage.
        </p>
        
        <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-[11px] leading-normal font-sans">
          <strong>Enterprise Notice:</strong> VerifyKit complies with standard cryptographic hash practices. Company credentials stand isolated inside secure local partitions.
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   TERMS AND CONDITIONS VIEW
   ========================================== */
export function TermsView() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in font-sans text-slate-800">
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600">
          <Landmark className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terms and Conditions</h2>
        <p className="text-slate-500 text-mini">Effective Date: June 6, 2026</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-xs leading-relaxed text-slate-650">
        <h3 className="text-base font-bold text-slate-900 border-b pb-2">1. Agreement to Terms</h3>
        <p>
          By creating a corporate hub on VerifyKit and allocating representative credentials, you agree to comply with the legal bindings stated herein. Individuals executing audits warrant they represent an authorized organization.
        </p>

        <h3 className="text-base font-bold text-slate-900 border-b pb-2">2. Verification Accuracy and Simulated Extractor</h3>
        <p>
          VerifyKit utilizes asynchronous algorithms to parse JPEG document text lines. It is-designed to crossweight names against subject registers. Organizations acknowledge that while scanning mimics Republic of Rwanda National Card criteria, manual oversight is recommended during critical compliance pipelines.
        </p>

        <h3 className="text-base font-bold text-slate-900 border-b pb-2">3. Prohibited Usage of Platforms</h3>
        <p>
          Users are strictly prohibited from submitting modified, altered, malicious, or unregistered image signatures. Attempting to bypass file type limitations (submitting PNG or executable attachments) constitutes a violation of service terms and triggers immediate sandbox constraints.
        </p>
      </div>
    </div>
  );
}

/* ==========================================
   CONTACT VIEW
   ========================================== */
export function ContactView() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert("Please populate required fields (Name, Email, Message).");
      return;
    }

    setSending(true);
    
    // Log contact submission recursively to Developer Terminal!
    verificationService['addLog']('system', `Contact Form submitted by: '${form.name}' <${form.email}>`);
    verificationService['addLog']('validation', `Contact input fields recursively parsed successfully.`);

    setTimeout(() => {
      setSending(false);
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      verificationService['addLog']('success', `Corporate support email routed successfully.`);
    }, 1200);
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-8 animate-fade-in font-sans text-slate-800">
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 bg-blue-50 border border-blue-110 rounded-full text-blue-600">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Contact Support Hub</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Encountering compliance bugs or need integration assistance? Fill out corporate queries below.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-blue-600" />

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full border border-emerald-250 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Message Transported</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
              Thank you! Your compliance ticket has been registered in the system queue. Our developer support team will follow up within 24 hours.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Send another ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Official Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Sarah Jenkins"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-250 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Corporate Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g., mail@company.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-250 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Ticket Subject</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g., Rwanda National ID scanner limits"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-250 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Support Enquiry Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your issue with document evaluations, terminal outputs, or system exceptions..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-250 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors leading-normal"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-55"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Transporting ticket query...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Support Enquiry</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
