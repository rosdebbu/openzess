import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Sparkles, Fingerprint, Activity, Zap } from 'lucide-react';
import logoUrl from '../assets/seahorse-logo.jpg';

interface WelcomeProps {
    onComplete: (provider: string, apiKey: string) => void;
}

const BOOT_SEQUENCE = [
  "[SYS] Memory verification successful...",
  "[SYS] Initializing Neural Core Engine...",
  "[SYS] Validating Xvfb Linux Sandbox connection...",
  "[SYS] Directing Websockify via matrix ports...",
  "[SYS] Awakening Background Task Schedulers...",
  "[SYS] Checking Channels: Telegram Bridge Configured.",
  "[SYS] Checking Channels: Discord Bridge Configured.",
  "[SYS] Swarm Architecture Multi-Agent Framework Prepared.",
  "[OK] All systems go. Openzess Matrix v3.0.4 Online."
];

export default function Welcome({ onComplete }: WelcomeProps) {
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    
    // Boot Sequence State
    const [bootStep, setBootStep] = useState(0);
    const [isBootComplete, setIsBootComplete] = useState(false);

    useEffect(() => {
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            setBootStep(currentStep);
            
            // Fast sequence to keep presentation moving
            if (currentStep >= BOOT_SEQUENCE.length) {
                clearInterval(interval);
                // Pause for a moment to let the user read "All systems go" before fading
                setTimeout(() => setIsBootComplete(true), 1000); 
            }
        }, 220); // 220ms per log = approx 2 seconds total length. High speed!
        
        return () => clearInterval(interval);
    }, []);

    const handleConnect = () => {
        if (!apiKey && provider !== 'ollama') return;
        setIsConnecting(true);
        // Simulate a tiny connection delay for a satisfying UX
        setTimeout(() => {
            onComplete(provider, apiKey);
        }, 1200);
    };

    return (
        <div className="flex h-screen w-screen bg-neutral-950 items-center justify-center relative overflow-hidden font-sans">
            {/* Immersive Animated Background */}
            <div className="absolute inset-0 z-0">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-brand/20 opacity-40 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[5000ms]" />
                 <div className="absolute top-1/3 left-1/4 w-[40vw] h-[40vh] bg-purple-600/20 opacity-30 blur-[100px] rounded-full mix-blend-screen animate-pulse duration-[7000ms]" />
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDEiLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjAxNSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-100 z-0 pointer-events-none"></div>
            </div>

            <AnimatePresence mode="wait">
                {!isBootComplete ? (
                    <motion.div 
                        key="boot-sequence"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="relative z-10 w-full max-w-3xl px-8 flex flex-col font-mono text-[15px] sm:text-base leading-relaxed tracking-tight"
                    >
                        {BOOT_SEQUENCE.slice(0, bootStep).map((log, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.1 }}
                                className={`mb-2 font-medium ${log.startsWith('[OK]') ? 'text-brand drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-neutral-300'}`}
                            >
                                {log}
                            </motion.div>
                        ))}
                        {bootStep < BOOT_SEQUENCE.length && (
                             <div className="flex items-center text-brand mt-2 animate-pulse h-6">
                                 <div className="w-3 h-5 bg-brand" />
                             </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="auth-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 w-full max-w-md flex flex-col pt-10"
                    >
                        {/* Logo & Headline */}
                        <div className="flex flex-col items-center justify-center mb-10 text-center">
                            <motion.div 
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                className="mb-6"
                            >
                                <img src={logoUrl} alt="Openzess Logo" className="w-20 h-20 object-contain mix-blend-screen drop-shadow-[0_0_20px_rgba(255,100,100,0.6)]" />
                            </motion.div>
                            <h1 className="text-4xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>openzess</h1>
                            <p className="text-neutral-400 font-medium">Initialize your AI workspace</p>
                        </div>

                        {/* Login Glass Card */}
                        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-brand/30 transition-colors duration-500">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            
                            <div className="space-y-6 relative z-10">
                                {/* Provider Select */}
                                <div className="space-y-2">
                                     <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Neural Core / Provider</label>
                                     <div className="relative">
                                         <select 
                                             value={provider}
                                             onChange={(e) => setProvider(e.target.value)}
                                             disabled={isConnecting}
                                             className="w-full bg-white/5 border border-white/10 text-white p-3.5 rounded-xl appearance-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all cursor-pointer font-medium"
                                         >
                                             <option value="gemini" className="text-black">Gemini (gemini-2.5-flash)</option>
                                             <option value="openai" className="text-black">OpenAI (gpt-4o-mini)</option>
                                             <option value="anthropic" className="text-black">Anthropic (claude-3-5-sonnet)</option>
                                             <option value="groq" className="text-black">Groq (llama-3.3)</option>
                                             <option value="deepseek" className="text-black">DeepSeek (DeepSeek V3)</option>
                                             <option value="qwen" className="text-black">Qwen (Qwen 2.5 72B)</option>
                                             <option value="gemma" className="text-black">Gemma (Gemma 2)</option>
                                             <option value="kimi" className="text-black">Kimi (Moonshot 8k)</option>
                                             <option value="ollama" className="text-black">Ollama (Local/Airgapped)</option>
                                         </select>
                                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                             <Zap size={16} />
                                         </div>
                                     </div>
                                </div>

                                {/* API Key Input */}
                                <div className="space-y-2">
                                     <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Authorization Sequence</label>
                                     <div className="relative">
                                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                                             <Key size={16} />
                                         </div>
                                         <input 
                                             type="password"
                                             value={apiKey}
                                             onChange={(e) => setApiKey(e.target.value)}
                                             disabled={provider === 'ollama' || isConnecting}
                                             placeholder={provider === 'ollama' ? "Local mode - No key required" : "Enter Master API Key..."}
                                             className="w-full bg-white/5 border border-white/10 text-white p-3.5 pl-11 rounded-xl focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all disabled:opacity-50 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-neutral-600"
                                         />
                                     </div>
                                </div>

                                {/* Submit Button */}
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConnect}
                                    disabled={isConnecting || (!apiKey && provider !== 'ollama')}
                                    className="w-full relative overflow-hidden bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed group transition-shadow hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand/80 to-purple-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {isConnecting ? (
                                        <span className="relative z-10 flex items-center gap-2 text-black group-hover:text-white transition-colors duration-300">
                                            <Activity className="animate-pulse" size={18} /> Establishing Link...
                                        </span>
                                    ) : (
                                        <span className="relative z-10 flex items-center gap-2 text-black group-hover:text-white transition-colors duration-300">
                                            <Fingerprint size={18} /> Execute Authorization
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity cursor-default flex items-center justify-center gap-2 text-xs font-mono text-white">
                            <span>SYSTEM IDENTIFICATION:</span>
                            <span className="px-1.5 py-0.5 bg-white/10 rounded">v3.0.4 MATRIX</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
