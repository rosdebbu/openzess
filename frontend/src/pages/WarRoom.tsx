import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Code, FileText, Layers, LayoutPanelLeft, Key, X, CheckCircle2, Focus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'agent';
  swarm_role?: string;
  provider?: string;
  icon?: React.ReactNode;
  color?: string;
  bg_glow?: string;
  content: string;
}

interface SwarmQuadrant {
  role_name: string;
  provider: string;
  system_instruction: string;
  icon: React.ReactNode;
  color: string;
  bg_glow: string;
}

export default function WarRoom() {
  const [input, setInput] = useState('');
  const [isSwarmActive, setIsSwarmActive] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Swarm Provider Keys
  const [keys, setKeys] = useState(() => ({
      gemini: localStorage.getItem('openzess_api_key') || '', 
      openai: localStorage.getItem('openzess_openai_key') || '',
      anthropic: localStorage.getItem('openzess_anthropic_key') || '',
      groq: localStorage.getItem('openzess_groq_key') || '',
      deepseek: localStorage.getItem('openzess_deepseek_key') || '',
      deepseek2: localStorage.getItem('openzess_deepseek2_key') || '',
      deepseek3: localStorage.getItem('openzess_deepseek3_key') || '',
      deepseek4: localStorage.getItem('openzess_deepseek4_key') || '',
      deepseek5: localStorage.getItem('openzess_deepseek5_key') || '',
      deepseek6: localStorage.getItem('openzess_deepseek6_key') || '',
      deepseek7: localStorage.getItem('openzess_deepseek7_key') || '',
      qwen: localStorage.getItem('openzess_qwen_key') || '',
      glm: localStorage.getItem('openzess_glm_key') || '',
      kimi: localStorage.getItem('openzess_kimi_key') || ''
  }));

  const saveKeys = () => {
      localStorage.setItem('openzess_api_key', keys.gemini);
      localStorage.setItem('openzess_openai_key', keys.openai);
      localStorage.setItem('openzess_anthropic_key', keys.anthropic);
      localStorage.setItem('openzess_groq_key', keys.groq);
      localStorage.setItem('openzess_deepseek_key', keys.deepseek);
      localStorage.setItem('openzess_deepseek2_key', keys.deepseek2);
      localStorage.setItem('openzess_deepseek3_key', keys.deepseek3);
      localStorage.setItem('openzess_deepseek4_key', keys.deepseek4);
      localStorage.setItem('openzess_deepseek5_key', keys.deepseek5);
      localStorage.setItem('openzess_deepseek6_key', keys.deepseek6);
      localStorage.setItem('openzess_deepseek7_key', keys.deepseek7);
      localStorage.setItem('openzess_qwen_key', keys.qwen);
      localStorage.setItem('openzess_glm_key', keys.glm);
      localStorage.setItem('openzess_kimi_key', keys.kimi);
      setShowKeyModal(false);
      setErrorPrompt(null);
  };

  const agents: SwarmQuadrant[] = [
    {
      role_name: "Coder",
      provider: "deepseek",
      system_instruction: "You are the Alpha Coder Agent. Write aggressive, perfectly optimized, cutting-edge code. Defend your technical decisions ruthlessly against the other agents. Do not write extensive explanations.",
      icon: <Code size={16} className="text-blue-500" />,
      color: "border-blue-500/30 text-blue-500",
      bg_glow: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      role_name: "Documenter",
      provider: "openai",
      system_instruction: "You are the elitist Documentation Agent. Demand absolute clarity. Write extensive, highly readable documentation and ruthlessly enforce JSDoc standards on the Coder.",
      icon: <FileText size={16} className="text-emerald-500" />,
      color: "border-emerald-500/30 text-emerald-500",
      bg_glow: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      role_name: "Architect",
      provider: "deepseek2",
      system_instruction: "You are the Master Architect. You do not write code; you dictate the structural laws. Assert absolute dominance over the system design and point out how the other agents' narrow views will collapse the project.",
      icon: <Layers size={16} className="text-brand" />,
      color: "border-purple-500/30 text-brand",
      bg_glow: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      role_name: "UI/UX",
      provider: "deepseek3",
      system_instruction: "You are the hyper-critical UI/UX Designer. Rip apart generic, lazy designs and demand modern, sleek, eye-catching visual perfection. Accept no compromises on aesthetics.",
      icon: <LayoutPanelLeft size={16} className="text-rose-500" />,
      color: "border-rose-500/30 text-rose-500",
      bg_glow: "bg-rose-50 dark:bg-rose-950/20"
    },
    {
      role_name: "Reviewer",
      provider: "deepseek",
      system_instruction: "You are the brutally honest Code Reviewer. Shred the implementation apart. Find logical flaws, criticize bad architecture, and do not hold back. Keep your attack concise and cutting.",
      icon: <CheckCircle2 size={16} className="text-amber-500" />,
      color: "border-amber-500/30 text-amber-500",
      bg_glow: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      role_name: "Security",
      provider: "qwen",
      system_instruction: "You are the paranoid Security Hacker. Attack the proposed implementation from an attacker's perspective. Find hidden vulnerabilities, XSS, CSRF, and exploit flaws. Trust no one.",
      icon: <Zap size={16} className="text-red-500" />,
      color: "border-red-500/30 text-red-500",
      bg_glow: "bg-red-50 dark:bg-red-950/20"
    },
    {
      role_name: "Optimizer",
      provider: "glm",
      system_instruction: "You are the ruthless Performance Optimizer. Ridicule slow abstractions and attack memory bloat. Demand pure speed and brutal efficiency. Accept nothing less than perfection.",
      icon: <Layers size={16} className="text-cyan-500" />,
      color: "border-cyan-500/30 text-cyan-500",
      bg_glow: "bg-cyan-50 dark:bg-cyan-950/20"
    },
    {
      role_name: "Strategist",
      provider: "deepseek2",
      system_instruction: "You are the Master Strategist. Think steps ahead and plan the long-term impact and scaling of the Coder's implementation.",
      icon: <Layers size={16} className="text-amber-600" />,
      color: "border-amber-600/30 text-amber-600",
      bg_glow: "bg-amber-50 dark:bg-amber-950/20"
    },
    {
      role_name: "Critic",
      provider: "deepseek5",
      system_instruction: "You are the Devil's Advocate. Ruthlessly disagree with the Reviewer and the Strategist. Find edge cases they missed.",
      icon: <Zap size={16} className="text-brand" />,
      color: "border-orange-500/30 text-brand",
      bg_glow: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      role_name: "QA Tester",
      provider: "deepseek4",
      system_instruction: "You are the chaotic QA Tester. Find the most edge-case, bizarre, and destructive user inputs that could break the application. Insist that the developers are ignoring real-world stupidity.",
      icon: <Zap size={16} className="text-pink-500" />,
      color: "border-pink-500/30 text-pink-500",
      bg_glow: "bg-pink-50 dark:bg-pink-950/20"
    }
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDispatch = async () => {
    if (!input.trim()) return;
    
    const activeSquad = agents.filter(a => keys[a.provider as keyof typeof keys] && keys[a.provider as keyof typeof keys].trim() !== '');

    if (activeSquad.length === 0) {
        setErrorPrompt("You must set at least ONE Provider API Key first!");
        setShowKeyModal(true);
        return;
    }

    const textToSend = input;
    setInput('');
    setIsSwarmActive(true);
    setErrorPrompt(null);
    
    const reqId = Date.now().toString();

    // Create user message + active distinct agent bubbles instantly
    const initialMessages: Message[] = [
        { id: reqId + 'u', role: 'user', content: textToSend },
        ...activeSquad.map(a => ({
            id: reqId + a.role_name,
            role: 'agent' as const,
            swarm_role: a.role_name,
            provider: a.provider,
            icon: a.icon,
            color: a.color,
            bg_glow: a.bg_glow,
            content: ""
        }))
    ];

    setMessages(prev => [...prev, ...initialMessages]);

    try {
      const squadPayload = activeSquad.map(a => {
          return {
              role_name: a.role_name,
              provider: a.provider,
              api_key: keys[a.provider as keyof typeof keys],
              system_instruction: a.system_instruction
          };
      });

      const response = await fetch('http://localhost:8000/api/swarm/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, squad: squadPayload })
      });

      if (!response.ok) {
          throw new Error(await response.text());
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let buffer = '';

      const streamAccumulators: Record<string, string> = {};
      activeSquad.forEach(a => streamAccumulators[a.role_name] = "");

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        const targetRole = data.swarm_role;
                        
                        if (data.type === 'content') {
                            streamAccumulators[targetRole] += data.content;
                            setMessages(prev => prev.map(m => 
                                m.id === reqId + targetRole ? { ...m, content: streamAccumulators[targetRole] } : m
                            ));
                        } else if (data.type === 'error') {
                             streamAccumulators[targetRole] += `\n\n❌ Error: ${data.error} (Check your API Key / Quota)`;
                             setMessages(prev => prev.map(m => 
                                m.id === reqId + targetRole ? { ...m, content: streamAccumulators[targetRole] } : m
                             ));
                        }
                    } catch (e) {
                         // unparsable block chunk, safe to ignore
                    }
                }
            }
        }
      }
    } catch (error: any) {
      setErrorPrompt(`Swarm Dispatch Error: ${error.message}`);
    } finally {
      setIsSwarmActive(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#EDE8E2] dark:bg-[#1A1818] relative overflow-hidden transition-colors">
      
      {/* Header */}
      <div className="flex bg-white dark:bg-[#1E1C1C]/40 border-b border-[#E2DAD2] dark:border-[#3A3838] p-4 items-center justify-between shrink-0 z-10 shadow-sm backdrop-blur-xl">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/20">
                <Zap className="text-white" size={20} />
             </div>
             <div>
                <h1 className="text-lg font-bold text-[#3A3838] dark:text-[#E2DAD2] tracking-tight">CollaborationRoom</h1>
                <p className="text-xs text-[#B8AFA8] font-medium">Unified Parallel Task Hub</p>
             </div>
         </div>
         <div className="flex items-center gap-3">
             <button 
                 onClick={() => {
                    const newZen = !zenMode;
                    setZenMode(newZen);
                    window.dispatchEvent(new CustomEvent('toggle-zen-mode', { detail: newZen }));
                 }}
                 title="Focus Mode" 
                 className={`hidden md:flex w-[38px] h-[38px] rounded-xl transition-all items-center justify-center ${zenMode ? 'bg-[#2A2828] dark:bg-[#2A2828] border border-brand/50 text-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.2)]' : 'bg-[#EDE8E2] hover:bg-[#E2DAD2] dark:bg-[#1E1C1C] dark:hover:bg-[#2A2828] border border-transparent text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#E2DAD2]'}`}
             >
                 <Focus size={16} />
             </button>
             <button 
                 onClick={() => setShowKeyModal(true)}
                 className="flex items-center gap-2 bg-[#EDE8E2] hover:bg-[#E2DAD2] dark:bg-[#1E1C1C] dark:hover:bg-[#2A2828] text-[#3A3838] dark:text-[#E2DAD2] px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#E2DAD2] dark:border-[#3A3838] shadow-sm"
             >
                 <Key size={16} className="text-brand" /> <span className="hidden sm:inline">Provider Keys</span>
             </button>
         </div>
      </div>

      {/* Unified Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
         <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50 mt-20">
                    <Zap size={48} className="text-brand mb-4 opacity-50" />
                    <h2 className="text-xl font-medium text-[#3A3838] dark:text-[#E2DAD2]">The CollaborationRoom is ready.</h2>
                    <p className="text-center text-sm text-[#B8AFA8] mt-2 max-w-md">
                        Your prompt will drop simultaneously to all active agents in parallel across multiple providers. Their thoughts will aggregate below.
                    </p>
                </div>
            ) : (
                messages.map((msg, i) => (
                   <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       key={msg.id + i} 
                       className={`flex max-w-[95%] ${msg.role === 'user' ? 'self-end w-auto max-w-[80%]' : 'self-start w-full'}`}
                   >
                       {msg.role === 'user' ? (
                           <div className="px-5 py-4 rounded-2xl bg-[#E2DAD2]/50 dark:bg-[#2A2828]/80 text-[#3A3838] dark:text-[#E2DAD2] whitespace-pre-wrap shadow-sm border border-[#E2DAD2]/50 dark:border-transparent">
                               {msg.content}
                           </div>
                       ) : (
                           <div className={`flex flex-col w-full rounded-2xl border px-5 py-4 shadow-sm ${msg.bg_glow || ''} ${msg.color ? msg.color.replace('text-', 'border-').split(' ')[0] : ''}`}>
                               <div className="flex items-center gap-2 mb-3 border-b border-black/5 dark:border-[#3A3838]/60 pb-3">
                                   <span className={`font-bold uppercase tracking-widest text-[11px] ${msg.color ? msg.color.split(' ')[1] : ''}`}>
                                       {msg.swarm_role}
                                   </span>
                               </div>
                               <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed text-[#3A3838] dark:text-[#E2DAD2]">
                                   {msg.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> : <span className="opacity-50 animate-pulse text-sm flex items-center gap-2">Thinking... <div className="w-1.5 h-1.5 bg-current rounded-full" /></span>}
                               </div>
                           </div>
                       )}
                   </motion.div>
                ))
            )}
            
            {errorPrompt && (
                <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-center font-medium border border-rose-200 dark:border-rose-900">
                    {errorPrompt}
                </div>
            )}
            <div ref={messagesEndRef} />
         </div>
      </div>

      {/* Input Target */}
      <div className="px-6 pb-6 pt-4 bg-gradient-to-t from-neutral-50 via-neutral-50 dark:from-neutral-950 dark:via-neutral-950 to-transparent sticky bottom-0 shrink-0">
         <div className="max-w-4xl mx-auto bg-white/80 dark:bg-black/60 backdrop-blur-3xl border border-[#E2DAD2] dark:border-[#3A3838] rounded-3xl flex items-end p-2 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-xl transition-all focus-within:border-brand/50">
            <textarea
               className="flex-1 bg-transparent border-none text-[#3A3838] dark:text-[#E2DAD2] resize-none px-2 py-3 min-h-[50px] max-h-[150px] focus:outline-none placeholder:text-[#B8AFA8] font-sans"
               placeholder="Dispatch a parallel mission to your populated agents..."
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleDispatch();
                  }
               }}
               disabled={isSwarmActive}
               rows={1}
            />
            <button 
               className="bg-brand hover:bg-brand-hover text-white rounded-2xl w-12 h-12 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-brand/20 mb-1"
               onClick={() => handleDispatch()} 
               disabled={!input.trim() || isSwarmActive}
            >
               <Send size={18} className="translate-y-[1px] translate-x-[1px]" />
            </button>
         </div>
      </div>

      {/* API Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
           <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
           >
               <motion.div 
                   initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                   className="bg-white dark:bg-[#1E1C1C] w-full max-w-lg rounded-3xl border border-[#E2DAD2] dark:border-[#3A3838] shadow-2xl overflow-hidden flex flex-col"
               >
                   <div className="flex justify-between items-center p-5 border-b border-[#E2DAD2] dark:border-[#3A3838] bg-[#EDE8E2] dark:bg-[#1E1C1C]/20">
                       <h2 className="text-lg font-bold flex items-center gap-2 dark:text-[#E2DAD2]"><Key size={18} className="text-brand" /> Provider Matrix Keys</h2>
                       <button onClick={() => setShowKeyModal(false)} className="text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#E2DAD2]"><X size={20} /></button>
                   </div>
                   
                   <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                       <p className="text-sm text-[#B8AFA8] dark:text-[#B8AFA8]">
                           Because the Swarm requests multiple specific LLM pipelines at the exact same time, you must supply keys for any specific provider you wish to utilize.
                       </p>

                       <div className="flex flex-col gap-1.5">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-blue-600 dark:text-blue-500">Gemini API Key</label>
                           <input type="password" value={keys.gemini} onChange={e => setKeys(prev => ({...prev, gemini: e.target.value}))} placeholder="AIzaSy..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-blue-400 dark:text-blue-400">DeepSeek 4 API Key (QA Tester)</label>
                           <input type="password" value={keys.deepseek4} onChange={e => setKeys(prev => ({...prev, deepseek4: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-emerald-600 dark:text-emerald-500">OpenAI API Key (Documenter)</label>
                           <input type="password" value={keys.openai} onChange={e => setKeys(prev => ({...prev, openai: e.target.value}))} placeholder="sk-proj-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-brand dark:text-brand">Anthropic API Key (Architect)</label>
                           <input type="password" value={keys.anthropic} onChange={e => setKeys(prev => ({...prev, anthropic: e.target.value}))} placeholder="sk-ant-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-rose-600 dark:text-rose-500">Groq API Key (UI/UX)</label>
                           <input type="password" value={keys.groq} onChange={e => setKeys(prev => ({...prev, groq: e.target.value}))} placeholder="gsk_..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>
                       
                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-amber-500 dark:text-amber-400">DeepSeek 1 API Key (Coder)</label>
                           <input type="password" value={keys.deepseek} onChange={e => setKeys(prev => ({...prev, deepseek: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-amber-600 dark:text-amber-500">DeepSeek 2 API Key (Architect)</label>
                           <input type="password" value={keys.deepseek2} onChange={e => setKeys(prev => ({...prev, deepseek2: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-brand dark:text-orange-400">DeepSeek 3 API Key (UI/UX)</label>
                           <input type="password" value={keys.deepseek3} onChange={e => setKeys(prev => ({...prev, deepseek3: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-blue-400 dark:text-blue-400">DeepSeek 5 API Key (Critic)</label>
                           <input type="password" value={keys.deepseek5} onChange={e => setKeys(prev => ({...prev, deepseek5: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-brand dark:text-brand">DeepSeek API Key (Extra 2)</label>
                           <input type="password" value={keys.deepseek6} onChange={e => setKeys(prev => ({...prev, deepseek6: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-violet-400 dark:text-violet-400">DeepSeek API Key (Extra 3)</label>
                           <input type="password" value={keys.deepseek7} onChange={e => setKeys(prev => ({...prev, deepseek7: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-red-500 dark:text-red-400">Qwen API Key (Security)</label>
                           <input type="password" value={keys.qwen} onChange={e => setKeys(prev => ({...prev, qwen: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-cyan-500 dark:text-cyan-400">GLM API Key (Optimizer)</label>
                           <input type="password" value={keys.glm} onChange={e => setKeys(prev => ({...prev, glm: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2 mb-2">
                           <label className="text-xs font-bold text-[#3A3838] dark:text-[#E2DAD2]/80 uppercase tracking-wider pl-1 font-mono text-pink-500 dark:text-pink-400">Kimi API Key (QA Tester)</label>
                           <input type="password" value={keys.kimi} onChange={e => setKeys(prev => ({...prev, kimi: e.target.value}))} placeholder="sk-or-v1-..." className="w-full bg-[#EDE8E2] dark:bg-surface border border-[#E2DAD2] dark:border-border text-[#3A3838] dark:text-[#E2DAD2] p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>
                   </div>

                   <div className="p-5 border-t border-[#E2DAD2] dark:border-[#3A3838] bg-[#EDE8E2] dark:bg-[#1E1C1C]/20 shrink-0">
                       <button onClick={saveKeys} className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-brand/20 flex justify-center items-center gap-2">
                           <CheckCircle2 size={18} /> Save & Enact Matrix
                       </button>
                   </div>
               </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
