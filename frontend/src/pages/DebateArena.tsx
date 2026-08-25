import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, BrainCircuit, CheckCircle2, ShieldAlert, Cpu, Settings2, RefreshCw, Swords } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface DebateMessage {
  id: string;
  role: 'user' | 'agent' | 'system' | 'judge';
  agentName?: string;
  content: string;
  round?: number;
  phase?: string;
  isComplete?: boolean;
}

interface AgentConfig {
    id: string;
    role_name: string;
    provider: string;
    system_instruction: string;
    icon: React.ReactNode;
    color: string;
    active: boolean;
}

const DEFAULT_AGENTS: AgentConfig[] = [
    {
        id: 'strategist',
        role_name: 'Lead Strategist',
        provider: 'gemini',
        system_instruction: 'You are the Lead Strategist. Your goal is to propose the main architecture or solution and defend it logically.',
        icon: <BrainCircuit size={18} />,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        active: true
    },
    {
        id: 'critic',
        role_name: 'Devil\'s Advocate',
        provider: 'openai',
        system_instruction: 'You are the Devil\'s Advocate. Your job is to aggressively (but professionally) find flaws, edge cases, and security vulnerabilities in other agents\' proposals.',
        icon: <ShieldAlert size={18} />,
        color: 'text-red-500 bg-red-500/10 border-red-500/20',
        active: true
    },
    {
        id: 'optimizer',
        role_name: 'Performance Optimizer',
        provider: 'anthropic',
        system_instruction: 'You are the Performance Optimizer. You focus on efficiency, scaling, cost, and speed. You suggest improvements to make solutions faster and cheaper.',
        icon: <Cpu size={18} />,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        active: false
    }
];

export default function DebateArena() {
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [inputPrompt, setInputPrompt] = useState('');
    const [isDebating, setIsDebating] = useState(false);
    const [maxRounds, setMaxRounds] = useState(2);
    const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
    const [showSettings, setShowSettings] = useState(false);
    
    // Status tracking
    const [_currentRound, setCurrentRound] = useState(0);
    const [currentSpeaker, setCurrentSpeaker] = useState('');
    const [_debatePhase, setDebatePhase] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentSpeaker, isDebating]);

    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
    };

    const startDebate = async () => {
        if (!inputPrompt.trim() || isDebating) return;
        
        const activeAgents = agents.filter(a => a.active);
        if (activeAgents.length < 2) {
            alert("Please enable at least 2 agents for a debate.");
            return;
        }

        setIsDebating(true);
        setMessages([{ id: Date.now().toString(), role: 'user', content: inputPrompt }]);
        setInputPrompt('');
        setCurrentRound(0);
        setCurrentSpeaker('');
        setDebatePhase('Initializing...');

        try {
            // Get keys from local storage (or use default if local Ollama)
            const getProviderKey = (provider: string) => {
                if (provider === 'ollama') return '';
                if (provider === 'gemini') return localStorage.getItem('openzess_api_key') || '';
                // Fallback attempt to get specific keys if they exist in some other format, otherwise use main key
                return localStorage.getItem('openzess_api_key') || '';
            };

            const squadConfig = activeAgents.map(a => ({
                role_name: a.role_name,
                provider: a.provider,
                api_key: getProviderKey(a.provider),
                system_instruction: a.system_instruction
            }));

            const judgeApiKey = localStorage.getItem('openzess_api_key') || '';

            const response = await fetch('http://localhost:8000/api/warroom/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputPrompt,
                    squad: squadConfig,
                    max_rounds: maxRounds,
                    judge_provider: 'gemini',
                    judge_api_key: judgeApiKey
                })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            // Map to track current message blocks
            const agentMessageMap: Record<string, string> = {};
            let currentMessageId = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || '';

                for (const part of parts) {
                    if (part.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(part.slice(6));
                            
                            if (data.type === 'round_start') {
                                setCurrentRound(data.round);
                                setDebatePhase(data.phase.toUpperCase());
                                setMessages(prev => [...prev, {
                                    id: `system-round-${data.round}`,
                                    role: 'system',
                                    content: `--- Round ${data.round} : ${data.phase.toUpperCase()} ---`
                                }]);
                            }
                            else if (data.type === 'agent_start' || data.type === 'judge_start') {
                                const role = data.swarm_role || 'Judge';
                                setCurrentSpeaker(role);
                                currentMessageId = `msg-${Date.now()}-${role}`;
                                agentMessageMap[currentMessageId] = '';
                                
                                setMessages(prev => [...prev, {
                                    id: currentMessageId,
                                    role: data.is_judge ? 'judge' : 'agent',
                                    agentName: role,
                                    content: '',
                                    round: data.round,
                                    isComplete: false
                                }]);
                            }
                            else if (data.type === 'content') {
                                agentMessageMap[currentMessageId] += data.content;
                                setMessages(prev => prev.map(m => 
                                    m.id === currentMessageId 
                                        ? { ...m, content: agentMessageMap[currentMessageId] }
                                        : m
                                ));
                            }
                            else if (data.type === 'agent_done' || data.type === 'judge_done') {
                                setMessages(prev => prev.map(m => 
                                    m.id === currentMessageId ? { ...m, isComplete: true } : m
                                ));
                                setCurrentSpeaker('');
                            }
                            else if (data.type === 'consensus') {
                                setMessages(prev => [...prev, {
                                    id: `system-consensus-${Date.now()}`,
                                    role: 'system',
                                    content: `✅ [CONSENSUS REACHED] by ${data.swarm_role}`
                                }]);
                            }
                            else if (data.type === 'error') {
                                setMessages(prev => [...prev, {
                                    id: `error-${Date.now()}`,
                                    role: 'system',
                                    content: `❌ Error from ${data.swarm_role}: ${data.error}`
                                }]);
                            }
                            
                        } catch (e) {
                            console.error("Error parsing SSE chunk:", e);
                        }
                    }
                }
            }
            
        } catch (error: any) {
            console.error("Debate Error:", error);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'system',
                content: `Error connecting to debate server: ${error.message}`
            }]);
        } finally {
            setIsDebating(false);
            setCurrentSpeaker('');
            setDebatePhase('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            startDebate();
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#F5F0EB] dark:bg-[#1E1C1C] text-[#3A3838] dark:text-[#E2DAD2]">
            {/* Top Bar */}
            <div className="h-[60px] shrink-0 border-b border-[#E2DAD2] dark:border-[#3A3838] px-6 flex items-center justify-between bg-white/50 dark:bg-[#1A1818]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                        <Swords size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">Warroom Debate</h1>
                        <p className="text-xs text-[#B8AFA8] mt-0.5">Multi-agent consensus engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isDebating && currentSpeaker && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold animate-pulse">
                            <RefreshCw size={12} className="animate-spin" />
                            {currentSpeaker} Speaking...
                        </div>
                    )}
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-lg hover:bg-[#E2DAD2] dark:hover:bg-[#3A3838] transition-colors"
                    >
                        <Settings2 size={18} />
                    </button>
                </div>
            </div>

            {/* Settings Dropdown Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-[#E2DAD2] dark:border-[#3A3838] bg-[#F5F0EB]/80 dark:bg-[#1A1818]/80 backdrop-blur-md overflow-hidden"
                    >
                        <div className="p-6 max-w-4xl mx-auto flex gap-8">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-[#A89080]">Participants</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {agents.map(agent => (
                                        <button 
                                            key={agent.id}
                                            onClick={() => toggleAgent(agent.id)}
                                            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                                                agent.active 
                                                    ? 'bg-white dark:bg-[#2A2828] border-brand/50 shadow-sm' 
                                                    : 'bg-transparent border-[#E2DAD2] dark:border-[#3A3838] opacity-60 grayscale'
                                            }`}
                                        >
                                            <div className={`mt-0.5 p-1.5 rounded-md ${agent.color}`}>
                                                {agent.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{agent.role_name}</div>
                                                <div className="text-xs text-[#B8AFA8] mt-1 line-clamp-2">{agent.system_instruction}</div>
                                            </div>
                                            <div className="ml-auto">
                                                {agent.active && <CheckCircle2 size={16} className="text-brand" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="w-[250px] shrink-0 border-l border-[#E2DAD2] dark:border-[#3A3838] pl-8">
                                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-[#A89080]">Debate Rules</h3>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-[#B8AFA8] block mb-1">Max Rounds</label>
                                        <input 
                                            type="range" 
                                            min="1" max="5" 
                                            value={maxRounds} 
                                            onChange={e => setMaxRounds(parseInt(e.target.value))}
                                            className="w-full accent-brand"
                                        />
                                        <div className="text-right text-xs font-bold mt-1">{maxRounds} Rounds</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {messages.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="max-w-md text-center">
                            <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                                <Swords size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Initiate Warroom</h2>
                            <p className="text-[#B8AFA8] text-sm leading-relaxed mb-6">
                                Enter a complex problem below. The selected agents will debate it sequentially, reviewing each other's arguments, until consensus is reached or max rounds hit. Finally, the Judge will synthesize a verdict.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {['"Design a scalable microservices architecture"', '"Is Rust better than Go for web servers?"', '"How to solve global warming"'].map(prompt => (
                                    <button 
                                        key={prompt}
                                        onClick={() => setInputPrompt(prompt.replace(/"/g, ''))}
                                        className="px-3 py-1.5 rounded-full border border-[#E2DAD2] dark:border-[#3A3838] text-xs font-medium hover:bg-[#E2DAD2] dark:hover:bg-[#3A3838] transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col gap-6">
                        {messages.map((msg) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role !== 'user' && msg.role !== 'system' && (
                                    <div className="shrink-0 mt-1">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm
                                            ${msg.role === 'judge' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : 'bg-white dark:bg-[#2A2828] border border-[#E2DAD2] dark:border-[#3A3838]'}
                                        `}>
                                            {msg.role === 'judge' ? <CheckCircle2 size={16} /> : <Bot size={16} />}
                                        </div>
                                    </div>
                                )}
                                
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                                    {msg.role !== 'user' && msg.role !== 'system' && (
                                        <div className="text-xs font-bold text-[#A89080] mb-1.5 flex items-center gap-2">
                                            {msg.agentName}
                                            {msg.round ? <span className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[10px] font-mono">Round {msg.round}</span> : null}
                                            {!msg.isComplete && <span className="flex gap-0.5"><span className="w-1 h-1 rounded-full bg-brand animate-bounce"></span><span className="w-1 h-1 rounded-full bg-brand animate-bounce" style={{animationDelay: '0.1s'}}></span><span className="w-1 h-1 rounded-full bg-brand animate-bounce" style={{animationDelay: '0.2s'}}></span></span>}
                                        </div>
                                    )}

                                    {msg.role === 'system' ? (
                                        <div className="w-full text-center py-4 text-xs font-bold tracking-widest uppercase text-[#B8AFA8] border-b border-[#E2DAD2] dark:border-[#3A3838] opacity-60">
                                            {msg.content}
                                        </div>
                                    ) : (
                                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                                            ${msg.role === 'user' 
                                                ? 'bg-[#3A3838] text-white rounded-br-sm' 
                                                : msg.role === 'judge'
                                                    ? 'bg-amber-50 dark:bg-amber-500/5 border border-amber-500/20 rounded-tl-sm'
                                                    : 'bg-white dark:bg-[#2A2828] border border-[#E2DAD2] dark:border-[#3A3838] rounded-tl-sm'
                                            }
                                        `}>
                                            {msg.role === 'user' ? (
                                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                            ) : (
                                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1E1C1C] prose-pre:border prose-pre:border-[#3A3838]">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-4 bg-white/80 dark:bg-[#1A1818]/80 backdrop-blur-xl border-t border-[#E2DAD2] dark:border-[#3A3838]">
                <div className="max-w-3xl mx-auto relative">
                    <textarea
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isDebating ? "Debate in progress..." : "Enter your topic for debate..."}
                        disabled={isDebating}
                        className="w-full bg-[#F5F0EB] dark:bg-[#2A2828] border border-[#E2DAD2] dark:border-[#3A3838] rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:border-brand/50 transition-all resize-none shadow-inner disabled:opacity-60"
                        rows={2}
                    />
                    <button
                        onClick={startDebate}
                        disabled={isDebating || !inputPrompt.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Send size={16} className="ml-1" />
                    </button>
                </div>
                <div className="text-center mt-2 text-[10px] text-[#B8AFA8] font-medium">
                    Agents will debate sequentially. Press Shift + Enter for new line.
                </div>
            </div>
        </div>
    );
}
