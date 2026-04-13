import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Key, Bot, Settings as SettingsIcon, TerminalSquare, Globe, BookOpen, FilePlus, FileText, FileCode2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Sidebar from './components/Sidebar';
import Chat from './pages/Chat';
import Files from './pages/Files';
import Tools from './pages/Tools';
import Sessions from './pages/Sessions';
import MemoryVault from './pages/Memory';
import Skills from './pages/Skills';
import Channels from './pages/Channels';
import CronJobs from './pages/CronJobs';
import Heartbeat from './pages/Heartbeat';
import MCP from './pages/MCP';
import Changelog from './pages/Changelog';
import Companion from './pages/Companion';
import Tavern from './pages/Tavern';
import Marketplace from './pages/Marketplace';
import MatrixViewer from './pages/MatrixViewer';
import WarRoom from './pages/WarRoom';
import Welcome from './pages/Welcome';
import KnowledgeBase from './pages/KnowledgeBase';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import PageTransition from './components/PageTransition';

import { PERSONAS } from './utils/personas';
import { useLocation } from 'react-router-dom';

function AnimatedRoutes({ persona }: { persona: string }) {
  const location = useLocation();
  return (
    <div className="flex-1 flex overflow-hidden relative">
      {persona !== 'architect' && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-brand/10 border border-brand/30 text-brand px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm pointer-events-none flex items-center gap-2">
            <Bot size={12} /> {PERSONAS[persona]?.name || PERSONAS['custom'].name} Active
         </div>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Chat /></PageTransition>} />
          <Route path="/sessions" element={<PageTransition><Sessions /></PageTransition>} />
          <Route path="/files" element={<PageTransition><Files /></PageTransition>} />
          <Route path="/tools" element={<PageTransition><Tools /></PageTransition>} />
          
          <Route path="/channels" element={<PageTransition><Channels /></PageTransition>} />
          <Route path="/cron-jobs" element={<PageTransition><CronJobs /></PageTransition>} />
          <Route path="/heartbeat" element={<PageTransition><Heartbeat /></PageTransition>} />
          <Route path="/matrix" element={<PageTransition><MatrixViewer /></PageTransition>} />
          
          <Route path="/skills" element={<PageTransition><Skills /></PageTransition>} />
          <Route path="/mcp" element={<PageTransition><MCP /></PageTransition>} />
          <Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
          <Route path="/tavern" element={<PageTransition><Tavern /></PageTransition>} />
          <Route path="/memory" element={<PageTransition><MemoryVault /></PageTransition>} />
          <Route path="/canvas" element={<PageTransition><KnowledgeBase /></PageTransition>} />
          <Route path="/companion" element={<PageTransition><Companion /></PageTransition>} />
          <Route path="/changelog" element={<PageTransition><Changelog /></PageTransition>} />
          <Route path="/swarm" element={<PageTransition><WarRoom /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

function App() {
  const [provider, setProvider] = useState(() => localStorage.getItem('openzess_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openzess_api_key') || '');
  
  const [isSystemInitialized, setIsSystemInitialized] = useState(() => !!apiKey || provider === 'ollama');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'persona'>('general');

  const [persona, setPersona] = useState(localStorage.getItem('openzess_persona') || 'architect');
  const [systemInstruction, setSystemInstruction] = useState(
    localStorage.getItem('openzess_sys_inst') || PERSONAS['architect'].instruction
  );
  
  const [tools, setTools] = useState({
    run_terminal_command: localStorage.getItem('openzess_tool_term') ? localStorage.getItem('openzess_tool_term') === 'true' : true,
    search_the_web: localStorage.getItem('openzess_tool_web') ? localStorage.getItem('openzess_tool_web') === 'true' : true,
    read_web_page: localStorage.getItem('openzess_tool_read') ? localStorage.getItem('openzess_tool_read') === 'true' : true,
    create_file: localStorage.getItem('openzess_tool_create') ? localStorage.getItem('openzess_tool_create') === 'true' : true,
    read_file: localStorage.getItem('openzess_tool_readf') ? localStorage.getItem('openzess_tool_readf') === 'true' : true,
    edit_code: localStorage.getItem('openzess_tool_edit') ? localStorage.getItem('openzess_tool_edit') === 'true' : true,
  });

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  const handlePersonaChange = (p: string) => {
    setPersona(p);
    if (p !== 'custom') {
      const template = PERSONAS[p];
      setSystemInstruction(template.instruction);
      setTools(template.tools);
    }
  };

  const handleToolChange = (tool: string, val: boolean) => {
    setTools(prev => ({ ...prev, [tool]: val }));
    setPersona('custom');
  };

  const handleInstructionChange = (val: string) => {
    setSystemInstruction(val);
    setPersona('custom');
  };

  const saveConfig = () => {
    localStorage.setItem('openzess_api_key', apiKey);
    localStorage.setItem('openzess_provider', provider);
    localStorage.setItem('openzess_persona', persona);
    localStorage.setItem('openzess_sys_inst', systemInstruction);
    localStorage.setItem('openzess_tool_term', tools.run_terminal_command.toString());
    localStorage.setItem('openzess_tool_web', tools.search_the_web.toString());
    localStorage.setItem('openzess_tool_read', tools.read_web_page.toString());
    localStorage.setItem('openzess_tool_create', tools.create_file.toString());
    localStorage.setItem('openzess_tool_readf', tools.read_file.toString());
    localStorage.setItem('openzess_tool_edit', tools.edit_code.toString());
    setShowSettings(false);
  };

  const handleInitialGatewayAuth = (newProvider: string, newApiKey: string) => {
      setProvider(newProvider);
      setApiKey(newApiKey);
      localStorage.setItem('openzess_provider', newProvider);
      localStorage.setItem('openzess_api_key', newApiKey);
      setIsSystemInitialized(true);
  };

  if (!isSystemInitialized) {
      return <Welcome onComplete={handleInitialGatewayAuth} />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
      <BrowserRouter>
        <div className="flex h-screen w-screen bg-neutral-50 dark:bg-neutral-950 font-sans relative overflow-hidden transition-colors duration-500">
          <div className="ambient-orb"></div>
          
          {/* Persistent General Settings Modal */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4"
              >
                <motion.div 
                  initial={{ y: 30, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-3xl border border-neutral-200 dark:border-white/10 rounded-3xl w-full max-w-4xl premium-shadow flex flex-col overflow-hidden max-h-[90vh]"
                >
                <div className="flex border-b border-neutral-200 dark:border-border shrink-0">
                  <button 
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'general' ? 'text-brand border-b-2 border-brand bg-brand/5' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                  >
                    <SettingsIcon size={18} /> General Setup
                  </button>
                  <button 
                    onClick={() => setActiveTab('persona')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'persona' ? 'text-brand border-b-2 border-brand bg-brand/5' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                  >
                    <Bot size={18} /> Agent Persona
                  </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                  {activeTab === 'general' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                      <h2 className="text-xl font-medium mb-1 flex items-center gap-2 text-neutral-900 dark:text-white">
                        <Key size={20} className="text-brand" /> Configure Provider
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-2 text-sm leading-relaxed">
                        Select a provider and supply an API key. Powered universally by LiteLLM.
                      </p>
                      
                      <div className="flex flex-col gap-3">
                        <select 
                           value={provider}
                           onChange={(e) => setProvider(e.target.value)}
                           className="w-full bg-neutral-50 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand/50 dark:focus:border-brand transition-colors"
                        >
                           <option value="gemini" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">Google Gemini / Gemma (gemini-2.5-flash)</option>
                           <option value="openai" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">OpenAI (gpt-4o-mini)</option>
                           <option value="anthropic" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">Anthropic (claude-3-5-sonnet-20241022)</option>
                           <option value="groq" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">Groq (llama-3.3-70b-versatile)</option>
                           <option value="ollama" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">Local System (Ollama)</option>
                        </select>
                        
                        <input 
                          type="password"
                          placeholder={provider === 'ollama' ? "Local model - API Key not required" : "sk-..."}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          disabled={provider === 'ollama'}
                          className="w-full bg-neutral-50 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand/50 dark:focus:border-brand font-mono transition-colors disabled:opacity-50"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                      
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                           <label className="block text-sm font-medium mb-2 text-neutral-800 dark:text-neutral-200">Select Identity</label>
                           <select 
                             value={persona}
                             onChange={(e) => handlePersonaChange(e.target.value)}
                             className="w-full bg-neutral-50 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-3 rounded-xl focus:outline-none focus:border-brand transition-colors appearance-none font-medium"
                           >
                             <option value="architect">The Architect (Default)</option>
                             <option value="scraper">Web Scraper</option>
                             <option value="codegen">Code Generator</option>
                             <option value="custom">Custom Persona...</option>
                           </select>

                           <label className="block text-sm font-medium mt-6 mb-2 text-neutral-800 dark:text-neutral-200 flex justify-between items-center">
                             <span>System Instruction</span>
                             {persona === 'custom' && <span className="text-xs text-brand bg-brand/10 px-2 py-0.5 rounded-md">Custom</span>}
                           </label>
                           <textarea 
                             value={systemInstruction}
                             onChange={(e) => handleInstructionChange(e.target.value)}
                             className="w-full bg-neutral-50 dark:bg-surface border border-neutral-200 dark:border-border text-neutral-900 dark:text-neutral-200 p-4 rounded-xl focus:outline-none focus:border-brand transition-colors font-mono text-sm leading-relaxed h-[280px] resize-none"
                           />
                         </div>

                         <div>
                           <label className="block text-sm font-medium mb-3 text-neutral-800 dark:text-neutral-200">Allowed Arsenal (Tools)</label>
                           <div className="grid grid-cols-1 gap-3 shrink-0">
                              
                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50/50 dark:bg-surface/50 hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <TerminalSquare size={18} className={tools.run_terminal_command ? "text-brand" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">Terminal Access</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can execute shell commands.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.run_terminal_command} onChange={(e) => handleToolChange('run_terminal_command', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50/50 dark:bg-surface/50 hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <FilePlus size={18} className={tools.create_file ? "text-blue-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">File Creation</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can forge new files.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.create_file} onChange={(e) => handleToolChange('create_file', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50/50 dark:bg-surface/50 hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <FileCode2 size={18} className={tools.edit_code ? "text-indigo-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">Code Editing</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can overwrite specific code subsets.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.edit_code} onChange={(e) => handleToolChange('edit_code', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50/50 dark:bg-surface/50 hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <FileText size={18} className={tools.read_file ? "text-teal-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">File Reading</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can silently ingest local files.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.read_file} onChange={(e) => handleToolChange('read_file', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>
                              
                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50/50 dark:bg-surface/50 hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <Globe size={18} className={tools.search_the_web ? "text-emerald-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">Web Search</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can query DuckDuckGo.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.search_the_web} onChange={(e) => handleToolChange('search_the_web', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50/50 dark:bg-surface/50 hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <BookOpen size={18} className={tools.read_web_page ? "text-amber-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">URL Scraper</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can scrape URL domains.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.read_web_page} onChange={(e) => handleToolChange('read_web_page', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                           </div>
                         </div>
                      </div>

                    </motion.div>
                  )}
                </div>
                
                <div className="p-6 border-t border-neutral-200 dark:border-border bg-neutral-50/50 dark:bg-surface/30 shrink-0">
                  <button 
                    className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-medium transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                    onClick={saveConfig}
                    disabled={!apiKey && provider !== 'ollama'}
                  >
                    Save Configuration
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

          <div className="flex flex-1 relative z-10 w-full h-full text-neutral-900 dark:text-neutral-200 bg-transparent">
             <Sidebar />
             <AnimatedRoutes persona={persona} />
          </div>
        </div>
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
