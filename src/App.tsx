/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Scale, 
  User, 
  ShieldCheck,
  Activity,
  History,
  BookOpen,
  Users,
  LayoutGrid,
  CreditCard,
  Upload,
  FilePlus,
  FileText
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hujambo! Mimi ni Msuluhishi wa Chama chenu. Unaweza kuniuliza kuhusu sheria za chama, hali ya kifedha ya mwanachama, au mzozo wowote. Nitajibu kwa haki kulingana na sheria zenu.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{ members: any[], records: any[], documents: string[] }>({ members: [], records: [], documents: [] });
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.members) setData(json);
    } catch (e) {
      console.error("Data fetch error:", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Nimepokea file: ${file.name}. Sasa nina habari zaidi za kusaidia kutatua migogoro.`,
          timestamp: new Date()
        }]);
        fetchData();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      alert(`Error uploading file: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const resData = await response.json();
      if (resData.error) throw new Error(resData.error);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: resData.content,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Pole sana, kuna tatizo la mtandao. Jaribu tena baadae.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      fetchData(); // Refresh data after each interaction in case records updated
    }
  };

  const quickActions = [
    { label: "Jane hajalipa? (Missed)", value: "Jane Wambui amemiss payments ngapi?" },
    { label: "Mary Loan? (Eligibility)", value: "Mary Akinyi anastahili mkopo wa kiasi gani?" },
    { label: "Compare Jane & Mary", value: "Nisaidie kucompare Jane Wambui na Mary Akinyi kifedha." },
    { label: "Withdrawal rules?", value: "Sheria ya kujitoa chama inasemaje?" },
  ];

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 p-4 sm:p-6 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="bg-indigo-500 w-3 h-3 rounded-full animate-pulse"></span>
            Chama Arbitrator
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Vertex AI Reasoning Engine • Mama Bidii Chama</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Agent Status</p>
            <p className="text-xs font-mono text-emerald-400">OPERATIONAL</p>
          </div>
          <div className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 hidden xs:block">
            <p className="text-sm font-mono tracking-tighter">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Bento Layout */}
      <div className="grid grid-cols-12 grid-rows-12 gap-4 flex-grow overflow-hidden">
        
        {/* Member Directory - Section */}
        <div className="hidden lg:flex col-span-3 row-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <Users size={14} className="text-slate-500" />
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Member Records</h2>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-grow">
            {data.members.map((member, i) => (
              <div key={i} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl group hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-xs">{member.name}</p>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
                    member.status === 'SUSPENDED' 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {member.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                  <div><p className="text-slate-500">CONTRIB</p><p className="text-indigo-300">KES {member.total_contributions.toLocaleString()}</p></div>
                  <div><p className="text-slate-500">MISSED</p><p className={`${member.missed_payments > 0 ? 'text-rose-400 font-bold' : ''}`}>{member.missed_payments} PMTS</p></div>
                </div>
              </div>
            ))}
          </div>

          {/* New Knowledge base section */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
               <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FilePlus size={12} className="text-slate-500" />
                  Knowledge Base
                </h2>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 hover:bg-slate-800 rounded transition-colors text-indigo-400"
                  disabled={isUploading}
                >
                  <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".txt,.csv,.md"
                />
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {data.documents?.length > 0 ? (
                data.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded-lg text-[9px] text-slate-400">
                    <FileText size={10} className="text-indigo-500/50" />
                    <span className="truncate flex-grow">{doc}</span>
                  </div>
                ))
              ) : (
                <p className="text-[9px] text-slate-600 italic px-1">Hakuna documents zilizopakiwa bado.</p>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 shrink-0">
            <div className="bg-indigo-600/5 border border-indigo-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity size={10} className="text-indigo-400" />
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">System Alert</p>
              </div>
              <p className="text-[10px] text-indigo-100/60 font-medium">Parser synchronized with mpesa_records.csv</p>
            </div>
          </div>
        </div>

        {/* Arbitration Agent Console - MAIN */}
        <div className="col-span-12 lg:col-span-6 row-span-12 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col relative overflow-hidden ring-1 ring-white/5 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 z-20 flex justify-between items-center">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} className="text-indigo-500" />
              Arbitration Engine
            </h2>
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 rounded-full border border-slate-800">
              <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
              <span className="text-[9px] font-mono text-slate-500 tracking-tighter uppercase">{isLoading ? 'Thinking' : 'Operational'}</span>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-grow p-6 pt-20 space-y-8 overflow-y-auto custom-scrollbar"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 font-bold text-[10px] ${
                      message.role === 'user' 
                        ? 'bg-slate-700 text-slate-100' 
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {message.role === 'user' ? 'YOU' : 'AI'}
                    </div>
                    <div className={`space-y-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        message.role === 'user' 
                          ? 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tr-none' 
                          : 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-50 rounded-tl-none'
                      }`}>
                        <div className="whitespace-pre-wrap font-medium">
                          {message.content}
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono tracking-widest">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
                    <LayoutGrid size={12} />
                  </div>
                  <div className="flex gap-1.5 py-4 px-5 bg-indigo-950/20 rounded-2xl rounded-tl-none border border-indigo-500/10">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions overlay */}
          <div className="px-4 pb-2 -mt-4 z-10 flex overflow-x-auto gap-2 no-scrollbar">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.value)}
                className="flex-shrink-0 px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all whitespace-nowrap"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the arbitrator (Swahili/Sheng/Eng)..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-4 pl-5 pr-14 text-sm transition-all focus:outline-none text-slate-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 top-2 h-10 px-5 rounded-xl flex items-center justify-center font-bold text-[10px] tracking-widest ${
                  input.trim() && !isLoading
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                SEND
              </button>
            </form>
          </div>
        </div>

        {/* Bylaws Knowledge Base - Section */}
        <div className="hidden lg:flex col-span-3 row-span-5 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BookOpen size={14} className="text-slate-500" />
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bylaw Rules</h2>
          </div>
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-grow">
            <div className="border-l-2 border-indigo-500 pl-3 py-0.5">
              <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-tight">Art 1.1: Contributions</p>
              <p className="text-[9px] text-slate-400 mt-1 italic">KES 2,000 due by 5th mwezi.</p>
            </div>
            <div className="border-l-2 border-slate-700 pl-3 py-0.5">
              <p className="text-[10px] font-bold uppercase text-slate-300 tracking-tight">Art 1.2: Late Fees</p>
              <p className="text-[9px] text-slate-400 mt-1 italic">KES 200/week late pmt.</p>
            </div>
            <div className="border-l-2 border-rose-500 pl-3 py-0.5">
              <p className="text-[10px] font-bold uppercase text-rose-400 tracking-tight">Art 1.3: Suspension</p>
              <p className="text-[9px] text-slate-400 mt-1 italic">3 consecutive misses = Block.</p>
            </div>
            <div className="border-l-2 border-indigo-500 pl-3 py-0.5">
              <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-tight">Art 2.2: Max Loan</p>
              <p className="text-[9px] text-slate-400 mt-1 italic">3x total contributions limit.</p>
            </div>
          </div>
        </div>

        {/* Transaction Records - Section */}
        <div className="hidden lg:flex col-span-3 row-span-5 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <History size={14} className="text-slate-500" />
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">M-Pesa History</h2>
          </div>
          <div className="space-y-1 font-mono text-[8px] overflow-y-auto flex-grow custom-scrollbar">
            {data.records.map((log, i) => (
              <div key={i} className="flex justify-between py-1.5 px-1 border-b border-slate-800/50 hover:bg-slate-800/30">
                <span className="text-slate-600">{log.Date.slice(5)}</span>
                <span className="truncate max-w-[60px]">{log.Member.split(' ')[0]}</span>
                <span className={`${
                  log.Type === 'Contribution' ? 'text-emerald-400' : 
                  log.Type === 'MISSED' ? 'text-rose-400' : 'text-indigo-400'
                }`}>{log.Amount === '0' ? 'MISS' : log.Amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Footer - Section */}
        <div className="hidden lg:flex col-span-3 row-span-2 bg-indigo-600 rounded-2xl p-4 flex-col justify-between border-t border-white/20 shadow-indigo-600/30 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Activity size={40} className="rotate-12" />
          </div>
          <h2 className="text-[9px] font-black text-indigo-50 uppercase tracking-[0.2em] relative z-10">Collective Health</h2>
          <div className="flex items-end gap-2 relative z-10">
            <p className="text-4xl font-black text-white tracking-tighter">98%</p>
            <p className="text-[8px] text-indigo-100 mb-1 leading-none font-bold uppercase opacity-80">Repayment<br/>Rate</p>
          </div>
          <div className="h-1.5 w-full bg-indigo-900/30 rounded-full mt-2 overflow-hidden ring-1 ring-white/10 relative z-10">
            <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)] w-[98%]"></div>
          </div>
        </div>

      </div>

      {/* Global CSS Inject */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
