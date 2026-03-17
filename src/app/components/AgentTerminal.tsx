import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, ChevronRight, CornerDownRight, Map, AlertTriangle, Zap, Target, Database } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

type MessageType = 'user' | 'system';
type BlockType = 'text' | 'chart' | 'table' | 'action' | 'insight' | 'source';

interface MessageBlock {
  type: BlockType;
  content?: string;
  data?: any;
}

interface Message {
  id: string;
  type: MessageType;
  blocks: MessageBlock[];
}

const PRESET_PROMPTS = [
  "BREAK DOWN REGIONAL HOTSPOTS FOR +2.8% DRIFT",
  "IDENTIFY ROOT CAUSE OF 14.2 KM² DISCREPANCY",
  "SHOW FINANCIAL IMPACT ANALYSIS (2.4B SAR)"
];

const MOCK_REGIONAL_DATA = [
  { region: 'N. RIYADH', sprawl: 6.8, type: 'INDUSTRIAL' },
  { region: 'E. JEDDAH', sprawl: 4.1, type: 'RESIDENTIAL' },
  { region: 'S. MECCA', sprawl: 2.3, type: 'COMMERCIAL' },
  { region: 'OTHER', sprawl: 1.0, type: 'MIXED' },
];

export function AgentTerminal({ isOpen, onClose, targetMetric }: { isOpen: boolean, onClose: () => void, targetMetric: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && targetMetric === '+2.8%' && messages.length === 0) {
      setMessages([
        {
          id: 'init',
          type: 'system',
          blocks: [
            { type: 'text', content: `TARGET METRIC LOCKED: [${targetMetric} DEVIATION]` },
            { type: 'text', content: "AGENT [CHANGE_TRACKER] IS READY FOR DEEP DIVE ANALYSIS. SELECT A QUERY OR INPUT MANUAL OVERRIDE." }
          ]
        }
      ]);
    }
    // reset if closed
    if (!isOpen) {
      const timer = setTimeout(() => {
        setMessages([]);
        setIsTyping(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, targetMetric]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    try {
      setIsTyping(true);
      const userMsgId = Date.now().toString();
      const sysMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [
        ...prev, 
        { id: userMsgId, type: 'user', blocks: [{ type: 'text', content: text }] },
        { id: sysMsgId, type: 'system', blocks: [] }
      ]);
      
      setInput('');

      const streamText = async (textToStream: string) => {
        // Init empty block if needed
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          const lastMsg = { ...newMsgs[lastIdx] };
          const blocks = [...lastMsg.blocks];
          
          if (!blocks.length || blocks[blocks.length - 1].type !== 'text') {
            blocks.push({ type: 'text', content: '' });
          }
          
          lastMsg.blocks = blocks;
          newMsgs[lastIdx] = lastMsg;
          return newMsgs;
        });

        const chars = textToStream.split('');
        for (let i = 0; i < chars.length; i++) {
          await new Promise(r => setTimeout(r, 10)); // faster typing
          setMessages(prev => {
            const newMsgs = [...prev];
            const lastIdx = newMsgs.length - 1;
            const lastMsg = { ...newMsgs[lastIdx] };
            const blocks = [...lastMsg.blocks];
            const blockIdx = blocks.length - 1;
            
            blocks[blockIdx] = { 
              ...blocks[blockIdx], 
              content: blocks[blockIdx].content + chars[i] 
            };
            
            lastMsg.blocks = blocks;
            newMsgs[lastIdx] = lastMsg;
            return newMsgs;
          });
        }
      };

      const appendBlock = async (block: MessageBlock) => {
        await new Promise(r => setTimeout(r, 300));
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          const lastMsg = { ...newMsgs[lastIdx] };
          lastMsg.blocks = [...lastMsg.blocks, block];
          newMsgs[lastIdx] = lastMsg;
          return newMsgs;
        });
      };

      if (text.includes("HOTSPOTS") || text.includes("BREAK DOWN") || text.includes("+2.8%")) {
        await streamText("INITIATING SPATIAL DISCREPANCY ANALYSIS...");
        await new Promise(r => setTimeout(r, 200));
        
        await appendBlock({
          type: 'insight',
          content: 'SYSTEM INSIGHT: MASTERPLAN BASELINE (500 KM²) VS LIDAR SCAN REALITY (514.2 KM²). TOTAL UNAUTHORIZED SPRAWL DETECTED: 14.2 KM².'
        });

        await streamText("CROSS-REFERENCING SATELLITE IMAGERY WITH MUNICIPAL PERMIT LOGS...");
        await appendBlock({
          type: 'source',
          content: "DATA FUSION COMPLETE. SOURCES: KACST SATELLITE FEED (RES: 0.5M) + BALADY PERMIT API + NATIONAL CENTER FOR AI (NCAI) SPRAWL ALGORITHM."
        });
        
        await streamText("GENERATING REGIONAL HOTSPOT DISTRIBUTION:");
        await appendBlock({ type: 'chart', data: MOCK_REGIONAL_DATA });
        
        await streamText("ROOT CAUSE ANALYSIS:");
        await appendBlock({ 
          type: 'table', 
          data: [
            { loc: 'N. RIYADH (OUTSKIRTS)', issue: 'UNLICENSED WAREHOUSE ZONES', area: '6.8 KM²' },
            { loc: 'E. JEDDAH (SUBURBS)', issue: 'INFORMAL RESIDENTIAL SQUATTING', area: '4.1 KM²' }
          ] 
        });

        await streamText("CORRELATING CAPEX LEAKAGE WITH UNAUTHORIZED ZONES...");
        await appendBlock({
          type: 'source',
          content: "SOURCES: MINISTRY OF FINANCE (ETIMAD) BUDGET ALLOCATION SYSTEM + REAL ESTATE REGISTRY (EJAR)."
        });

        await streamText("\nACTIONABLE RECOMMENDATION:");
        await appendBlock({ 
          type: 'action', 
          content: "FREEZE 2.4B SAR CAPEX ALLOCATION FOR N. RIYADH AND E. JEDDAH AMANAHS UNTIL ILLEGAL FOOTPRINT IS CLEARED."
        });
      } else {
        await streamText("ANALYZING REAL-TIME DATA STREAMS...");
        await new Promise(r => setTimeout(r, 400));
        
        await appendBlock({
          type: 'source',
          content: "SOURCES: MUNICIPAL ENFORCEMENT DB (EHF-992) + AI CAMERA NETWORK (RYD-CCTV-V2)."
        });

        await streamText("\nCORRELATION FOUND. DEVIATION TRACED TO LACK OF MUNICIPAL ENFORCEMENT. PLEASE REFER TO ENFORCEMENT AUDIT PANEL FOR SPECIFIC MAYORAL KPI LEAKAGE.");
      }
    } catch (error) {
      console.error("Terminal Stream Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 500, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-6 bottom-6 top-[80px] w-[520px] bg-gradient-to-br from-[#051105]/95 to-[#0a1a0a]/95 border border-[#00B558]/40 shadow-[0_0_80px_rgba(0,181,88,0.2)] backdrop-blur-xl z-50 flex flex-col uppercase rounded-xl pointer-events-auto overflow-hidden"
        >
          {/* Military Cyberpunk Decorative Corners */}
          <div className="absolute top-0 left-0 w-16 h-[2px] bg-[#00B558] z-20 pointer-events-none" />
          <div className="absolute top-0 left-0 w-[2px] h-16 bg-[#00B558] z-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-16 h-[2px] bg-[#00B558] z-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[2px] h-16 bg-[#00B558] z-20 pointer-events-none" />
          
          {/* Dots top right */}
          <div className="absolute top-2 right-16 flex gap-1 z-20 pointer-events-none">
            {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#00B558]/40" />)}
          </div>

          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#00B558]/20 bg-[#00B558]/10 relative overflow-hidden shrink-0">
            <motion.div 
               className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-[#00B558]/10 to-transparent"
               animate={{ x: ['-100%', '100%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full border-2 border-[#00B558] flex items-center justify-center relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="flex items-center justify-center relative w-full h-full"
                >
                  <Target className="w-5 h-5 text-[#00B558]" />
                </motion.div>
                <div className="absolute inset-0 rounded-full border border-[#00B558] animate-ping opacity-50" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(0,181,88,0.5)] leading-none mb-1">
                  TACTICAL LLM // CHG_TRACKER
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00B558] animate-pulse" />
                  <span className="text-[10px] text-[#00B558] font-bold tracking-[0.2em] uppercase">LIVE CONNECTION</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-[#00B558]/60 hover:text-white hover:bg-[#00B558]/20 rounded transition-colors relative z-10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#00B558]/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#00B558]/40">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col w-full ${msg.type === 'user' ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1.5 opacity-50 text-[10px] font-bold tracking-widest">
                  {msg.type === 'system' ? (
                    <>
                      <Map className="w-4 h-4 text-[#00B558]" />
                      <span className="text-[#00B558]">SYSTEM.AGENT</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#FCD34D]">OPERATOR.CMD</span>
                      <CornerDownRight className="w-4 h-4 text-[#FCD34D]" />
                    </>
                  )}
                </div>

                <div className={`max-w-[95%] flex flex-col gap-3 ${msg.type === 'user' ? "text-[#FCD34D] text-right font-bold text-sm" : "text-gray-300 text-xs"}`}>
                  {msg.blocks.map((block, idx) => {
                    if (block.type === 'text') {
                      return <div key={idx} className="whitespace-pre-wrap leading-relaxed tracking-wider font-bold">{block.content}</div>;
                    }
                    if (block.type === 'insight') {
                      return (
                        <div key={idx} className="flex items-center justify-between gap-4 bg-[#00B558]/5 border border-[#00B558]/20 px-4 py-3 shrink-0 shadow-[0_0_15px_rgba(0,181,88,0.05)] relative overflow-hidden rounded-sm my-1">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00B558]" />
                          <div className="flex items-start gap-3 relative z-10">
                            <Zap className="w-5 h-5 text-[#00B558] animate-pulse shrink-0 mt-0.5" />
                            <span className="text-[11px] font-black text-[#00B558] tracking-[0.15em] uppercase leading-relaxed">
                              {block.content}
                            </span>
                          </div>
                          <div className="flex gap-1 relative z-10 shrink-0">
                             {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-3 bg-[#00B558]/40" />)}
                          </div>
                        </div>
                      );
                    }
                    if (block.type === 'source') {
                      return (
                        <div key={idx} className="flex items-start gap-2 border-l-2 border-[#FCD34D]/50 pl-3 py-1 mt-1 opacity-80">
                          <Database className="w-4 h-4 text-[#FCD34D] shrink-0 mt-0.5" />
                          <div className="text-[10px] text-[#FCD34D] font-bold tracking-widest leading-relaxed uppercase">
                            <span className="opacity-50 mr-2">SOURCE_VERIFIED:</span>
                            {block.content}
                          </div>
                        </div>
                      );
                    }
                    if (block.type === 'chart') {
                      return (
                        <div key={idx} className="w-full h-40 mt-2 bg-[#00B558]/5 border border-[#00B558]/20 p-2 relative group rounded-sm shadow-[inset_0_0_20px_rgba(0,181,88,0.05)]">
                          <div className="absolute top-2 right-3 text-[10px] text-[#00B558]/50 font-bold tracking-widest">Y: SPRAWL (KM²)</div>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={block.data} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="2 2" stroke="#00B558" opacity={0.15} vertical={false} />
                              <XAxis dataKey="region" stroke="#00B558" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#00B558" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#051105', border: '1px solid #00B558', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                itemStyle={{ color: '#00B558', fontWeight: 'bold' }}
                                cursor={{ fill: '#00B558', opacity: 0.1 }}
                              />
                              <Bar dataKey="sprawl" fill="#00B558" radius={[2, 2, 0, 0]}>
                                {block.data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#FF4444' : '#00B558'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    }
                    if (block.type === 'table') {
                      return (
                        <div key={idx} className="w-full border border-[#00B558]/30 mt-2 bg-[#051105] rounded-sm overflow-hidden shadow-[0_0_15px_rgba(0,181,88,0.05)]">
                          <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-[#00B558]/30 text-[#00B558]/70 text-[10px] font-bold tracking-widest bg-[#00B558]/10">
                            <div className="col-span-4">HOTSPOT</div>
                            <div className="col-span-6">DETECTED SIGNATURE</div>
                            <div className="col-span-2 text-right">AREA</div>
                          </div>
                          {block.data.map((row: any, rIdx: number) => (
                            <div key={rIdx} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-[#00B558]/10 last:border-0 hover:bg-[#00B558]/10 transition-colors tracking-wider text-[11px]">
                              <div className="col-span-4 text-white font-bold truncate">{row.loc}</div>
                              <div className="col-span-6 text-gray-400 font-bold truncate">{row.issue}</div>
                              <div className="col-span-2 text-right text-[#FF4444] font-black">{row.area}</div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (block.type === 'action') {
                      return (
                        <div key={idx} className="mt-2 border border-[#FF4444]/50 bg-[#FF4444]/10 p-4 flex gap-3 items-start shadow-[0_0_20px_rgba(255,68,68,0.15)] rounded-sm relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF4444]" />
                          <AlertTriangle className="w-6 h-6 text-[#FF4444] shrink-0 mt-0.5 animate-pulse" />
                          <div className="text-[#FF4444] font-black tracking-widest leading-relaxed text-sm drop-shadow-[0_0_8px_rgba(255,68,68,0.5)]">{block.content}</div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-[#00B558]/50 mt-4 font-bold tracking-widest">
                <div className="w-1.5 h-3 bg-[#00B558]/50 animate-pulse" />
                <span className="animate-pulse">PROCESSING DATA STREAMS...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Prompts */}
          <AnimatePresence>
            {!isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-6 pb-4 flex flex-col gap-2 shrink-0 relative z-10"
              >
                {PRESET_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left w-full px-4 py-2.5 border border-[#00B558]/30 bg-[#00B558]/10 hover:bg-[#00B558]/20 hover:border-[#00B558]/60 transition-all text-[#00B558] flex items-center justify-between group cursor-pointer rounded-sm shadow-[0_0_10px_rgba(0,181,88,0.05)]"
                  >
                    <span className="truncate pr-4 font-bold tracking-widest text-xs">{prompt}</span>
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 border-t border-[#00B558]/30 bg-[#020805] shrink-0 relative z-10">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[#00B558] font-bold">{'>'}</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                disabled={isTyping}
                placeholder="ENTER QUERY COMMAND..."
                className="w-full bg-[#00B558]/5 border border-[#00B558]/30 py-3 pl-10 pr-4 text-white placeholder:text-[#00B558]/40 focus:outline-none focus:border-[#00B558] focus:bg-[#00B558]/10 transition-all disabled:opacity-50 rounded-sm font-bold tracking-widest text-xs"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
