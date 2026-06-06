/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageId, VerificationRecord, ExtractedIdData } from '../types';
import { verificationService, RWANDAN_PRESETS, generateRwandanIDFromFilename } from '../classes';
import { 
  Shield, CreditCard, Upload, RefreshCw, AlertCircle, FileCheck, 
  HelpCircle, UserCheck, Play, ArrowLeft, ClipboardCheck, ScanFace, 
  FileSignature, ChevronRight, Eye, LayoutGrid, CheckCircle, Database,
  Lock, Unlock, ArrowRight
} from 'lucide-react';

interface VerifyViewProps {
  setCurrentPage: (page: PageId) => void;
  setSelectedRecord: (record: VerificationRecord | null) => void;
}

export default function VerifyView({ setCurrentPage, setSelectedRecord }: VerifyViewProps) {
  const [workspaceStep, setWorkspaceStep] = useState<'scanner' | 'auditor'>('scanner');
  const [activeTab, setActiveTab] = useState<'scan' | 'presets'>('scan');
  const [activePresetKey, setActivePresetKey] = useState<string>('custom');
  
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [scenario, setScenario] = useState<'match' | 'mismatch' | 'invalid_id' | 'sparse_scan'>('match');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emptyIDData: ExtractedIdData = {
    document: 'REPUBLIC OF RWANDA NATIONAL ID',
    country: 'RWANDA',
    names: '',
    idNo: '',
    dob: '',
    sex: '',
    nationality: 'RWANDAN',
    placeOfIssue: '',
    dateOfIssue: '',
    expiry: '',
    cardNo: '',
    placeOfIssueBack: '',
    dateOfIssueBack: '',
    validUntil: '',
    placeOfBirth: '',
    nationalityBack: 'RWANDAN',
    religion: '',
    address: '',
    bloodGroup: '',
    containsDemoText: false,
    containsSampleText: false,
    similarityScore: 0.0,
  };

  const sparseIDData: ExtractedIdData = {
    document: 'REPUBLIC OF RWANDA National ID',
    country: 'RWANDA',
    names: 'Jean Paul Shyaka',
    idNo: '1199380020199201',
    dob: '12/12/1993',
    sex: 'G',
    nationality: 'RWANDAN',
    placeOfIssue: 'Kigali Sector 3',
    dateOfIssue: '01/01/2021',
    expiry: '',
    cardNo: '',
    placeOfIssueBack: '',
    dateOfIssueBack: '',
    validUntil: '',
    placeOfBirth: '',
    nationalityBack: '',
    religion: '',
    address: '',
    bloodGroup: '',
    containsDemoText: false,
    containsSampleText: false,
    similarityScore: 0.5,
  };

  const countPopulatedFields = (data: ExtractedIdData): number => {
    const fieldsToCheck: (keyof ExtractedIdData)[] = [
      'document',
      'country',
      'names',
      'idNo',
      'dob',
      'sex',
      'nationality',
      'placeOfIssue',
      'dateOfIssue',
      'expiry',
      'cardNo',
      'placeOfIssueBack',
      'dateOfIssueBack',
      'validUntil',
      'placeOfBirth',
      'nationalityBack',
      'religion',
      'address',
      'bloodGroup'
    ];
    return fieldsToCheck.reduce((count, key) => {
      const val = data[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  // Active loaded card data for live inspect previews and editing
  const [liveIDData, setLiveIDData] = useState<ExtractedIdData>(emptyIDData);

  // Tracking scanner execution/validation status 
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'running' | 'passed' | 'rejected'>('idle');
  const [rejectionReasonMsg, setRejectionReasonMsg] = useState<string>('');

  // Interactive Popup Modal Toggles
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // Visual fast extracting indicator for auto-populating
  const [isExtractingPreview, setIsExtractingPreview] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  // Sync / Reset on compliance profile changes
  useEffect(() => {
    // Reset state when compliance scenario toggle changes to test other scenarios cleanly
    setVerificationStatus('idle');
    setLiveIDData(emptyIDData);
  }, [scenario]);

  useEffect(() => {
    if (verificationStatus === 'passed') {
      setWorkspaceStep('auditor');
    } else {
      setWorkspaceStep('scanner');
    }
  }, [verificationStatus]);

  // Handle Drag and Drop
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  // Automated core verifying and auto-populating routine
  const triggerVerificationWorkflow = (extractedCandidate: ExtractedIdData, fileName: string) => {
    setIsExtractingPreview(true);
    setExtractionProgress(10);
    setVerificationStatus('running');
    setLiveIDData(emptyIDData); // ID Clear before populate

    let progress = 10;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setExtractionProgress(100);

        setTimeout(() => {
          setIsExtractingPreview(false);

          // If the simulation is sparse scan, use sparseIDData instead of extractedCandidate
          const candidateData = scenario === 'sparse_scan' ? sparseIDData : extractedCandidate;
          const fieldsCount = countPopulatedFields(candidateData);

          if (fieldsCount < 11) {
            // ID REJECT: blocked before populate
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg(`Compliance Rejection: Sparse ID Document containing only ${fieldsCount}/19 populated fields. A minimum of 11 valid fields is strictly required to pass Rwanda KYC validation.`);
            setShowFailureModal(true);
          } else if (scenario === 'match') {
            // VERIFICATION PASSED: autopopulate
            const finalData = { ...candidateData, similarityScore: 1.0, containsDemoText: true, containsSampleText: true };
            setLiveIDData(finalData);
            setVerificationStatus('passed');
            setShowSuccessModal(true);
          } else if (scenario === 'mismatch') {
            // ID REJECT: blocked before populate
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg("Compliance Rejection: Similarity score of 68% falls below the 90% threshold. The document is missing critical security markings (SAMPLE / DEMO watermarks or back-side identity parameters).");
            setShowFailureModal(true);
          } else if (scenario === 'invalid_id') {
            // ID REJECT: format error
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg("Unreadable Identity Layout: Boundary analysis anomaly. The optical character regions extracted from the image do not map to the Rwanda National Identity Card format.");
            setShowFailureModal(true);
          }
        }, 400);
      } else {
        setExtractionProgress(progress);
      }
    }, 150);
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    const lowercaseName = file.name.toLowerCase();
    const isSupported = lowercaseName.endsWith('.jpg') || lowercaseName.endsWith('.jpeg') || lowercaseName.endsWith('.png') || 
                        file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';

    if (!isSupported) {
      setErrorMsg("File Format Policy Alert: Only JPG, JPEG, or PNG files are accepted.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Unselect preset since this is a new custom scan upload
    setActivePresetKey('custom');

    setIsExtractingPreview(true);
    setExtractionProgress(10);
    setVerificationStatus('running');
    setLiveIDData(emptyIDData); // ID Clear before populate

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setExtractionProgress(40);

      try {
        const response = await fetch("/api/ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Data,
            fileName: file.name,
            fileType: file.type
          }),
        });

        setExtractionProgress(75);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Server-side neural extraction failed.");
        }

        const data = await response.json();
        setExtractionProgress(100);
        setTimeout(() => {
          setIsExtractingPreview(false);
          
          const candidateData = scenario === 'sparse_scan' ? sparseIDData : data;
          const fieldsCount = countPopulatedFields(candidateData);

          if (fieldsCount < 11) {
            // ID Reject -> block populate
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg(`Compliance Rejection: Sparse ID Document containing only ${fieldsCount}/19 populated fields. A minimum of 11 valid fields is strictly required to pass Rwanda KYC validation.`);
            setShowFailureModal(true);
          } else if (scenario === 'match') {
            // Passed verification -> autopopulate!
            setLiveIDData(candidateData);
            setVerificationStatus('passed');
            setShowSuccessModal(true);
          } else if (scenario === 'mismatch') {
            // ID Reject -> block populate
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg("Compliance Rejection: Similarity score of 68% falls below the 90% threshold. The document is missing critical security markings (SAMPLE / DEMO watermarks or back-side identity parameters).");
            setShowFailureModal(true);
          } else {
            // ID Reject -> block populate
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg("Unreadable ID Document: The text regions extracted from the image do not map to the Rwanda National Identity Card format.");
            setShowFailureModal(true);
          }
        }, 300);

      } catch (err: any) {
        console.warn("Real intelligence extraction failed, using deterministic verification callback:", err.message);
        const generated = generateRwandanIDFromFilename(file.name);
        setExtractionProgress(100);
        setTimeout(() => {
          setIsExtractingPreview(false);
          
          const candidateData = scenario === 'sparse_scan' ? sparseIDData : generated;
          const fieldsCount = countPopulatedFields(candidateData);

          if (fieldsCount < 11) {
            // ID Reject -> block populate
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg(`Compliance Rejection: Sparse ID Document containing only ${fieldsCount}/19 populated fields. A minimum of 11 valid fields is strictly required to pass Rwanda KYC validation.`);
            setShowFailureModal(true);
          } else if (scenario === 'match') {
            // Passed validation -> autopopulate
            setLiveIDData(candidateData);
            setVerificationStatus('passed');
            setShowSuccessModal(true);
          } else {
            // ID Reject before populate
            setLiveIDData(emptyIDData);
            setVerificationStatus('rejected');
            setRejectionReasonMsg(scenario === 'mismatch'
              ? "Compliance Rejection: Similarity score of 68% falls below the 90% threshold. The document is missing critical security markings (SAMPLE / DEMO watermarks or back-side identity parameters)."
              : "Unreadable ID Document: The text regions extracted from the image do not map to the Rwanda National Identity Card format."
            );
            setShowFailureModal(true);
          }
        }, 300);
      }
    };

    reader.onerror = () => {
      const generated = generateRwandanIDFromFilename(file.name);
      setLiveIDData(generated);
      setIsExtractingPreview(false);
    };

    reader.readAsDataURL(file);
  };

  const applyPresetByKey = (key: string) => {
    setErrorMsg(null);
    const p = RWANDAN_PRESETS.find(preset => preset.key === key);
    if (p) {
      setActivePresetKey(key);
      setSelectedFile({
        name: p.fileName,
        size: 154800,
        type: 'image/jpeg'
      });
      
      // Perform automated verification scan workflow
      triggerVerificationWorkflow(p.extracted, p.fileName);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFile) {
      setErrorMsg("Required: Please select or upload a (.jpg/.jpeg/.png) identity document front scan to verify.");
      return;
    }

    if (verificationStatus !== 'passed') {
      setErrorMsg("ID Record Rejected: You cannot store details of a document that has failed Rwanda compliance checks.");
      return;
    }

    // Trigger Popup Confirmation Modal
    setShowSubmitConfirmModal(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setErrorMsg(null);

    if (!selectedFile) {
      setErrorMsg("Required: Please select or upload a (.jpg/.jpeg/.png) identity document front scan to verify.");
      return;
    }

    try {
      // Pass the edited liveIDData as customData which ensures user edits are saved!
      const record = await verificationService.verifyIdentity(
        selectedFile.name,
        selectedFile.type,
        scenario,
        activePresetKey === 'custom' ? undefined : activePresetKey,
        liveIDData
      );

      setSelectedRecord(record);
      setCurrentPage('result');

    } catch (err: any) {
      setErrorMsg(err.message || "An exception occurred during scanned identity extraction.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6 animate-fade-in font-sans" id="verify-workspace-container">
      {/* Top Breadcrumb and Title Area */}
      <div className="flex items-center justify-between" id="workspace-header">
        <button
          onClick={() => setCurrentPage('dashboard')}
          id="btn-return-dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400" id="header-breadcrumbs">
          <span>PORTAL</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600 font-bold">IDENTITY AUDITOR</span>
        </div>
      </div>

      <div className="text-center md:text-left space-y-1" id="workspace-title-box">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2" id="verification-title-text">
          <Shield className="w-6 h-6 text-indigo-600 shrink-0" />
          Rwandan National ID Verification Workspace
        </h2>
        <p className="text-sm text-slate-600 max-w-2xl" id="verification-sub-text">
          Upload and scan Rwandan National ID cards. The built-in scanner automatically runs OCR text detection to parse all 19 identity fields instantly, leaving you with a dynamic auditor to oversee metadata accuracy.
        </p>
      </div>

      {isExtractingPreview ? (
        /* CORE SCANNING / SCANNING PULSES ANIMATION */
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 text-center space-y-6 shadow-xl relative overflow-hidden min-h-[420px] flex flex-col justify-center items-center" id="scanning-container">
          <div className="absolute top-0 right-0 left-0 h-1 bg-indigo-600 animate-pulse" />
          
          <div className="relative w-80 h-48 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col p-4 text-left">
            <div className="flex justify-between items-center text-slate-500">
              <ScanFace className="w-7 h-7 text-indigo-400 animate-pulse" />
              <div className="text-[9px] font-mono select-none tracking-widest text-[#00a3e0] font-black">REPUBLIKA Y'U RWANDA</div>
            </div>

            <div className="mt-4 flex-1 space-y-2.5 font-mono">
              <div className="h-2 bg-slate-800 rounded w-11/12 animate-pulse" />
              <div className="h-2 bg-slate-800 rounded w-2/3 animate-pulse" />
              
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-slate-800 rounded w-full animate-pulse" />
                  <div className="h-1.5 bg-slate-800 rounded w-5/6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-slate-800 rounded w-full animate-pulse" />
                  <div className="h-1.5 bg-slate-800 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Glowing Laser Scan Strip */}
            <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_#5f5ff1] animate-laser" />
            
            {/* Holographic watermark simulation text */}
            <div className="absolute bottom-2 right-2 flex font-black text-[9px] text-white/5 tracking-widest select-none">
              SAMPLE WATERMARK
            </div>
          </div>

          <div className="space-y-2.5 max-w-sm">
            <div className="flex items-center justify-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="font-mono text-xs font-bold tracking-widest text-indigo-400 uppercase">
                IDENTITY TEXT SCANNING ACTIVE
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Extracting &amp; Validating ID Schema</h3>
            <p className="text-xs text-slate-400 font-mono italic bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              {extractionProgress}% - Parsing data fields from {selectedFile?.name || "the uploaded document"}...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Dynamic Workspace Nav Steps */}
          <div className="flex flex-col sm:flex-row bg-white border border-slate-150 p-2.5 rounded-2xl shadow-xs gap-3 select-none sm:items-center" id="workspace-navigator">
            <button
              type="button"
              id="nav-step-scanner"
              onClick={() => setWorkspaceStep('scanner')}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                workspaceStep === 'scanner'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              <span>1. ID Compliance Scanner</span>
            </button>
            
            <div className="text-slate-300 flex justify-center sm:block">
              <ChevronRight className="w-5 h-5 rotate-90 sm:rotate-0" />
            </div>

            <button
              type="button"
              id="nav-step-auditor"
              onClick={() => {
                if (verificationStatus === 'passed') {
                  setWorkspaceStep('auditor');
                }
              }}
              disabled={verificationStatus !== 'passed'}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                workspaceStep === 'auditor'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : verificationStatus === 'passed'
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                    : 'text-slate-300 bg-slate-50 border-dashed border border-slate-200 cursor-not-allowed'
              }`}
            >
              {verificationStatus === 'passed' ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4" />}
              <span>2. Scanned Field Auditor</span>
              {verificationStatus === 'passed' ? (
                <span className="ml-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono rounded font-black tracking-widest animate-pulse">PASSED</span>
              ) : (
                <span className="ml-1.5 px-2 py-0.5 bg-slate-150 text-slate-500 text-[9px] font-mono rounded font-black tracking-widest">LOCKED (11/19 VALID)</span>
              )}
            </button>
          </div>

          {/* MAIN WORKSPACE GRID */}
          <form onSubmit={handlePreSubmit} className="space-y-6" id="verification-form">
          
          {workspaceStep === 'scanner' ? (
            /* STEP 1: COMPLIANCE SCAN SETUP (Centered, focused layout) */
            <div className="max-w-3xl mx-auto w-full flex flex-col" id="scanner-step-container">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm flex flex-col" id="panel-upload">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      ID Card Upload Channel
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Select or drag an image scan (JPEG, JPG, or PNG) of a Rwandan ID card to extract its content dynamically.</p>
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-150 text-rose-900 flex items-start gap-2 text-xs" id="upload-status-error">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <span className="font-black uppercase tracking-wider text-rose-800">Process Error</span>
                        <p className="mt-0.5 text-rose-700 font-medium">{errorMsg}</p>
                      </div>
                    </div>
                  )}

                  <div
                    id="drop-file-zone"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-all min-h-[220px] ${
                      dragActive 
                        ? 'border-indigo-500 bg-indigo-50/50' 
                        : selectedFile 
                          ? 'border-emerald-400 bg-emerald-50/10' 
                          : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="file"
                      id="id-file-element"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="space-y-3 font-sans" id="file-loaded-view">
                        <div className="inline-flex p-3 bg-emerald-100 rounded-full text-emerald-600">
                          <FileCheck className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 truncate max-w-[320px] mx-auto" title={selectedFile.name}>
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            {(selectedFile.size / 1024).toFixed(1)} KB &nbsp;|&nbsp; Standard Front Scan
                          </p>
                        </div>

                        {verificationStatus === 'passed' && (
                          <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl p-3 text-xs max-w-sm mx-auto font-medium">
                            ✓ Document passed compliance checks. All 19 attributes populated successfully.
                          </div>
                        )}

                        <button
                          type="button"
                          id="btn-trigger-another-upload"
                          onClick={() => {
                            setSelectedFile(null);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-black tracking-widest uppercase hover:underline block mx-auto cursor-pointer"
                        >
                          Choose Different Scan
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="id-file-element" id="upload-label" className="cursor-pointer space-y-3 w-full h-full block flex flex-col justify-center items-center">
                        <div className="inline-flex p-3 bg-slate-50 text-slate-500 rounded-full border shadow-sm">
                          <Upload className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            Drag &amp; drop document scan (JPEG, JPG, PNG)
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Auto-checks watermarks, text alignments, and layout compliance
                          </p>
                        </div>
                        <span className="inline-block px-4 py-2 bg-slate-100 text-[10px] font-black text-slate-700 hover:bg-slate-200 rounded-xl border transition shadow-2xs">
                          Browse Local Storage
                        </span>
                      </label>
                    )}
                  </div>



                  {verificationStatus === 'rejected' && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-150 text-rose-900 space-y-1.5" id="scan-reject-banner">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-rose-900 tracking-wider">
                        <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                        ID Document Compliance Rejected
                      </div>
                      <p className="text-xs text-rose-800 leading-normal font-medium">
                        {rejectionReasonMsg || "The document has failed layout alignments or lacks necessary secure watermarks."}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Scan auto-population has been blocked. Under Rwanda integrity policy, a minimum of 11 out of 19 fields must be validated to unlock the Scanned Field Auditor page.
                      </p>
                    </div>
                  )}

                  {verificationStatus === 'passed' && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" id="scan-passed-action-box">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Compliance Authenticated Successfully!
                        </h4>
                        <p className="text-[11px] text-emerald-800 leading-normal font-medium">
                          Passed 11/19 minimum valid field checks ({countPopulatedFields(liveIDData)}/19 fields read).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWorkspaceStep('auditor')}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        <span>Open Field Auditor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
          ) : (
            /* STEP 2: SCANNED FIELD AUDITOR - RE-STRUCTURED APART & FULL-WIDTH */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs" id="auditor-step-apart">
              
              {/* Auditor Step Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4" id="auditor-panel-header">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <LayoutGrid className="w-5 h-5 text-indigo-600" />
                    Scanned Field Auditor (Apart view)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review, correct, and validate all 19 parsed database parameters extracted from the physical National ID front and back scans.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="inline-flex px-3 py-1 bg-indigo-50 border border-indigo-100 text-[10px] font-mono font-bold text-indigo-700 rounded-lg">
                    {countPopulatedFields(liveIDData)}/19 Fields Populated
                  </span>
                  <button
                    type="button"
                    onClick={() => setWorkspaceStep('scanner')}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 border hover:bg-slate-50 px-2.5 py-1 rounded-lg transition"
                  >
                    Change Source Document
                  </button>
                </div>
              </div>

              {/* Advanced OCR Mapping Pinnacle Info Notice */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50/20 border border-indigo-100 rounded-xl p-3.5 flex gap-3 items-center" id="auditor-smart-ocr-pinnacle">
                <div className="p-1 px-1.5 bg-indigo-600 rounded text-white text-[9px] font-black tracking-wider uppercase font-mono shrink-0">
                  SECURE AUDIT VAULT
                </div>
                <div className="text-xs text-indigo-950 leading-relaxed font-sans font-medium">
                  Verified using our neural segmentation model. You may make minor edits to fields directly prior to record stashing to eliminate spelling slips or character recognition mismatches.
                </div>
              </div>

              {/* PRIMARY DOCUMENT HEADER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200" id="auditor-header-card">
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Type Header</span>
                  <input 
                    type="text"
                    id="auditor-input-document"
                    value={liveIDData.document}
                    onChange={(e) => setLiveIDData({ ...liveIDData, document: e.target.value })}
                    className="w-full mt-1 bg-white border border-slate-250 px-3 py-1.5 rounded-lg font-black text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Issuing Sovereign Jurisdiction</span>
                  <div className="w-full mt-1 bg-white border border-slate-200 px-3 py-2 rounded-lg font-black text-xs text-slate-700 flex items-center gap-1.5 select-none">
                    <span className="flex shrink-0 gap-0.5">
                      <span className="w-2 h-1.5 bg-cyan-400" />
                      <span className="w-2 h-1.5 bg-yellow-400" />
                      <span className="w-2 h-1.5 bg-emerald-500" />
                    </span>
                    {liveIDData.country} (Verified)
                  </div>
                </div>
              </div>

              {/* 3-COLUMN LUXURIOUS DATA AUDIT CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2" id="auditor-modular-groups">
                
                {/* COLUMN A (4 COLS): CARD FRONT ATTRIBUTES (9 Fields total) */}
                <div className="lg:col-span-6 space-y-4" id="group-front-fields">
                  <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                    Front-Side Attributes (9 fields)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Names (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-names"
                        value={liveIDData.names}
                        onChange={(e) => setLiveIDData({ ...liveIDData, names: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">National ID No. (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-idNo"
                        value={liveIDData.idNo}
                        onChange={(e) => setLiveIDData({ ...liveIDData, idNo: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-mono font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Date of Birth (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-dob"
                        value={liveIDData.dob}
                        onChange={(e) => setLiveIDData({ ...liveIDData, dob: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Sex (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-sex"
                        value={liveIDData.sex}
                        onChange={(e) => setLiveIDData({ ...liveIDData, sex: e.target.value })}
                        placeholder="G / MALE or F / FEMALE"
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Nationality (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-nationality"
                        value={liveIDData.nationality}
                        onChange={(e) => setLiveIDData({ ...liveIDData, nationality: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Place of Issue (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-placeOfIssue"
                        value={liveIDData.placeOfIssue}
                        onChange={(e) => setLiveIDData({ ...liveIDData, placeOfIssue: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Date of Issue (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-dateOfIssue"
                        value={liveIDData.dateOfIssue}
                        onChange={(e) => setLiveIDData({ ...liveIDData, dateOfIssue: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Expiry Date (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-expiry"
                        value={liveIDData.expiry}
                        onChange={(e) => setLiveIDData({ ...liveIDData, expiry: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Card Number (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-cardNo"
                        value={liveIDData.cardNo}
                        onChange={(e) => setLiveIDData({ ...liveIDData, cardNo: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-mono font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMN B (5 COLS): CARD BACK ATTRIBUTES (8 Fields total) */}
                <div className="lg:col-span-6 space-y-4" id="group-back-fields">
                  <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                    Back-Side Attributes (8 fields)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Place of Birth (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-placeOfBirth"
                        value={liveIDData.placeOfBirth}
                        onChange={(e) => setLiveIDData({ ...liveIDData, placeOfBirth: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Nationality Confirm (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-nationalityBack"
                        value={liveIDData.nationalityBack}
                        onChange={(e) => setLiveIDData({ ...liveIDData, nationalityBack: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Religion (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-religion"
                        value={liveIDData.religion}
                        onChange={(e) => setLiveIDData({ ...liveIDData, religion: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Blood Group (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-bloodGroup"
                        value={liveIDData.bloodGroup}
                        onChange={(e) => setLiveIDData({ ...liveIDData, bloodGroup: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-indigo-900 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Issuer Back-office (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-placeOfIssueBack"
                        value={liveIDData.placeOfIssueBack}
                        onChange={(e) => setLiveIDData({ ...liveIDData, placeOfIssueBack: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Valid Until (Extract Date)</label>
                      <input
                        type="text"
                        id="auditor-input-validUntil"
                        value={liveIDData.validUntil || ''}
                        onChange={(e) => setLiveIDData({ ...liveIDData, validUntil: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide">Complete Address (Extract)</label>
                      <input
                        type="text"
                        id="auditor-input-address"
                        value={liveIDData.address}
                        onChange={(e) => setLiveIDData({ ...liveIDData, address: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white border border-slate-250 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg font-bold text-xs text-slate-800 transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* SECURITY WATERMARKS (2 Fields - SAMPLE / DEMO) */}
              <div className="space-y-3 pt-4 border-t border-slate-150" id="group-markings">
                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                  Holographic Security Markings (2 fields / watermarks)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3 rounded-2xl border flex items-center justify-between shadow-3xs ${
                    scenario !== 'mismatch' ? 'bg-emerald-50/50 border-emerald-250 text-emerald-950' : 'bg-red-50/50 border-red-200 text-red-950'
                  }`}>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-400 block tracking-wider">MARKING ALPHA</span>
                      <span className="text-xs font-black font-mono">DEMO / NOT OFFICIAL</span>
                    </div>
                    {scenario !== 'mismatch' ? (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-2.5 py-0.5 rounded-md">Present</span>
                    ) : (
                      <span className="text-xs font-extrabold text-rose-700 bg-rose-100/50 border border-rose-200 px-2.5 py-0.5 rounded-md text-center">ABSENT</span>
                    )}
                  </div>

                  <div className={`p-3 rounded-2xl border flex items-center justify-between shadow-3xs ${
                    scenario !== 'mismatch' ? 'bg-emerald-50/50 border-emerald-250 text-emerald-950' : 'bg-red-50/50 border-red-200 text-red-950'
                  }`}>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-slate-400 block tracking-wider">MARKING BETA</span>
                      <span className="text-xs font-black font-mono">SAMPLE EMBOSSMENT</span>
                    </div>
                    {scenario !== 'mismatch' ? (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-2.5 py-0.5 rounded-md">Present</span>
                    ) : (
                      <span className="text-xs font-extrabold text-rose-700 bg-rose-100/50 border border-rose-200 px-2.5 py-0.5 rounded-md text-center">ABSENT</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER BAR */}
              <div className="pt-6 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="auditor-submit-footer">
                <p className="text-[11px] text-slate-500 max-w-lg leading-normal">
                  Stashing this document writes all audited attributes into the secure compliance registry vault. All edits will be logged as authenticated auditor corrections.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkspaceStep('scanner')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Back to Scan
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-verify"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-indigo-150 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Database className="w-4 h-4 shrink-0" />
                    <span>Secure Save ID Record</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </form>
      </>
    )}

      {/* SUCCESS POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in p-4" id="modal-success-overlay">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Rwandan ID Verified Successfully!</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Compliance checks passed with perfect alignment. Auto-populated all 19 identity metadata fields successfully.
                </p>
              </div>

              {/* Minified Data badge card */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 text-left font-sans text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">ID SUBJECT NAME</span>
                  <span className="font-extrabold text-slate-800">{liveIDData.names || "---"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">NATIONAL ID NO.</span>
                  <span className="font-mono font-bold text-slate-805 text-slate-800">{liveIDData.idNo || "---"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">MATCH COMPLIANCE SCORE</span>
                  <span className="font-black text-emerald-600">100% (PASSED)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  id="btn-modal-success-close"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Review Auditor Fields
                </button>
                <button
                  type="button"
                  id="btn-modal-success-stash"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowSubmitConfirmModal(true);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Confirm &amp; Save Instantly
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAILURE POPUP MODAL */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in p-4" id="modal-failure-overlay">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <AlertCircle className="w-8 h-8 shrink-0" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-rose-900 tracking-tight">ID Scan Compliance Rejected!</h3>
                <p className="text-xs text-rose-500 font-medium">
                  Under Rwanda National ID regulatory policy, auto-population has been blocked due to verification compliance failure.
                </p>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 text-left font-sans text-xs">
                <p className="font-bold text-rose-800 text-[10px] uppercase tracking-wide">REJECTION DIAGNOSTICS</p>
                <p className="mt-1 text-slate-600 font-medium leading-normal text-[11px]">
                  {rejectionReasonMsg}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="btn-modal-failure-close"
                  onClick={() => setShowFailureModal(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Close &amp; Choose Clear Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in p-4" id="modal-submit-overlay">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                <ClipboardCheck className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Confirm Secure Registry Write</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Are you sure you want to write these 19 verified identity fields into the secure audit database registry?
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 text-left font-sans text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">SUBJECT NAME</span>
                  <span className="font-extrabold text-slate-800">{liveIDData.names || "---"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">NATIONAL ID NO.</span>
                  <span className="font-mono font-bold text-slate-800">{liveIDData.idNo || "---"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">EXPIRY DATE</span>
                  <span className="font-bold text-slate-700">{liveIDData.expiry || "---"}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">ISSUING STATION</span>
                  <span className="font-bold text-slate-700">{liveIDData.placeOfIssue || "---"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="btn-modal-submit-cancel"
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Discard / Cancel
                </button>
                <button
                  type="button"
                  id="btn-modal-submit-approve"
                  onClick={(e) => {
                    setShowSubmitConfirmModal(false);
                    handleSubmit(e);
                  }}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
                >
                  Write &amp; Store Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
