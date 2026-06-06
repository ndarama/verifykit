/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageId, VerificationRecord } from '../types';
import { 
  ArrowLeft, CheckCircle, XCircle, Download, Fingerprint, MapPin, User, Calendar, Shield, Hash
} from 'lucide-react';

interface ResultViewProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  selectedRecord: VerificationRecord | null;
  setSelectedRecord: (record: VerificationRecord | null) => void;
}

export default function ResultView({
  currentPage,
  setCurrentPage,
  selectedRecord,
  setSelectedRecord,
}: ResultViewProps) {
  
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('both');

  const handleDone = () => {
    setSelectedRecord(null);
    setCurrentPage('dashboard');
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe fallback to the latest stored record if there is no selected record
  const records = [];
  try {
    const rawState = localStorage.getItem('verifykit_state_v2');
    if (rawState) {
      const parsed = JSON.parse(rawState);
      if (parsed && Array.isArray(parsed.records)) {
        records.push(...parsed.records);
      }
    }
  } catch (e) {
    console.error("Error reading records from verifykit_state_v2", e);
  }

  const activeRecord = selectedRecord || (records.length > 0 ? records[0] : null);

  if (!activeRecord || !activeRecord.extractedData) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4 font-sans text-slate-800">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold">No Records Found</h3>
        <p className="text-slate-500 text-sm">Please submit a Genuine ID scan in the workspace first.</p>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-lg transition cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const data = activeRecord.extractedData;
  const isVerified = activeRecord.status === 'Verified';

  const getAvatarInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const formatIDNumber = (num: string) => {
    const raw = num.replace(/\s+/g, '');
    if (raw.length === 16) {
      return `${raw[0]} ${raw.substring(1, 4)} ${raw[4]} ${raw.substring(5, 12)} ${raw[12]} ${raw.substring(13)}`;
    }
    return num;
  };

  const originCountry = data.originCountry || data.country || 'Unknown Issuing Origin';

  const getCountryCode = (country: string) => {
    const normalized = country.toLowerCase();
    const codes: Record<string, string> = {
      'republic of rwanda': 'RWA',
      rwanda: 'RWA',
      'united states': 'USA',
      canada: 'CAN',
      'united kingdom': 'GBR',
      france: 'FRA',
      kenya: 'KEN',
      uganda: 'UGA',
      tanzania: 'TZA',
      burundi: 'BDI',
      'south africa': 'ZAF',
      nigeria: 'NGA',
      ghana: 'GHA',
      ethiopia: 'ETH',
      india: 'IND',
      china: 'CHN',
      japan: 'JPN',
      germany: 'DEU',
      belgium: 'BEL',
      netherlands: 'NLD',
      australia: 'AUS',
    };
    return codes[normalized] || 'XXX';
  };

  const formatSex = (sex: string) => {
    const normalized = sex.toUpperCase();
    if (normalized === 'G' || normalized === 'M') return `${sex} (Male)`;
    if (normalized === 'F') return `${sex} (Female)`;
    return sex || 'Unknown';
  };

  const generateMRZLines = () => {
    const docCode = "ID";
    const countryCode = getCountryCode(originCountry);
    const cleanID = data.idNo.replace(/\s+/g, '').padEnd(9, '<').substring(0, 9);
    const birthYear = data.dob.split('/').length === 3 ? data.dob.split('/')[2].substring(2) : '94';
    const birthMonth = data.dob.split('/').length === 3 ? data.dob.split('/')[1] : '05';
    const birthDay = data.dob.split('/').length === 3 ? data.dob.split('/')[0] : '23';
    
    const expiryYear = data.expiry.split('/').length === 3 ? data.expiry.split('/')[2].substring(2) : '34';
    const expiryMonth = data.expiry.split('/').length === 3 ? data.expiry.split('/')[1] : '04';
    const expiryDay = data.expiry.split('/').length === 3 ? data.expiry.split('/')[0] : '14';
    
    const genderCode = data.sex === 'G' ? 'M' : data.sex.toUpperCase().substring(0, 1) || '<';
    const lastName = data.names.trim().split(/\s+/).pop() || "HABIMANA";
    const firstName = data.names.trim().split(/\s+/)[0] || "JEAN";
    
    const mrzLine1 = `${docCode}${countryCode}${cleanID}<<<<<<<<<<<<<<<`;
    const mrzLine2 = `${birthYear}${birthMonth}${birthDay}8${genderCode}${expiryYear}${expiryMonth}${expiryDay}7${countryCode}<<<<<<<<<<<4`;
    const mrzLine3 = `${lastName}<<${firstName}<<<<<<<<<<<<<<<<<<<`.substring(0, 30).toUpperCase();

    return [mrzLine1, mrzLine2, mrzLine3];
  };

  const mrzLines = generateMRZLines();

  return (
    <div id="result-view-container" className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 animate-fade-in font-sans">
      
      {/* Pop-up modal wrapper card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col" id="id-details-modal">
        
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">Extracted ID Details</h2>
              <span className="text-[11px] font-mono font-medium text-slate-500 block mt-1">
                Registry Index Code: #{activeRecord.id}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleDone}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition cursor-pointer px-3 py-1.5 bg-slate-100/50 hover:bg-slate-100 rounded-xl"
          >
            Close
          </button>
        </div>

        {/* Modal Body / Split content: Rendered ID and details table */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card physical view (Lefthand col, 5 Cols to make sure it is nicely scaled) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Visual Inspection ID Model
              </span>
              
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {(['both', 'front', 'back'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setActiveSide(side)}
                    className={`px-2.5 py-0.5 text-[9px] uppercase font-black rounded transition cursor-pointer ${
                      activeSide === side 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* FRONT OF THE ID CARD */}
              {(activeSide === 'front' || activeSide === 'both') && (
                <div 
                  id="nid-front-rendered-card" 
                  className="relative bg-gradient-to-br from-[#f1fcfc] via-[#fffffa] to-[#ebf9eb] border-2 border-indigo-900/60 rounded-2xl p-4 shadow-md max-w-full overflow-hidden select-none"
                  style={{ minHeight: '220px' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                    <div className="w-1/2 bg-cyan-400" />
                    <div className="w-1/4 bg-yellow-400" />
                    <div className="w-1/4 bg-emerald-500" />
                  </div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.04),transparent_60%)] pointer-events-none" />

                  <div className="flex justify-between items-start border-b border-indigo-100 pb-1.5">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black uppercase tracking-wider text-cyan-800 leading-none block">
                        GENUINE ID
                      </span>
                      <span className="text-[10px] font-black text-indigo-900 uppercase tracking-tight block mt-0.5">
                        INTERNATIONAL ID
                      </span>
                    </div>
                    <div className="w-6 h-6 bg-yellow-400/20 border border-yellow-600 rounded-full flex items-center justify-center relative shadow-xs shrink-0">
                      <span className="text-[6.5px] font-mono font-black text-yellow-800">{getCountryCode(originCountry)}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-12 gap-3">
                    <div className="col-span-3">
                      <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-center items-center shadow-xs">
                        {isVerified ? (
                          <div className="absolute inset-0 bg-slate-900/5 flex flex-col justify-center items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-serif font-black flex items-center justify-center text-xs shadow-sm">
                              {getAvatarInitials(data.names)}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-rose-50/70 flex flex-col justify-center items-center p-2 text-center">
                            <span className="text-[8px] font-black text-red-700 uppercase tracking-wide leading-tight">
                              REJECTED
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-9 space-y-1.5 text-[10px] leading-snug">
                      <div className="bg-[#e6f4ea]/40 border border-emerald-200 rounded-lg px-2 py-1">
                        <span className="text-[7px] font-black text-slate-400 block uppercase">ID NO</span>
                        <span className="text-xs font-mono font-black text-[#137333] tracking-wide">
                          {formatIDNumber(data.idNo)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[7px] font-black text-slate-400 block uppercase">Names / Amazina</span>
                        <p className="font-extrabold text-slate-900 leading-tight">
                          {data.names}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[7px] font-black text-slate-400 block uppercase">DOB / Date of Birth</span>
                          <p className="font-bold text-slate-800">{data.dob}</p>
                        </div>
                        <div>
                          <span className="text-[7px] font-black text-slate-400 block uppercase">Sex / Igitsina</span>
                          <p className="font-bold text-slate-800">{formatSex(data.sex)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BACK OF THE ID CARD */}
              {(activeSide === 'back' || activeSide === 'both') && (
                <div 
                  id="nid-back-rendered-card" 
                  className="relative bg-gradient-to-br from-[#fafcfb] via-[#ffffff] to-[#eff4f9] border-2 border-indigo-900/60 rounded-2xl p-4 shadow-md max-w-full overflow-hidden select-none flex flex-col justify-between"
                  style={{ minHeight: '220px' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 flex">
                    <div className="w-1/2 bg-cyan-400" />
                    <div className="w-1/4 bg-yellow-400" />
                    <div className="w-1/4 bg-emerald-500" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center border-b border-indigo-100 pb-1.5">
                      <span className="text-[8px] font-black text-[#1a365d] block uppercase tracking-wider leading-none">
                        GENUINE ID &bull; INTERNATIONAL ID
                      </span>
                      <span className="inline-block px-1 bg-slate-100 rounded text-[7.5px] font-bold text-slate-500 border">
                        REVERSE
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[9.5px] leading-snug">
                      <div>
                        <span className="text-[7px] font-black text-slate-400 block uppercase">Blood Group / Itsinda</span>
                        <p className="font-extrabold text-red-600 bg-red-50 inline-block px-1 rounded border border-red-100">
                          {data.bloodGroup}
                        </p>
                      </div>

                      <div>
                        <span className="text-[7px] font-black text-slate-400 block uppercase">Valid Until</span>
                        <p className="font-bold text-emerald-700 bg-emerald-50 rounded border border-emerald-200 px-1 inline-block">
                          {data.validUntil}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[7px] font-black text-slate-400 block uppercase">Address / Aho atuye</span>
                        <p className="font-bold text-slate-900 truncate">
                          {data.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-2 bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg font-mono text-[8px] tracking-widest leading-normal text-left uppercase">
                    {mrzLines.map((mline, index) => (
                      <div key={index} className="truncate">{mline}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Precise metadata spreadsheet representation / detailed fields inspector */}
          <div className="lg:col-span-7 flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-4">
              Decoded ID Field Inspector
            </span>

            {/* Structured Table Layout with smooth lines */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 flex-1 flex flex-col justify-between" id="fields-inspector-box">
              <div className="divide-y divide-slate-200 flex-1">
                {[
                  { label: "Names", val: data.names, icon: <User className="w-3.5 h-3.5" /> },
                  { label: "International ID Number", val: formatIDNumber(data.idNo), icon: <Hash className="w-3.5 h-3.5" /> },
                  { label: "Origin Country", val: originCountry, icon: <Shield className="w-3.5 h-3.5" /> },
                  { label: "Date of Birth", val: data.dob, icon: <Calendar className="w-3.5 h-3.5" /> },
                  { label: "Gender", val: formatSex(data.sex), icon: <User className="w-3.5 h-3.5" /> },
                  { label: "Nationality", val: data.nationality, icon: <Shield className="w-3.5 h-3.5" /> },
                  { label: "Blood Group", val: data.bloodGroup, icon: <Shield className="w-3.5 h-3.5 text-rose-500" /> },
                  { label: "Residential Address", val: data.address, icon: <MapPin className="w-3.5 h-3.5" /> },
                  { label: "Date of Issue / Authority", val: `${data.dateOfIssue} (${data.placeOfIssue})`, icon: <Calendar className="w-3.5 h-3.5" /> },
                  { label: "Expiry Date", val: data.expiry, icon: <Calendar className="w-3.5 h-3.5" /> },
                  { label: "Universal Card Serial", val: data.cardNo, icon: <Hash className="w-3.5 h-3.5" /> },
                ].map((row, idx) => (
                  <div key={idx} className="flex px-4 py-2.5 items-center justify-between hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                      <span className="text-slate-400">{row.icon}</span>
                      {row.label}
                    </span>
                    <span className="text-xs font-black text-slate-800 text-right select-all">
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer actions */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 font-mono">
            Generated via VerifyKit Client-Side Parser Node
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDone}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
