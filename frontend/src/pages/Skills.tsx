import { useState, useEffect } from 'react';
import { Bot, Plus, X, Terminal, Globe, Code, FilePlus, Eye, Save, Trash2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS } from '../utils/personas';

interface ToolConfig {
  run_terminal_command: boolean;
  search_the_web: boolean;
  read_web_page: boolean;
  create_file: boolean;
  read_file: boolean;
  edit_code: boolean;
}

interface Skill {
  key: string;
  name: string;
  instruction: string;
  tools: ToolConfig;
  isCustom: boolean;
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Skill Form State
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newInst, setNewInst] = useState('');
  const [newTools, setNewTools] = useState<ToolConfig>({
    run_terminal_command: false,
    search_the_web: false,
    read_web_page: false,
    create_file: false,
    read_file: false,
    edit_code: false
  });

  const loadSkills = () => {
    // 1. Load Hardcoded Personas (Default)
    const defaults = Object.keys(PERSONAS).map(k => ({
      key: k,
      ...PERSONAS[k],
      isCustom: false
    }));

    // 2. Load Custom Personas
    const customStored = localStorage.getItem('openzess_custom_skills');
    let custom = [];
    if (customStored) {
      try {
        const parsed = JSON.parse(customStored);
        custom = Object.keys(parsed).map(k => ({
          key: k,
          ...parsed[k],
          isCustom: true
        }));
      } catch (e) {
        console.error("Failed to parse custom skills", e);
      }
    }

    setSkills([...defaults, ...custom]);
  };
  
  useEffect(() => {
    loadSkills();
  }, []);

  const handleSaveCustomSkill = () => {
    if (!newKey.trim() || !newName.trim() || !newInst.trim()) {
       alert("Keyword, Name, and Logic Block are completely required.");
       return;
    }
    
    // Format key safely
    const cleanKey = newKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (PERSONAS[cleanKey]) {
       alert("This keyword is reserved for a default skill.");
       return;
    }

    const customStored = localStorage.getItem('openzess_custom_skills');
    let customMap: Record<string, Omit<Skill, 'key' | 'isCustom'>> = {};
    if (customStored) {
       try { customMap = JSON.parse(customStored); } catch(e){ console.error(e); }
    }
    
    customMap[cleanKey] = {
       name: newName.trim(),
       instruction: newInst.trim(),
       tools: newTools
    };
    
    localStorage.setItem('openzess_custom_skills', JSON.stringify(customMap));
    
    setIsModalOpen(false);
    resetForm();
    loadSkills();
  };
  
  const handleDeleteCustomSkill = (key: string) => {
    if (!window.confirm(`Delete the custom @${key} skill?`)) return;
    
    const customStored = localStorage.getItem('openzess_custom_skills');
    if (!customStored) return;
    try {
        const customMap = JSON.parse(customStored);
        delete customMap[key];
        localStorage.setItem('openzess_custom_skills', JSON.stringify(customMap));
        loadSkills();
    } catch(e) { console.error(e); }
  };

  const resetForm = () => {
      setNewKey('');
      setNewName('');
      setNewInst('');
      setNewTools({
        run_terminal_command: false, search_the_web: false, read_web_page: false,
        create_file: false, read_file: false, edit_code: false
      });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden relative">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full relative z-10">
        <header className="mb-8 flex items-end justify-between shrink-0 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white mb-2 tracking-tight">
              <Wand2 className="text-brand" /> Agent Skills & Personas
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">Expand openzess capabilities with custom logic blocks and hot-swappable agents.</p>
          </div>
          
          <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white py-2.5 px-5 rounded-xl font-medium transition-all shadow-lg shadow-brand/20 hover:shadow-brand/40 active:scale-95"
          >
             <Plus size={18} /> New Skill
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {skills.map((skill, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={skill.key}
                  className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 relative overflow-hidden flex flex-col shadow-sm dark:shadow-none hover:border-brand/40 transition-colors group"
                >
                  {/* Backdrop effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                     <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white ${skill.isCustom ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-violet-500 to-brand-hover'}`}>
                            <Bot size={20} />
                         </div>
                         <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white">{skill.name}</h3>
                            <div className="text-xs font-mono font-bold text-brand mt-0.5">@{skill.key}</div>
                         </div>
                     </div>
                     {skill.isCustom && (
                        <button 
                            onClick={() => handleDeleteCustomSkill(skill.key)}
                            className="text-neutral-400 hover:text-rose-500 p-2 rounded-lg bg-transparent transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                            <Trash2 size={16} />
                        </button>
                     )}
                     {!skill.isCustom && (
                        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">Default</div>
                     )}
                  </div>
                  
                  <div className="bg-neutral-50 dark:bg-black/30 rounded-xl p-4 border border-neutral-100 dark:border-white/5 mb-5 flex-1 max-h-[120px] overflow-y-auto custom-scrollbar">
                     <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed font-serif tracking-wide">{skill.instruction}</p>
                  </div>
                  
                  <div className="border-t border-neutral-100 dark:border-neutral-800/50 pt-4 flex flex-wrap gap-2 text-xs font-medium text-neutral-500 w-full relative z-10">
                     {skill.tools.run_terminal_command && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md border border-neutral-200/50 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"><Terminal size={12}/> Terminal</span>}
                     {skill.tools.search_the_web && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md border border-neutral-200/50 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"><Globe size={12}/> Web</span>}
                     {skill.tools.read_web_page && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md border border-neutral-200/50 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"><Eye size={12}/> Scrape</span>}
                     {skill.tools.edit_code && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md border border-neutral-200/50 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"><Code size={12}/> Code</span>}
                     {skill.tools.create_file && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md border border-neutral-200/50 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"><FilePlus size={12}/> Files</span>}
                  </div>
                </motion.div>
              ))}
            </div>
        </div>
      </div>
      
      {/* Skill Builder Modal */}
      <AnimatePresence>
        {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }} 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
              />
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                 animate={{ opacity: 1, scale: 1, y: 0 }} 
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                 <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-black/20 shrink-0">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2"><Wand2 size={20} className="text-brand"/> Create Swarm Agent</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white dark:bg-neutral-800 h-8 w-8 flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-700"><X size={16} /></button>
                 </div>
                 
                 <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    <div className="flex gap-6">
                       <div className="flex-1">
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 ml-1">Persona Name</label>
                          <input type="text" className="w-full bg-neutral-100 dark:bg-black/30 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white focus:outline-none focus:border-brand/50 transition-colors font-medium relative z-20" placeholder="e.g. Database Architect" value={newName} onChange={e=>setNewName(e.target.value)} />
                       </div>
                       <div className="w-1/3">
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 ml-1">Trigger Keyword</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand font-bold">@</span>
                             <input type="text" className="w-full bg-neutral-100 dark:bg-black/30 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-8 pr-4 py-3 text-neutral-900 dark:text-white focus:outline-none focus:border-brand/50 transition-colors font-mono font-medium z-20 relative" placeholder="keyword" value={newKey} onChange={e=>setNewKey(e.target.value.replace(/[^a-zA-Z0-9_-]/g,''))} />
                          </div>
                       </div>
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 ml-1">Logic Block (System Instruction)</label>
                       <textarea 
                          className="w-full bg-neutral-100 dark:bg-black/30 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-4 text-neutral-900 dark:text-white focus:outline-none focus:border-brand/50 transition-colors h-40 resize-none font-serif tracking-wide leading-relaxed custom-scrollbar z-20 relative" 
                          placeholder="You are an expert... You will strictly follow these logic directives..."
                          value={newInst} onChange={e=>setNewInst(e.target.value)}
                       />
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 ml-1">Tool Authorizations</label>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.keys(newTools).map((toolName) => (
                             <label key={toolName} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${newTools[toolName as keyof ToolConfig] ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-neutral-50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'}`}>
                                <input 
                                   type="checkbox" 
                                   className="hidden" 
                                   checked={newTools[toolName as keyof ToolConfig]} 
                                   onChange={(e) => setNewTools(prev => ({...prev, [toolName]: e.target.checked}))}
                                />
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${newTools[toolName as keyof ToolConfig] ? 'bg-brand border-brand text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                   {newTools[toolName as keyof ToolConfig] && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <span className="text-xs font-mono font-medium truncate">{toolName.replace(/_/g, ' ')}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black/20 shrink-0 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={handleSaveCustomSkill} className="px-6 py-2.5 rounded-xl font-medium bg-brand hover:bg-brand-hover text-white transition-all shadow-lg shadow-brand/20 active:scale-95 flex items-center gap-2">
                       <Save size={16} /> Deploy Agent
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
