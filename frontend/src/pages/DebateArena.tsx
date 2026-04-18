import { useState, useRef, useEffect } from 'react';
import { Send, Swords, Box, Zap, Sparkles, Copy, CheckCircle2, Key, X, Layers, Trophy, RotateCcw, Crown, Cpu, Focus, Download, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArenaModel {
    id: string;
    name: string;
    label: string;
    provider: string;
    storageKey: string;
    icon: any;
    accentColor: string;
    glowColor: string;
    gradientFrom: string;
    gradientTo: string;
}

const ALL_MODELS: ArenaModel[] = [
    {
        id: 'deepseek',
        name: 'Kimi',
        label: 'V3 · Reviewer',
        provider: 'deepseek',
        storageKey: 'openzess_deepseek_key',
        icon: <Sparkles size={22} />,
        accentColor: 'text-indigo-400',
        glowColor: 'shadow-indigo-500/20',
        gradientFrom: 'from-indigo-500',
        gradientTo: 'to-blue-700',
    },
    {
        id: 'deepseek2',
        name: 'Gemma',
        label: 'Coder · Logic',
        provider: 'deepseek',
        storageKey: 'openzess_deepseek2_key',
        icon: <Crown size={22} />,
        accentColor: 'text-cyan-400',
        glowColor: 'shadow-cyan-500/20',
        gradientFrom: 'from-cyan-500',
        gradientTo: 'to-teal-600',
    },
    {
        id: 'deepseek3',
        name: 'DeepSeek 3',
        label: 'Reasoner · Math',
        provider: 'deepseek',
        storageKey: 'openzess_deepseek3_key',
        icon: <Zap size={22} />,
        accentColor: 'text-fuchsia-400',
        glowColor: 'shadow-fuchsia-500/20',
        gradientFrom: 'from-fuchsia-600',
        gradientTo: 'to-purple-700',
    },
    {
        id: 'deepseek4',
        name: 'DeepSeek 4',
        label: 'Refiner · Speed',
        provider: 'deepseek',
        storageKey: 'openzess_deepseek4_key',
        icon: <Zap size={22} />,
        accentColor: 'text-fuchsia-400',
        glowColor: 'shadow-fuchsia-500/20',
        gradientFrom: 'from-fuchsia-600',
        gradientTo: 'to-purple-700',
    },
    {
        id: 'deepseek5',
        name: 'DeepSeek 5',
        label: 'Critic · Quality',
        provider: 'deepseek',
        storageKey: 'openzess_deepseek5_key',
        icon: <Zap size={22} />,
        accentColor: 'text-purple-400',
        glowColor: 'shadow-purple-500/20',
        gradientFrom: 'from-purple-600',
        gradientTo: 'to-indigo-700',
    },
    {
        id: 'qwen',
        name: 'Qwen',
        label: 'Max · Strategist',
        provider: 'qwen',
        storageKey: 'openzess_qwen_key',
        icon: <Box size={22} />,
        accentColor: 'text-cyan-400',
        glowColor: 'shadow-cyan-500/20',
        gradientFrom: 'from-cyan-600',
        gradientTo: 'to-blue-700',
    },
    {
        id: 'gemini',
        name: 'Gemini',
        label: 'Pro · Architect',
        provider: 'gemini',
        storageKey: 'openzess_api_key',
        icon: <Sparkles size={22} />,
        accentColor: 'text-amber-400',
        glowColor: 'shadow-amber-500/20',
        gradientFrom: 'from-amber-500',
        gradientTo: 'to-orange-600',
    },
    {
        id: 'glm',
        name: 'GLM',
        label: 'GLM-4 · Analyst',
        provider: 'glm',
        storageKey: 'openzess_glm_key',
        icon: <Cpu size={22} />,
        accentColor: 'text-emerald-400',
        glowColor: 'shadow-emerald-500/20',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-teal-700',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        label: 'GPT-4o · Writer',
        provider: 'openai',
        storageKey: 'openzess_openai_key',
        icon: <Layers size={22} />,
        accentColor: 'text-neutral-400',
        glowColor: 'shadow-neutral-500/20',
        gradientFrom: 'from-neutral-600',
        gradientTo: 'to-neutral-900',
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        label: 'Claude 3.5 · Planner',
        provider: 'anthropic',
        storageKey: 'openzess_anthropic_key',
        icon: <Box size={22} />,
        accentColor: 'text-amber-700',
        glowColor: 'shadow-amber-700/20',
        gradientFrom: 'from-orange-600',
        gradientTo: 'to-amber-800',
    },
    {
        id: 'groq',
        name: 'Groq',
        label: 'Llama 3 · Speed',
        provider: 'groq',
        storageKey: 'openzess_groq_key',
        icon: <Zap size={22} />,
        accentColor: 'text-rose-400',
        glowColor: 'shadow-rose-500/20',
        gradientFrom: 'from-rose-500',
        gradientTo: 'to-red-700',
    },
    {
        id: 'kimi',
        name: 'Kimi',
        label: 'Moonshot · Local',
        provider: 'kimi',
        storageKey: 'openzess_kimi_key',
        icon: <Sparkles size={22} />,
        accentColor: 'text-indigo-400',
        glowColor: 'shadow-indigo-500/20',
        gradientFrom: 'from-indigo-500',
        gradientTo: 'to-blue-700',
    },
    {
        id: 'cohere',
        name: 'Cohere',
        label: 'Command R+ · Scaler',
        provider: 'cohere',
        storageKey: 'openzess_cohere_key',
        icon: <Layers size={22} />,
        accentColor: 'text-gray-400',
        glowColor: 'shadow-gray-500/20',
        gradientFrom: 'from-gray-500',
        gradientTo: 'to-gray-800',
    },
    {
        id: 'mistral-ai',
        name: 'Mistral AI',
        label: 'Large 2 · Logic',
        provider: 'mistral-ai',
        storageKey: 'openzess_mistral_key',
        icon: <Zap size={22} />,
        accentColor: 'text-orange-400',
        glowColor: 'shadow-orange-500/20',
        gradientFrom: 'from-orange-500',
        gradientTo: 'to-red-600',
    }
];

export default function DebateArena() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [responses, setResponses] = useState<Record<string, string>>(() => {
        const init: any = {};
        ALL_MODELS.forEach(m => init[m.id] = '');
        return init;
    });
    const [statuses, setStatuses] = useState<Record<string, 'idle' | 'generating' | 'done' | 'error'>>(() => {
        const init: any = {};
        ALL_MODELS.forEach(m => init[m.id] = 'idle');
        return init;
    });
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
    const [zenMode, setZenMode] = useState(false);
    const [previewCode, setPreviewCode] = useState<string | null>(null);
    const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Warroom Provider Keys
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
        qwen: localStorage.getItem('openzess_qwen_key') || '',
        glm: localStorage.getItem('openzess_glm_key') || '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',
        kimi: localStorage.getItem('openzess_kimi_key') || ''
    }));

    // Derive active models dynamically based on which keys exist!
    const activeModels = ALL_MODELS.filter(m => {
        const keyItem = (keys as any)[m.id === 'gemini' ? 'gemini' : m.id];
        return keyItem && keyItem.trim().length > 0;
    });

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

    const handleDownload = (code: string, language: string) => {
        const ext = language || 'txt';
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openzess_snippet.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRun = (code: string) => {
        setPreviewCode(code);
    };

    // Auto-scroll each panel as content streams
    useEffect(() => {
        activeModels.forEach(m => {
            const el = scrollRefs.current[m.id];
            if (el && statuses[m.id] === 'generating') {
                el.scrollTop = el.scrollHeight;
            }
        });
    }, [responses, statuses]);

    const fetchStream = async (model: ArenaModel, userPrompt: string) => {
        setStatuses(prev => ({...prev, [model.id]: 'generating'}));
        setResponses(prev => ({...prev, [model.id]: ''}));

        const apiKey = localStorage.getItem(model.storageKey) || (model.provider === 'glm' ? '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' : null);
        if (!apiKey) {
            setResponses(prev => ({...prev, [model.id]: `⚠️ No API key set for **${model.name}**.\n\nClick **Provider Keys** at the top to add one.`}));
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
                                } else if (data.type === 'error') {
                                    throw new Error(data.error || "Unknown server error");
                                }
                            } catch(e) {}
                        }
                    }
                }
            }
            setStatuses(prev => ({...prev, [model.id]: 'done'}));
        } catch(err: any) {
            setResponses(prev => ({...prev, [model.id]: `❌ **Error:** ${err.message}`}));
            setStatuses(prev => ({...prev, [model.id]: 'error'}));
        }
    };

    const handleFight = async () => {
        if (!prompt.trim() || isLoading || activeModels.length === 0) return;
        setIsLoading(true);
        setSelectedWinner(null);

        await Promise.all(activeModels.map(m => fetchStream(m, prompt)));

        setIsLoading(false);
    };

    const handleReset = () => {
        setPrompt('');
        setResponses(prev => {
            const next = {...prev};
            ALL_MODELS.forEach(m => next[m.id] = '');
            return next;
        });
        setStatuses(prev => {
            const next = {...prev};
            ALL_MODELS.forEach(m => next[m.id] = 'idle');
            return next;
        });
        setSelectedWinner(null);
        setIsLoading(false);
    };

    const hasStarted = Object.values(statuses).some(s => s !== 'idle');
    const allDone = Object.values(statuses).every(s => s === 'done' || s === 'error');

    const statusDot = (s: string) => {
        if (s === 'generating') return 'bg-amber-400 animate-pulse';
        if (s === 'done') return 'bg-emerald-400';
        if (s === 'error') return 'bg-red-400';
        return 'bg-neutral-600';
    };

    return (
        <div className="flex flex-col h-full w-full bg-neutral-50 dark:bg-[#0a0a0f] transition-colors overflow-hidden relative">
            {!hasStarted ? (
                /* ── Initial Hero State ── */
                <div className="h-full flex flex-col items-center justify-center p-6 relative">
                    <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
                        <button 
                            onClick={() => {
                               const newZen = !zenMode;
                               setZenMode(newZen);
                               window.dispatchEvent(new CustomEvent('toggle-zen-mode', { detail: newZen }));
                            }}
                            title="Focus Mode" 
                            className={`flex w-9 h-9 items-center justify-center rounded-full transition-all backdrop-blur-md border ${zenMode ? 'bg-neutral-800 dark:bg-neutral-800 border-brand/50 text-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.2)]' : 'bg-white/5 dark:bg-white/[0.03] hover:bg-white/10 dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 border-neutral-200/50 dark:border-white/10'}`}
                        >
                            <Focus size={14} />
                        </button>
                        <button 
                            onClick={() => setShowKeyModal(true)}
                            className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.03] hover:bg-white/10 dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border border-neutral-200/50 dark:border-white/10"
                        >
                            <Key size={14} className="text-brand" />
                            <span className="hidden md:inline">Keys</span>
                        </button>
                    </div>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center max-w-2xl w-full z-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.3)] mb-6">
                            <Swords size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-3 leading-tight">Warroom Debate</h1>
                        <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 mb-10">
                            Drop a complex problem and watch up to {ALL_MODELS.length} connected agents race to solve it in parallel.
                            Currently tracking <strong className="text-brand">{activeModels.length}</strong> active agents.
                        </p>
                        
                        <div className="w-full bg-white dark:bg-[#111118]/80 backdrop-blur-xl border border-neutral-200/60 dark:border-white/[0.06] rounded-[24px] flex flex-col shadow-xl transition-all focus-within:border-brand/40 focus-within:shadow-[0_0_0_4px_rgba(var(--brand-rgb),0.08)]">
                            <textarea
                                className="w-full bg-transparent border-none text-neutral-900 dark:text-neutral-200 text-base md:text-lg resize-none px-6 py-5 min-h-[120px] focus:outline-none placeholder:text-neutral-400 font-sans"
                                placeholder="What logic puzzle or coding architecture do you need debated?..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleFight();
                                    }
                                }}
                            />
                            <div className="flex items-center justify-between px-3 pb-3 pt-2 border-t border-neutral-100 dark:border-white/[0.04]">
                                <div className="text-xs text-neutral-400 pl-3">Press Enter to send</div>
                                <button 
                                    className="bg-brand hover:bg-brand-hover text-white rounded-xl w-12 h-12 shrink-0 flex items-center justify-center transition-all disabled:opacity-30 shadow-md"
                                    onClick={handleFight}
                                    disabled={!prompt.trim() || isLoading}
                                >
                                    <Send size={20} className="translate-x-0.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            ) : (
                /* ── Active Arena State ── */
                <>
                    {/* ── Compact Top Bar ── */}
                    <div className="shrink-0 px-5 pt-14 pb-4 flex items-center gap-4 border-b border-neutral-200/60 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl z-20">
                {/* Left: Title */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Swords size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">Warroom Debate</h1>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-tight">4-way parallel generation</p>
                    </div>
                </div>

                {/* Center: Prompt Bar */}
                <div className="flex-1 max-w-3xl mx-auto">
                    <div className="flex items-center bg-neutral-100/80 dark:bg-white/[0.04] border border-neutral-200/50 dark:border-white/[0.06] rounded-2xl px-1 py-1 transition-all focus-within:border-brand/40 focus-within:shadow-[0_0_0_3px_rgba(var(--brand-rgb),0.08)]">
                        <input
                            className="flex-1 bg-transparent border-none text-sm text-neutral-900 dark:text-neutral-200 px-4 py-2.5 focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-sans"
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
                        />
                        {hasStarted && (
                            <button
                                onClick={handleReset}
                                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-xl hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors mr-1"
                                title="Reset Arena"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                        <button
                            className="bg-brand hover:bg-brand-hover text-white rounded-xl w-10 h-10 shrink-0 flex items-center justify-center transition-all disabled:opacity-30 shadow-md shadow-brand/20 active:scale-95"
                            onClick={handleFight}
                            disabled={!prompt.trim() || isLoading}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {hasStarted && allDone && (
                        <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 size={13} /> All Complete
                        </div>
                    )}
                    <button 
                        onClick={() => {
                           const newZen = !zenMode;
                           setZenMode(newZen);
                           window.dispatchEvent(new CustomEvent('toggle-zen-mode', { detail: newZen }));
                        }}
                        title="Focus Mode" 
                        className={`flex w-[38px] h-[38px] items-center justify-center rounded-xl transition-all border ${zenMode ? 'bg-neutral-800 dark:bg-neutral-800 border-brand/50 text-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.2)]' : 'bg-neutral-100/80 dark:bg-white/[0.06] hover:bg-neutral-200/80 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 border-neutral-200/50 dark:border-white/[0.08]'}`}
                    >
                        <Focus size={16} />
                    </button>
                    <button
                        onClick={() => setShowKeyModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-100/80 dark:bg-white/[0.06] hover:bg-neutral-200/80 dark:hover:bg-white/10 border border-neutral-200/50 dark:border-white/[0.08] rounded-xl text-neutral-600 dark:text-neutral-300 transition-all text-sm font-medium"
                    >
                        <Key size={14} />
                        <span className="hidden md:inline">Keys</span>
                    </button>
                </div>
            </div>

            {/* ── Bento Grid Arena ── */}
            <div className="flex-1 p-3 md:p-4 overflow-hidden">
                {activeModels.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-3xl">
                        <Key className="text-neutral-400 mb-4" size={48} />
                        <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">Configure Your Arena</h2>
                        <p className="text-sm text-neutral-500 max-w-sm mb-6">You must provide at least one API key in the "Keys" menu above to launch a debate grid.</p>
                        <button onClick={() => setShowKeyModal(true)} className="bg-brand text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:bg-brand-hover transition-colors">
                            Setup Provider Keys
                        </button>
                    </div>
                ) : (
                    <div className={`h-full grid gap-3 md:gap-4 ${
                        activeModels.length === 1 ? 'grid-cols-1' :
                        activeModels.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        activeModels.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                        activeModels.length === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' :
                        activeModels.length === 5 ? 'grid-cols-1 md:grid-cols-3' :
                        activeModels.length === 6 ? 'grid-cols-1 md:grid-cols-3' : 
                        activeModels.length === 7 ? 'grid-cols-1 md:grid-cols-4' :
                        'grid-cols-1 md:grid-cols-4'
                    }`}>
                        {activeModels.map((model, index) => {
                            const isStarted = statuses[model.id] !== 'idle';
                            const isWinner = selectedWinner === model.id;

                            // We use uniform col spans for dynamically sized grids so it gracefully wraps!
                            const gridClass = "col-span-1";

                            return (
                            <motion.div
                                key={model.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 30 }}
                                className={`
                                    ${gridClass}
                                    relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300
                                    bg-white/70 dark:bg-[#111118]/80
                                    border
                                    ${isWinner
                                        ? 'border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
                                        : 'border-neutral-200/50 dark:border-white/[0.06] hover:border-neutral-300/80 dark:hover:border-white/[0.12]'
                                    }
                                    backdrop-blur-sm
                                    group
                                `}
                            >
                                {/* Winner badge */}
                                {isWinner && (
                                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg uppercase tracking-wider">
                                        <Crown size={11} /> Winner
                                    </div>
                                )}

                                {/* Card Header */}
                                <div className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-neutral-200/30 dark:border-white/[0.04]">
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${model.gradientFrom} ${model.gradientTo} flex items-center justify-center text-white shadow-md ${model.glowColor}`}>
                                        {model.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white tracking-wide">{model.name}</h3>
                                            <div className={`w-1.5 h-1.5 rounded-full ${statusDot(statuses[model.id])}`} />
                                        </div>
                                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono tracking-wide">{model.label}</p>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {statuses[model.id] === 'done' && (
                                            <>
                                                <button
                                                    onClick={() => handleCopy(model.id, responses[model.id])}
                                                    className="p-1.5 text-neutral-400 hover:text-brand rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                                    title="Copy"
                                                >
                                                    {copiedId === model.id ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                </button>
                                                {allDone && (
                                                    <button
                                                        onClick={() => setSelectedWinner(isWinner ? null : model.id)}
                                                        className={`p-1.5 rounded-lg transition-colors ${isWinner ? 'text-amber-500 bg-amber-500/10' : 'text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10'}`}
                                                        title="Pick as winner"
                                                    >
                                                        <Trophy size={14} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div
                                    ref={(el) => { scrollRefs.current[model.id] = el; }}
                                    className="flex-1 overflow-y-auto custom-scrollbar relative"
                                >
                                    {!isStarted ? (
                                        /* ── Idle State: Beautiful preview card ── */
                                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${model.gradientFrom} ${model.gradientTo} flex items-center justify-center text-white/80 mb-4 shadow-xl ${model.glowColor} opacity-60`}>
                                                {model.icon}
                                            </div>
                                            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">{model.name}</p>
                                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed max-w-[200px]">
                                                Awaiting prompt. This agent will provide an independent response.
                                            </p>
                                            <div className="mt-4 flex items-center gap-1">
                                                <div className="w-8 h-[2px] rounded-full bg-neutral-200 dark:bg-neutral-800" />
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${model.gradientFrom} ${model.gradientTo} opacity-40`} />
                                                <div className="w-8 h-[2px] rounded-full bg-neutral-200 dark:bg-neutral-800" />
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── Active: Markdown content ── */
                                        <div className="px-4 py-4">
                                            <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:my-2 prose-headings:my-3 prose-pre:bg-neutral-100 dark:prose-pre:bg-[#1A1A1E] prose-pre:border prose-pre:border-neutral-200/50 dark:prose-pre:border-white/[0.05] prose-pre:rounded-xl prose-pre:p-0 prose-code:text-xs">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code({ node, inline, className, children, ...props }: any) {
                                                            const match = /language-(\w+)/.exec(className || '');
                                                            const language = match ? match[1] : '';
                                                            const isBlock = !inline && match;
                                                            const codeString = String(children).replace(/\n$/, '');

                                                            if (!isBlock) {
                                                                return <code className={`${className} bg-neutral-200/50 dark:bg-white/10 px-1 py-0.5 rounded text-[13px] font-mono`} {...props}>{children}</code>;
                                                            }

                                                            return (
                                                                <div className="flex flex-col w-full my-4 rounded-xl overflow-hidden border border-neutral-200/50 dark:border-white/[0.1] bg-white dark:bg-[#131317]">
                                                                    <div className="flex items-center justify-between px-4 py-2 bg-neutral-100/80 dark:bg-[#1A1A1E] border-b border-neutral-200/50 dark:border-white/[0.05]">
                                                                        <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">
                                                                            {language || 'text'}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <button onClick={() => { navigator.clipboard.writeText(codeString); setCopiedId(codeString); setTimeout(() => setCopiedId(null), 2000); }} className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5">
                                                                                {copiedId === codeString ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />} Copy
                                                                            </button>
                                                                            <button onClick={() => handleDownload(codeString, language)} className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5">
                                                                                <Download size={13} /> Download
                                                                            </button>
                                                                            {(language === 'html' || language === 'xml' || language === 'javascript') && (
                                                                                <>
                                                                                    <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-700 mx-1" />
                                                                                    <button onClick={() => handleRun(codeString)} className="flex items-center gap-1.5 px-2 py-1 text-xs text-brand hover:text-brand-hover hover:bg-brand/10 transition-colors rounded bg-brand/5 shadow-sm">
                                                                                        <Play size={13} fill="currentColor" /> Run
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-[#F8F9FA] dark:bg-[#0D0D10] text-neutral-800 dark:text-neutral-300">
                                                                        <code {...props}>{children}</code>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {responses[model.id]}
                                                </ReactMarkdown>
                                            </div>
                                            {statuses[model.id] === 'generating' && (
                                                <div className="mt-3 flex gap-1.5 items-center pb-4">
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${model.gradientFrom} ${model.gradientTo} animate-bounce`} style={{ animationDelay: '0ms' }} />
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${model.gradientFrom} ${model.gradientTo} animate-bounce`} style={{ animationDelay: '150ms' }} />
                                                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${model.gradientFrom} ${model.gradientTo} animate-bounce`} style={{ animationDelay: '300ms' }} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Subtle number badge */}
                                <div className="absolute bottom-3 right-3 text-[10px] font-mono font-bold text-neutral-300 dark:text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    #{index + 1}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                )}
            </div>
            </>
            )}

            {/* ── Provider Keys Modal ── */}
            <AnimatePresence>
                {previewCode && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#111118] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full h-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-4 border-b border-neutral-200/60 dark:border-white/[0.06] flex justify-between items-center bg-neutral-50 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                                        <Play size={16} className="text-brand ml-0.5" fill="currentColor" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">Live Preview</h2>
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Running securely in isolated sandbox environment</p>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewCode(null)} className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors text-sm font-medium">
                                    <X size={15} /> Close Runtime
                                </button>
                            </div>
                            <div className="flex-1 w-full bg-white relative">
                                <iframe 
                                    srcDoc={previewCode} 
                                    className="w-full h-full border-none absolute inset-0"
                                    sandbox="allow-scripts"
                                    title="Openzess Web Preview"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showKeyModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={() => setShowKeyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#111118] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-neutral-200/60 dark:border-white/[0.06] flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                                        <Key className="text-amber-500" size={20} /> Provider Keys
                                    </h2>
                                    <p className="text-xs text-neutral-400 mt-0.5">Configure API keys for each arena model.</p>
                                </div>
                                <button onClick={() => setShowKeyModal(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                {ALL_MODELS.map(model => (
                                    <div key={model.id} className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${model.gradientFrom} ${model.gradientTo} flex items-center justify-center text-white`}>
                                                {/* small icon replica */}
                                                <span style={{ transform: 'scale(0.6)' }}>{model.icon}</span>
                                            </span>
                                            {model.name} API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={(keys as any)[model.id === 'gemini' ? 'gemini' : model.id] || ''}
                                            onChange={(e) => setKeys(prev => ({ ...prev, [model.id === 'gemini' ? 'gemini' : model.id]: e.target.value }))}
                                            className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200/80 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand/50 transition-colors font-mono"
                                            placeholder="sk-..."
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="p-5 border-t border-neutral-200/60 dark:border-white/[0.06] flex justify-end gap-2">
                                <button onClick={() => setShowKeyModal(false)} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={saveKeys} className="bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-xl font-medium text-sm transition-colors shadow-lg shadow-brand/20">
                                    Save Keys
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
