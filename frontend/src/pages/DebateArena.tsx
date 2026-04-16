import { useState, useRef, useEffect } from 'react';
import { Send, Swords, Box, Zap, Sparkles, Copy, CheckCircle2, Key, X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArenaModel {
    id: string;
    name: string;
    provider: string; // backend mapping key
    storageKey: string;
    icon: any;
    color: string;
    bgGlow: string;
}

const MODELS: ArenaModel[] = [
    {
        id: 'deepseek',
        name: 'DeepSeek (V3)',
        provider: 'deepseek',
        storageKey: 'openzess_deepseek_key',
        icon: <Zap size={20} className="text-fuchsia-500" />,
        color: 'border-fuchsia-500/30 text-fuchsia-500',
        bgGlow: 'bg-fuchsia-500/10'
    },
    {
        id: 'qwen',
        name: 'Qwen (Max)',
        provider: 'qwen',
        storageKey: 'openzess_qwen_key',
        icon: <Box size={20} className="text-cyan-500" />,
        color: 'border-cyan-500/30 text-cyan-500',
        bgGlow: 'bg-cyan-500/10'
    },
    {
        id: 'gemini',
        name: 'Gemini (Pro)',
        provider: 'gemini',
        storageKey: 'openzess_api_key', 
        icon: <Sparkles size={20} className="text-amber-500" />,
        color: 'border-amber-500/30 text-amber-500',
        bgGlow: 'bg-amber-500/10'
    }
];

export default function DebateArena() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [responses, setResponses] = useState<Record<string, string>>({
        deepseek: '', qwen: '', gemini: ''
    });
    const [statuses, setStatuses] = useState<Record<string, 'idle' | 'generating' | 'done' | 'error'>>({
        deepseek: 'idle', qwen: 'idle', gemini: 'idle'
    });
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showKeyModal, setShowKeyModal] = useState(false);
    
    // Warroom Provider Keys
    const [keys, setKeys] = useState(() => ({
        gemini: localStorage.getItem('openzess_api_key') || '', 
        openai: localStorage.getItem('openzess_openai_key') || '',
        anthropic: localStorage.getItem('openzess_anthropic_key') || '',
        groq: localStorage.getItem('openzess_groq_key') || '',
        deepseek: localStorage.getItem('openzess_deepseek_key') || '',
        deepseek2: localStorage.getItem('openzess_deepseek2_key') || '',
        deepseek3: localStorage.getItem('openzess_deepseek3_key') || '',
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
        localStorage.setItem('openzess_qwen_key', keys.qwen);
        localStorage.setItem('openzess_glm_key', keys.glm);
        localStorage.setItem('openzess_kimi_key', keys.kimi);
        setShowKeyModal(false);
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const fetchStream = async (model: ArenaModel, userPrompt: string) => {
        setStatuses(prev => ({...prev, [model.id]: 'generating'}));
        setResponses(prev => ({...prev, [model.id]: ''}));
        
        const apiKey = localStorage.getItem(model.storageKey);
        if (!apiKey) {
            setResponses(prev => ({...prev, [model.id]: `❌ Error: Missing API Key for ${model.name}. Please set it in Warroom keys.`}));
            setStatuses(prev => ({...prev, [model.id]: 'error'}));
            return;
        }
        
        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userPrompt,
                    api_key: apiKey,
                    provider: model.provider,
                    stream: true,
                    system_instruction: "You are competing in a head-to-head arena against other AI models. Give the absolute best, most direct, and perfectly formatted answer possible directly to the user."
                })
            });

            if (!response.ok) throw new Error("HTTP " + response.status);
            if (!response.body) throw new Error("No response body");
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';
            let done = false;
            
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
                                if (data.type === 'content') {
                                    fullText += data.content;
                                    setResponses(prev => ({...prev, [model.id]: fullText}));
                                }
                            } catch(e) {}
                        }
                    }
                }
            }
            setStatuses(prev => ({...prev, [model.id]: 'done'}));
        } catch(err: any) {
            setResponses(prev => ({...prev, [model.id]: `❌ Error: ${err.message}`}));
            setStatuses(prev => ({...prev, [model.id]: 'error'}));
        }
    };

    const handleFight = async () => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        
        // Execute all 3 fetches completely in parallel
        await Promise.all(MODELS.map(m => fetchStream(m, prompt)));
        
        setIsLoading(false);
    };

    const hasStarted = Object.values(statuses).some(s => s !== 'idle');

    return (
        <div className="flex flex-col h-full w-full bg-neutral-100 dark:bg-black/90 transition-colors overflow-hidden relative">
            {/* Header Area */}
            <div className="shrink-0 p-8 pb-4 z-10 bg-gradient-to-b from-white to-transparent dark:from-black dark:to-transparent flex flex-col relative">
                
                <button 
                  onClick={() => setShowKeyModal(true)}
                  className="absolute top-8 right-8 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 dark:bg-white/10 hover:bg-white/10 dark:hover:bg-white/20 border border-white/10 rounded-xl text-neutral-600 dark:text-neutral-300 transition-all font-medium text-sm backdrop-blur-md"
                >
                  <Key size={16} /> 
                  <span className="hidden sm:inline">Provider Keys</span>
                </button>
                
                <div className="flex flex-col items-center max-w-4xl mx-auto text-center mb-8 mt-2">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.3)] mb-4"
                    >
                        <Swords size={32} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">Warroom Debate</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">Head-to-Head Parallel Generation. You are the judge.</p>
                </div>
                
                {/* Prompt bar */}
                <div className="w-full max-w-5xl mx-auto bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-3xl flex items-end p-2.5 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all focus-within:border-brand/40">
                    <textarea
                        className="flex-1 bg-transparent border-none text-neutral-900 dark:text-neutral-200 text-base resize-none px-4 py-4 min-h-[60px] max-h-[250px] focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-sans leading-relaxed"
                        placeholder="Drop a complex problem here, and watch them race to solve it..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleFight();
                            }
                        }}
                        disabled={isLoading}
                        rows={prompt.split('\n').length > 1 ? Math.min(prompt.split('\n').length, 8) : 1}
                    />
                    <button 
                        className="bg-brand hover:bg-brand-hover text-white rounded-2xl w-14 h-14 shrink-0 flex items-center justify-center transition-all disabled:opacity-30 shadow-lg shadow-brand/20 active:scale-95 mb-1 mr-1"
                        onClick={handleFight} 
                        disabled={!prompt.trim() || isLoading}
                    >
                        <Send size={20} className="translate-y-[1px] translate-x-[1px]" />
                    </button>
                </div>
            </div>

            {/* Battle Arena Columns */}
            <div className="flex-1 w-full max-w-[1600px] mx-auto px-6 pb-6 pt-2 flex gap-6 overflow-hidden">
                {!hasStarted ? (
                    <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-40">
                        <Swords size={200} className="text-neutral-200 dark:text-neutral-800" />
                    </div>
                ) : (
                    <>
                        {MODELS.map((model) => (
                            <div key={model.id} className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl overflow-hidden shadow-sm backdrop-blur-sm">
                                {/* Column Header */}
                                <div className={`px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between ${model.bgGlow} shrink-0`}>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white dark:bg-black p-2 rounded-xl shadow-sm">
                                            {model.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900 dark:text-white tracking-wide">{model.name}</h3>
                                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-semibold">
                                                {statuses[model.id] === 'generating' ? 'Writing...' : statuses[model.id].toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    {statuses[model.id] === 'done' && (
                                        <button 
                                            onClick={() => handleCopy(model.id, responses[model.id])}
                                            className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-colors shadow-sm text-neutral-500 hover:text-brand"
                                            title="Copy Result"
                                        >
                                            {copiedId === model.id ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    )}
                                </div>
                                
                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative">
                                    <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-neutral-200 dark:prose-pre:border-neutral-800 focus:outline-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {responses[model.id]}
                                        </ReactMarkdown>
                                    </div>
                                    {statuses[model.id] === 'generating' && (
                                        <div className="mt-4 flex gap-1 items-center pb-8">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Provider Keys Modal */}
            <AnimatePresence>
                {showKeyModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/50">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                                        <Key className="text-amber-500" size={24} /> Provider Matrix Keys
                                    </h2>
                                    <p className="text-sm text-neutral-500 mt-1">Set the API keys for the models you want to use in the Arena.</p>
                                </div>
                                <button onClick={() => setShowKeyModal(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Core Models</h3>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2"><Sparkles size={16} className="text-amber-500"/> Gemini API Key (Default)</label>
                                        <input type="password" value={keys.gemini} onChange={(e) => setKeys({...keys, gemini: e.target.value})} className="w-full bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors" placeholder="AIzaSy..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2"><Zap size={16} className="text-fuchsia-500"/> DeepSeek API Key (Reviewer)</label>
                                        <input type="password" value={keys.deepseek} onChange={(e) => setKeys({...keys, deepseek: e.target.value})} className="w-full bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors" placeholder="sk-or-v1-..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2"><Box size={16} className="text-cyan-500"/> Qwen API Key (Strategist)</label>
                                        <input type="password" value={keys.qwen} onChange={(e) => setKeys({...keys, qwen: e.target.value})} className="w-full bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors" placeholder="sk-or-v1-..." />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex justify-end">
                                <button onClick={saveKeys} className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-brand/20">
                                    Save Keys to Vault
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
