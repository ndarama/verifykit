/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { verificationService } from '../classes';
import { Terminal, Trash2, ChevronDown, ChevronUp, Search, Info, ShieldCheck, Cpu } from 'lucide-react';

interface ConsoleTerminalProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConsoleTerminal({ isOpen, onToggle }: ConsoleTerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read current logs initially
    setLogs(verificationService.getLogs());

    // Subscribe to new log updates
    const unsubscribe = verificationService.onLog((newLog) => {
      // Refresh list
      setLogs(verificationService.getLogs());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isOpen, autoScroll]);

  const handleClear = () => {
    verificationService.clearLogs();
  };

  const filteredLogs = logs.filter((log) => {
    // Filter by type
    if (filter !== 'all' && log.type !== filter) return false;
    // Filter by search text
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'system':
        return 'text-blue-400';
      case 'auth':
        return 'text-purple-400';
      case 'validation':
        return 'text-amber-400 font-medium';
      case 'file':
        return 'text-teal-400';
      case 'scanner':
        return 'text-pink-400 animate-pulse';
      case 'comparison':
        return 'text-cyan-400';
      case 'success':
        return 'text-emerald-400 font-semibold';
      case 'error':
        return 'text-rose-400 font-semibold underline-offset-2';
      default:
        return 'text-gray-300';
    }
  };

  const getBadgeStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'system':
        return 'bg-blue-950/50 text-blue-400 border-blue-800/80';
      case 'auth':
        return 'bg-purple-950/50 text-purple-400 border-purple-800/80';
      case 'validation':
        return 'bg-amber-950/50 text-amber-400 border-amber-800/80';
      case 'file':
        return 'bg-teal-950/50 text-teal-400 border-teal-800/80';
      case 'scanner':
        return 'bg-pink-950/50 text-pink-400 border-pink-800/80';
      case 'comparison':
        return 'bg-cyan-950/50 text-cyan-400 border-cyan-800/80';
      case 'success':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/80';
      case 'error':
        return 'bg-rose-950/50 text-rose-400 border-rose-800/80';
      default:
        return 'bg-gray-900 border-gray-700 text-gray-400';
    }
  };

  return (
    <div
      id="dev-terminal-container"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-800 shadow-2xl transition-all duration-300 ease-in-out ${
        isOpen ? 'h-[320px]' : 'h-11'
      }`}
    >
      {/* Header bar */}
      <div
        id="dev-terminal-header"
        onClick={onToggle}
        className="flex items-center justify-between px-4 h-11 bg-gray-900 border-b border-gray-800 cursor-pointer select-none hover:bg-gray-850"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-gray-200 tracking-wider uppercase">
            VerifyKit Developer Terminal Console &amp; TS Log Engine
          </span>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
            Active
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-gray-400" onClick={(e) => e.stopPropagation()}>
          <div className="hidden md:flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-500">
              <Cpu className="w-3 h-3" /> Runtime: TS v5.8
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-teal-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> State: Persistent
            </span>
          </div>
          <button
            id="clear-terminal-btn"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-2.5 py-1 text-gray-400 hover:text-white bg-gray-850 rounded border border-gray-800 text-[11px] transition-all hover:bg-gray-800"
            title="Clear console records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Log</span>
          </button>
          <button
            id="toggle-terminal-btn"
            onClick={onToggle}
            className="p-1 hover:text-white text-gray-400"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="dev-terminal-content" className="flex flex-col h-[276px] bg-slate-950 font-mono text-xs">
          {/* Filtering and Controls */}
          <div className="flex flex-wrap items-center justify-between bg-gray-900 border-b border-gray-800/80 px-4 py-2 gap-2 text-gray-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Filter Channel:</span>
              <div className="flex rounded-md bg-slate-950 p-0.5 border border-gray-800">
                {(['all', 'system', 'auth', 'validation', 'file', 'scanner', 'success', 'error'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-2 py-0.5 rounded text-[10px] capitalize transition-all ${
                      filter === type
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase text-gray-400 font-bold">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-gray-800 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                Auto-Scroll
              </label>

              <div className="relative flex items-center bg-slate-950 rounded border border-gray-800 px-2 py-0.5 h-6">
                <Search className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                <input
                  type="text"
                  placeholder="Grep logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none w-28 md:w-44 h-full"
                />
              </div>
            </div>
          </div>

          {/* Logs Terminal Area */}
          <div
            id="terminal-scroller"
            ref={terminalRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 custom-scrollbar bg-gray-950 select-text select-all"
          >
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-1 text-center">
                <Info className="w-5 h-5 text-gray-700" />
                <p>No compiled traces match criteria.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 font-mono leading-relaxed group transition-all text-gray-300"
                >
                  <span className="text-gray-600 text-[10px] mt-0.5 select-none">{log.timestamp}</span>
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border select-none ${getBadgeStyle(
                      log.type
                    )}`}
                  >
                    {log.type}
                  </span>
                  <span className={`flex-1 break-all whitespace-pre-wrap ${getLogColor(log.type)}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
