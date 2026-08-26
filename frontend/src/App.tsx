import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
import MCP from './pages/MCP';
import Changelog from './pages/Changelog';
import Companion from './pages/Companion';
import Tavern from './pages/Tavern';
import Marketplace from './pages/Marketplace';
import MatrixViewer from './pages/MatrixViewer';
import WarRoom from './pages/WarRoom';
import Welcome from './pages/Welcome';
import KnowledgeBase from './pages/KnowledgeBase';
import DebateArena from './pages/DebateArena';
import Doc from './pages/Doc';
import FAQ from './pages/FAQ';
import Graphify from './pages/Graphify';
import BrainEvolution from './pages/BrainEvolution';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import PageTransition from './components/PageTransition';

import { PERSONAS } from './utils/personas';
import { useLocation } from 'react-router-dom';

function AnimatedRoutes({ persona: _persona }: { persona: string }) {
  const location = useLocation();
  return (
    <div className="flex-1 flex overflow-hidden relative">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Chat /></PageTransition>} />
          <Route path="/sessions" element={<PageTransition><Sessions /></PageTransition>} />
          <Route path="/files" element={<PageTransition><Files /></PageTransition>} />
          <Route path="/tools" element={<PageTransition><Tools /></PageTransition>} />
          <Route path="/brain" element={<PageTransition><BrainEvolution /></PageTransition>} />
          <Route path="/evolution" element={<PageTransition><BrainEvolution /></PageTransition>} />
          
          <Route path="/channels" element={<PageTransition><Channels /></PageTransition>} />
          <Route path="/cron-jobs" element={<PageTransition><CronJobs /></PageTransition>} />
          <Route path="/matrix" element={<PageTransition><MatrixViewer /></PageTransition>} />
          <Route path="/debate" element={<PageTransition><DebateArena /></PageTransition>} />
          
          <Route path="/skills" element={<PageTransition><Skills /></PageTransition>} />
          <Route path="/mcp" element={<PageTransition><MCP /></PageTransition>} />
          <Route path="/marketplace" element={<PageTransition><Marketplace /></PageTransition>} />
          <Route path="/tavern" element={<PageTransition><Tavern /></PageTransition>} />
          <Route path="/memory" element={<PageTransition><MemoryVault /></PageTransition>} />
          <Route path="/canvas" element={<PageTransition><KnowledgeBase /></PageTransition>} />
          <Route path="/companion" element={<PageTransition><Companion /></PageTransition>} />
          <Route path="/changelog" element={<PageTransition><Changelog /></PageTransition>} />
          <Route path="/swarm" element={<PageTransition><WarRoom /></PageTransition>} />
          <Route path="/doc" element={<PageTransition><Doc /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
          <Route path="/graphify" element={<PageTransition><Graphify /></PageTransition>} />
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
    const handlePersonaChanged = () => {
      const p = localStorage.getItem('openzess_persona') || 'architect';
      setPersona(p);
      setSystemInstruction(localStorage.getItem('openzess_sys_inst') || PERSONAS['architect'].instruction);
      setTools({
        run_terminal_command: localStorage.getItem('openzess_tool_term') === 'true',
        search_the_web: localStorage.getItem('openzess_tool_web') === 'true',
        read_web_page: localStorage.getItem('openzess_tool_read') === 'true',
        create_file: localStorage.getItem('openzess_tool_create') === 'true',
        read_file: localStorage.getItem('openzess_tool_readf') === 'true',
        edit_code: localStorage.getItem('openzess_tool_edit') === 'true',
      });
    };
    window.addEventListener('open-settings', handleOpenSettings);
    window.addEventListener('persona-changed', handlePersonaChanged);
    return () => {
      window.removeEventListener('open-settings', handleOpenSettings);
      window.removeEventListener('persona-changed', handlePersonaChanged);
    };
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
        <div className="w-full h-full relative overflow-hidden flex flex-col bg-[#F5F0EB] dark:bg-[#1E1C1C] transition-colors duration-500">
          
          {/* Main Floating Application Container */}
          <div className="relative z-10 w-full h-full flex flex-col bg-[#F5F0EB] dark:bg-[#1E1C1C] overflow-hidden">
            
            {/* Global Header */}
            <header className="h-[64px] shrink-0 border-b border-[#E2DAD2] dark:border-[#3A3838] flex items-center justify-between px-6 bg-[#F5F0EB] dark:bg-[#1E1C1C]">
              <div className="flex items-center gap-3">
                <div className="font-bold text-xl tracking-tight text-[#3A3838] dark:text-[#E2DAD2] flex items-center gap-2">
                  OpenZess
                  <span className="text-[10px] text-[#A89080] font-bold tracking-normal mt-1">v1.1.0</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand ml-1 mt-1"></div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm font-medium text-[#B8AFA8] dark:text-[#B8AFA8]">
                <Link to="/changelog" className="hover:text-brand transition-colors">Changelog</Link>
                <a href="https://openzess-docs.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">Doc</a>
                <Link to="/faq" className="hover:text-brand transition-colors">FAQ</Link>
                <a href="https://github.com/rosdebbu/openzess" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">GitHub</a>
                <div className="w-px h-4 bg-[#E2DAD2] dark:bg-[#3A3838] mx-2"></div>
                <button onClick={() => alert('Language Options (En, Es, Fr, etc.) will be automatically supported in the next module release!')} className="hover:text-brand flex items-center gap-1 border border-[#E2DAD2] dark:border-[#3A3838] px-1.5 py-0.5 rounded text-xs">
                  En
                </button>
                <button onClick={() => window.dispatchEvent(new Event('toggle-theme-global'))} className="hover:text-brand transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                </button>
              </div>
            </header>

            {/* Main Split */}
            <div className="flex flex-1 overflow-hidden relative text-[#3A3838] dark:text-[#E2DAD2] bg-[#F0EBE5] dark:bg-[#1A1818]">
              <Sidebar />
              <AnimatedRoutes persona={persona} />
            </div>

          </div>

          {/* Persistent General Settings Modal */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
              >
                <motion.div 
                  initial={{ y: 30, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  className="bg-[#F5F0EB] dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
                >
                <div className="flex border-b border-[#E2DAD2] dark:border-[#3A3838] shrink-0">
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
                           <option value="deepseek" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">DeepSeek 1 (Reviewer)</option>
                           <option value="deepseek2" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">DeepSeek 2 (Strategist)</option>
                           <option value="deepseek3" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">DeepSeek 3 (Devil's Advocate)</option>
                           <option value="qwen" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">Qwen (qwen-2.5-72b-instruct)</option>
                           <option value="glm" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">GLM (z-ai/glm-5.3-flash)</option>
                           <option value="kimi" className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">Kimi (moonshot-v1-8k)</option>
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
                              
                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-surface hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <TerminalSquare size={18} className={tools.run_terminal_command ? "text-brand" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">Terminal Access</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can execute shell commands.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.run_terminal_command} onChange={(e) => handleToolChange('run_terminal_command', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-surface hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <FilePlus size={18} className={tools.create_file ? "text-blue-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">File Creation</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can forge new files.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.create_file} onChange={(e) => handleToolChange('create_file', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-surface hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <FileCode2 size={18} className={tools.edit_code ? "text-indigo-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">Code Editing</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can overwrite specific code subsets.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.edit_code} onChange={(e) => handleToolChange('edit_code', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-surface hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <FileText size={18} className={tools.read_file ? "text-teal-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">File Reading</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can silently ingest local files.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.read_file} onChange={(e) => handleToolChange('read_file', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>
                              
                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-surface hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
                                 <div className="flex items-center gap-3">
                                    <Globe size={18} className={tools.search_the_web ? "text-emerald-500" : "text-neutral-400"} />
                                    <div>
                                       <div className="font-medium text-sm text-neutral-900 dark:text-neutral-200">Web Search</div>
                                       <div className="text-xs text-neutral-500 truncate">Agent can query DuckDuckGo.</div>
                                    </div>
                                 </div>
                                 <input type="checkbox" checked={tools.search_the_web} onChange={(e) => handleToolChange('search_the_web', e.target.checked)} className="w-5 h-5 accent-brand" />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-surface hover:bg-neutral-100 dark:hover:bg-surface transition-colors">
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
                
                <div className="p-6 border-t border-[#E2DAD2] dark:border-[#3A3838] bg-[#EDE8E2] dark:bg-[#252222] shrink-0">
                  <button 
                    className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
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

        </div>
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
