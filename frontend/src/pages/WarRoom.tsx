import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Code, FileText, Layers, LayoutPanelLeft, Key, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'agent';
  swarm_role?: string;
  provider?: string;
  icon?: JSX.Element;
  color?: string;
  content: string;
}

interface SwarmQuadrant {
  role_name: string;
  provider: string;
  system_instruction: string;
  icon: JSX.Element;
  color: string;
  bg_glow: string;
}

export default function WarRoom() {
  const [input, setInput] = useState('');
  const [isSwarmActive, setIsSwarmActive] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Swarm Provider Keys
  const [keys, setKeys] = useState(() => ({
      gemini: localStorage.getItem('openzess_api_key') || '', // Standard Master Key defaults to Gemini usually
      openai: localStorage.getItem('openzess_openai_key') || '',
      anthropic: localStorage.getItem('openzess_anthropic_key') || '',
      groq: localStorage.getItem('openzess_groq_key') || '',
      deepseek: localStorage.getItem('openzess_deepseek_key') || ''
  }));

  const saveKeys = () => {
      localStorage.setItem('openzess_api_key', keys.gemini);
      localStorage.setItem('openzess_openai_key', keys.openai);
      localStorage.setItem('openzess_anthropic_key', keys.anthropic);
      localStorage.setItem('openzess_groq_key', keys.groq);
      localStorage.setItem('openzess_deepseek_key', keys.deepseek);
      setShowKeyModal(false);
      setErrorPrompt(null);
  };

  const agents: SwarmQuadrant[] = [
    {
      role_name: "Coder",
      provider: "gemini",
      system_instruction: "You are the Coder Agent. Write pure, optimized, elegant code. Do not write extensive explanations.",
      icon: <Code size={16} className="text-blue-500" />,
      color: "border-blue-500/30 text-blue-500",
      bg_glow: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      role_name: "Documenter",
      provider: "openai",
      system_instruction: "You are the Documentation Agent. Write extensive, highly readable documentation, JSDoc comments, and README instructions.",
      icon: <FileText size={16} className="text-emerald-500" />,
      color: "border-emerald-500/30 text-emerald-500",
      bg_glow: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      role_name: "Architect",
      provider: "anthropic",
      system_instruction: "You are the Architect Agent. Do not write code. Think deeply about the implementation, file structure, edge cases, and scaling.",
      icon: <Layers size={16} className="text-purple-500" />,
      color: "border-purple-500/30 text-purple-500",
      bg_glow: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      role_name: "UI/UX",
      provider: "groq",
      system_instruction: "You are the UI/UX Agent. Analyze purely from a UI/UX standpoint. Suggest color palettes, hover effects, and animations.",
      icon: <LayoutPanelLeft size={16} className="text-rose-500" />,
      color: "border-rose-500/30 text-rose-500",
      bg_glow: "bg-rose-50 dark:bg-rose-950/20"
    }
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDispatch = async () => {
    if (!input.trim()) return;
    
    // Key Check
    if (!keys.gemini && !keys.openai && !keys.anthropic && !keys.groq) {
        setErrorPrompt("You must set Provider API Keys first!");
        setShowKeyModal(true);
        return;
    }

    const textToSend = input;
    setInput('');
    setIsSwarmActive(true);
    setErrorPrompt(null);
    
    const reqId = Date.now().toString();

    // Create user message + 4 distinct agent bubbles instantly
    const initialMessages: Message[] = [
        { id: reqId + 'u', role: 'user', content: textToSend },
        ...agents.map(a => ({
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
      const squadPayload = agents.map(a => {
          let agentKey = keys.gemini;
          if (a.provider === 'openai') agentKey = keys.openai;
          if (a.provider === 'anthropic') agentKey = keys.anthropic;
          if (a.provider === 'groq') agentKey = keys.groq;
          
          return {
              role_name: a.role_name,
              provider: a.provider,
              api_key: agentKey,
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

      const streamAccumulators: Record<string, string> = {
         "Coder": "", "Documenter": "", "Architect": "", "UI/UX": ""
      };

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\\n\\n');
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
                             streamAccumulators[targetRole] += `\\n\\n❌ Error: ${data.error} (Check your API Key / Quota)`;
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
    <div className="flex flex-col h-full w-full bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden transition-colors">
      
      {/* Header */}
      <div className="flex bg-white dark:bg-black/40 border-b border-neutral-200 dark:border-neutral-800 p-4 items-center justify-between shrink-0 z-10 shadow-sm backdrop-blur-xl">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/20">
                <Zap className="text-white" size={20} />
             </div>
             <div>
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Group Swarm Chat</h1>
                <p className="text-xs text-neutral-500 font-medium">Unified Parallel Task Hub</p>
             </div>
         </div>
         <button 
             onClick={() => setShowKeyModal(true)}
             className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-neutral-200 dark:border-neutral-700 shadow-sm"
         >
             <Key size={16} className="text-brand" /> Provider Keys
         </button>
      </div>

      {/* Unified Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
         <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50 mt-20">
                    <Zap size={48} className="text-brand mb-4 opacity-50" />
                    <h2 className="text-xl font-medium text-neutral-800 dark:text-neutral-200">The War Room is ready.</h2>
                    <p className="text-center text-sm text-neutral-500 mt-2 max-w-md">
                        Your prompt will drop simultaneously to 4 agents in parallel across multiple providers. Their thoughts will aggregate below.
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
                           <div className="px-5 py-4 rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap shadow-sm border border-neutral-300/50 dark:border-transparent">
                               {msg.content}
                           </div>
                       ) : (
                           <div className={`flex flex-col w-full rounded-2xl border px-5 py-4 shadow-sm ${msg.bg_glow} ${msg.color.replace('text-', 'border-').split(' ')[0]}`}>
                               <div className="flex items-center gap-2 mb-3 border-b border-black/5 dark:border-white/5 pb-3">
                                   <div className="bg-white dark:bg-black/40 p-1.5 rounded-md shadow-sm">
                                       {msg.icon}
                                   </div>
                                   <span className={`font-bold uppercase tracking-widest text-[11px] ${msg.color.split(' ')[1]}`}>
                                       {msg.swarm_role}
                                   </span>
                                   <span className="text-[10px] font-mono opacity-50 ml-auto uppercase">{msg.provider}</span>
                               </div>
                               <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed text-neutral-800 dark:text-neutral-200">
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
         <div className="max-w-4xl mx-auto bg-white/80 dark:bg-black/60 backdrop-blur-3xl border border-neutral-300 dark:border-white/10 rounded-3xl flex items-end p-2 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-xl transition-all focus-within:border-brand/50">
            <textarea
               className="flex-1 bg-transparent border-none text-neutral-900 dark:text-neutral-200 resize-none px-2 py-3 min-h-[50px] max-h-[150px] focus:outline-none placeholder:text-neutral-400 font-sans"
               placeholder="Dispatch a combined parallel mission to all 4 agents..."
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
                   className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
               >
                   <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/20">
                       <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white"><Key size={18} className="text-brand" /> Provider Matrix Keys</h2>
                       <button onClick={() => setShowKeyModal(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"><X size={20} /></button>
                   </div>
                   
                   <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                       <p className="text-sm text-neutral-500 dark:text-neutral-400">
                           Because the Swarm requests multiple specific LLM pipelines at the exact same time, you must supply keys for any specific provider you wish to utilize.
                       </p>

                       <div className="flex flex-col gap-1.5">
                           <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider pl-1 font-mono text-blue-600 dark:text-blue-500">Gemini API Key (Coder)</label>
                           <input type="password" value={keys.gemini} onChange={e => setKeys(prev => ({...prev, gemini: e.target.value}))} placeholder="AIzaSy..." className="w-full bg-neutral-100 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider pl-1 font-mono text-emerald-600 dark:text-emerald-500">OpenAI API Key (Documenter)</label>
                           <input type="password" value={keys.openai} onChange={e => setKeys(prev => ({...prev, openai: e.target.value}))} placeholder="sk-proj-..." className="w-full bg-neutral-100 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider pl-1 font-mono text-purple-600 dark:text-purple-500">Anthropic API Key (Architect)</label>
                           <input type="password" value={keys.anthropic} onChange={e => setKeys(prev => ({...prev, anthropic: e.target.value}))} placeholder="sk-ant-..." className="w-full bg-neutral-100 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>

                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider pl-1 font-mono text-rose-600 dark:text-rose-500">Groq API Key (UI/UX)</label>
                           <input type="password" value={keys.groq} onChange={e => setKeys(prev => ({...prev, groq: e.target.value}))} placeholder="gsk_..." className="w-full bg-neutral-100 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>
                       
                       <div className="flex flex-col gap-1.5 mt-2">
                           <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider pl-1 font-mono text-amber-500 dark:text-amber-400">DeepSeek API Key (Optional Agent)</label>
                           <input type="password" value={keys.deepseek} onChange={e => setKeys(prev => ({...prev, deepseek: e.target.value}))} placeholder="sk-..." className="w-full bg-neutral-100 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand font-mono text-sm" />
                       </div>
                   </div>

                   <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/20 shrink-0">
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
