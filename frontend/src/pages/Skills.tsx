import { useState, useEffect } from 'react';
import { Bot, Plus, X, Terminal, Globe, Code, FilePlus, Eye, Save, Trash2, Wand2, Search, BookOpen, ExternalLink, Check, Sparkles, Filter, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

interface ScientificSkill {
  id: string;
  name: string;
  keyword: string;
  category: string;
  description: string;
  version: string;
  author: string;
  license: string;
  allowed_tools: string;
  is_curated: boolean;
  badge: string;
  stars: number;
  has_scripts: boolean;
}

interface SkillDetail {
  id: string;
  name: string;
  keyword: string;
  category: string;
  body: string;
  scripts: string[];
  full_markdown: string;
}

export default function Skills() {
  const [activeTab, setActiveTab] = useState<'personas' | 'scientific'>('scientific');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Scientific Skills Hub State
  const [scientificSkills, setScientificSkills] = useState<ScientificSkill[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingSci, setIsLoadingSci] = useState(false);
  const [installedKeywords, setInstalledKeywords] = useState<Set<string>>(new Set());
  const [installingId, setInstallingId] = useState<string | null>(null);

  // Skill Guide Viewer Modal
  const [selectedDetail, setSelectedDetail] = useState<SkillDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // New Custom Skill Form State
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

    // 2. Load Custom Personas from localStorage
    const customStored = localStorage.getItem('openzess_custom_skills');
    let custom: Skill[] = [];
    const installedSet = new Set<string>();
    
    if (customStored) {
      try {
        const parsed = JSON.parse(customStored);
        custom = Object.keys(parsed).map(k => {
          installedSet.add(k);
          return {
            key: k,
            ...parsed[k],
            isCustom: true
          };
        });
      } catch (e) {
        console.error("Failed to parse custom skills", e);
      }
    }

    setInstalledKeywords(installedSet);
    setSkills([...defaults, ...custom]);
  };
  
  const loadScientificSkills = async () => {
    try {
      setIsLoadingSci(true);
      const res = await axios.get('http://127.0.0.1:8000/api/skills/scientific');
      if (res.data && res.data.skills) {
        setScientificSkills(res.data.skills);
        setCategories(['All', ...(res.data.categories || [])]);
      }
    } catch (err) {
      console.error("Failed to fetch scientific skills from backend", err);
    } finally {
      setIsLoadingSci(false);
    }
  };

  useEffect(() => {
    loadSkills();
    loadScientificSkills();
  }, []);

  const handleInstallScientificSkill = async (sciSkill: ScientificSkill) => {
    try {
      setInstallingId(sciSkill.id);
      const res = await axios.post('http://127.0.0.1:8000/api/skills/scientific/install', {
        skill_id: sciSkill.id
      });

      if (res.data && res.data.persona) {
        const persona = res.data.persona;
        const customStored = localStorage.getItem('openzess_custom_skills');
        let customMap: Record<string, any> = {};
        if (customStored) {
          try { customMap = JSON.parse(customStored); } catch(e) { console.error(e); }
        }

        customMap[persona.key] = {
          name: persona.name,
          instruction: persona.instruction,
          tools: persona.tools
        };

        localStorage.setItem('openzess_custom_skills', JSON.stringify(customMap));
        window.dispatchEvent(new Event('persona-changed'));
        loadSkills();
      }
    } catch (err) {
      console.error("Failed to install scientific skill", err);
      alert("Failed to install scientific skill to Swarm.");
    } finally {
      setInstallingId(null);
    }
  };

  const handleOpenDetail = async (skillId: string) => {
    try {
      setIsLoadingDetail(true);
      const res = await axios.get(`http://127.0.0.1:8000/api/skills/scientific/${skillId}`);
      if (res.data) {
        setSelectedDetail(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch skill details", err);
      alert("Failed to read skill manual.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSaveCustomSkill = () => {
    if (!newKey.trim() || !newName.trim() || !newInst.trim()) {
       alert("Keyword, Name, and Logic Block are completely required.");
       return;
    }
    
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
    window.dispatchEvent(new Event('persona-changed'));
    setIsModalOpen(false);
    resetForm();
    loadSkills();
  };
  
  const handleDeleteCustomSkill = (key: string) => {
    if (!window.confirm(`Delete the custom @${key} skill from Swarm?`)) return;
    
    const customStored = localStorage.getItem('openzess_custom_skills');
    if (!customStored) return;
    try {
        const customMap = JSON.parse(customStored);
        delete customMap[key];
        localStorage.setItem('openzess_custom_skills', JSON.stringify(customMap));
        window.dispatchEvent(new Event('persona-changed'));
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

  // Filtered Scientific Skills
  const filteredScientificSkills = scientificSkills.filter(s => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.keyword.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-6 lg:p-10 overflow-hidden relative">
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full relative z-10">
        
        {/* Header with Title and Tabs */}
        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between shrink-0 border-b border-[#E2DAD2] dark:border-[#3A3838] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> K-Dense-AI Validated Skills Library
              </span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-[#3A3838] dark:text-[#E2DAD2] tracking-tight">
              <Wand2 className="text-brand" /> Agent Skills Hub
            </h1>
            <p className="text-sm text-[#3A3838]/80 dark:text-[#B8AFA8] mt-1">
              Equip OpenZess with 160+ specialized scientific skills, data pipelines, and hot-swappable swarm agents.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tab Selector */}
            <div className="bg-[#EDE8E2] dark:bg-[#252222] p-1 rounded-2xl flex items-center border border-[#E2DAD2] dark:border-[#3A3838]">
              <button
                onClick={() => setActiveTab('scientific')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'scientific' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-[#3A3838]/70 dark:text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#E2DAD2]'}`}
              >
                <BookOpen size={14} /> Scientific Skills ({scientificSkills.length})
              </button>
              <button
                onClick={() => setActiveTab('personas')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'personas' ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-[#3A3838]/70 dark:text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#E2DAD2]'}`}
              >
                <Bot size={14} /> Swarm Personas ({skills.length})
              </button>
            </div>

            {activeTab === 'personas' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand/20 hover:shadow-brand/40 active:scale-95 shrink-0"
              >
                <Plus size={16} /> Custom Agent
              </button>
            )}
          </div>
        </header>

        {/* Tab 1: Scientific Skills Hub */}
        {activeTab === 'scientific' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search and Category Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-5 shrink-0 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8AFA8]" />
                <input
                  type="text"
                  placeholder="Search scientific skills, tools, methods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#252222] border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl pl-10 pr-4 py-2 text-sm text-[#3A3838] dark:text-[#E2DAD2] placeholder-[#B8AFA8] focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[#3A3838] text-white dark:bg-[#E2DAD2] dark:text-[#1E1C1C] shadow-sm' : 'bg-[#EDE8E2] dark:bg-[#252222] text-[#3A3838]/70 dark:text-[#B8AFA8] hover:bg-[#E2DAD2] dark:hover:bg-[#302D2D]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scientific Skills Grid */}
            <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
              {isLoadingSci ? (
                <div className="flex flex-col items-center justify-center h-64 text-[#B8AFA8]">
                  <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-medium">Scanning K-Dense-AI scientific library...</p>
                </div>
              ) : filteredScientificSkills.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#1E1C1C]/40 border border-dashed border-[#E2DAD2] dark:border-[#3A3838] rounded-3xl p-8">
                  <BookOpen size={36} className="mx-auto text-[#B8AFA8] mb-3 opacity-40" />
                  <p className="text-[#3A3838] dark:text-[#E2DAD2] font-semibold mb-1">No scientific skills match your search</p>
                  <p className="text-xs text-[#B8AFA8]">Try adjusting keywords or selecting "All" categories.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredScientificSkills.map((skill, i) => {
                    const isInstalled = installedKeywords.has(skill.keyword);
                    const isBusy = installingId === skill.id;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        key={skill.id}
                        className={`bg-white dark:bg-[#1E1C1C]/70 border rounded-2xl p-5 flex flex-col justify-between transition-all group hover:shadow-md ${skill.is_curated ? 'border-brand/40 shadow-sm' : 'border-[#E2DAD2] dark:border-[#3A3838]'}`}
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-md truncate">
                              {skill.badge || skill.category}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-[#8C7A6B] dark:text-[#A89080]">
                              v{skill.version}
                            </span>
                          </div>

                          {/* Skill Name & Keyword */}
                          <div className="mb-2">
                            <h3 className="font-bold text-base text-[#3A3838] dark:text-[#E2DAD2] group-hover:text-brand transition-colors line-clamp-1">
                              {skill.name}
                            </h3>
                            <div className="text-xs font-mono font-bold text-brand mt-0.5">
                              @{skill.keyword}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-[#3A3838]/80 dark:text-[#B8AFA8] leading-relaxed mb-4 line-clamp-3">
                            {skill.description}
                          </p>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-[#E2DAD2] dark:border-[#3A3838]/60 flex items-center justify-between gap-2 mt-auto">
                          <button
                            onClick={() => handleOpenDetail(skill.id)}
                            className="text-xs font-semibold text-[#3A3838]/80 dark:text-[#B8AFA8] hover:text-brand flex items-center gap-1 transition-colors px-2 py-1.5 rounded-lg hover:bg-[#EDE8E2] dark:hover:bg-[#252222]"
                          >
                            <FileText size={13} /> View Guide
                          </button>

                          {isInstalled ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                              <Check size={13} /> Added to Swarm
                            </span>
                          ) : (
                            <button
                              onClick={() => handleInstallScientificSkill(skill)}
                              disabled={isBusy}
                              className="text-xs font-bold text-white bg-brand hover:bg-brand-hover px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isBusy ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <><Plus size={13} /> Add to Swarm</>
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Swarm Personas (Active Agent Identities) */}
        {activeTab === 'personas' && (
          <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {skills.map((skill, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={skill.key}
                  className="bg-white dark:bg-[#1E1C1C]/60 border border-[#E2DAD2] dark:border-[#3A3838] rounded-3xl p-6 relative overflow-hidden flex flex-col shadow-sm dark:shadow-none hover:border-brand/40 transition-colors group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                     <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white ${skill.isCustom ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-violet-500 to-brand-hover'}`}>
                            <Bot size={20} />
                         </div>
                         <div>
                            <h3 className="font-semibold text-[#3A3838] dark:text-[#E2DAD2]">{skill.name}</h3>
                            <div className="text-xs font-mono font-bold text-brand mt-0.5">@{skill.key}</div>
                         </div>
                     </div>
                     {skill.isCustom && (
                        <button 
                            onClick={() => handleDeleteCustomSkill(skill.key)}
                            title="Remove from Swarm"
                            className="text-[#B8AFA8] hover:text-rose-500 p-2 rounded-lg bg-transparent transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                            <Trash2 size={16} />
                        </button>
                     )}
                     {!skill.isCustom && (
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#B8AFA8] bg-[#EDE8E2] dark:bg-[#2A2828] px-2 py-1 rounded-md">Core Persona</div>
                     )}
                  </div>
                  
                  <div className="bg-[#EDE8E2] dark:bg-black/30 rounded-xl p-4 border border-[#E2DAD2] dark:border-[#3A3838]/60 mb-5 flex-1 max-h-[120px] overflow-y-auto custom-scrollbar">
                     <p className="text-sm font-medium text-[#3A3838]/80 dark:text-[#E2DAD2]/80 leading-relaxed font-serif tracking-wide">{skill.instruction}</p>
                  </div>
                  
                  <div className="border-t border-[#E2DAD2] dark:border-[#3A3838]/50 pt-4 flex flex-wrap gap-2 text-xs font-medium text-[#B8AFA8] w-full relative z-10">
                     {skill.tools.run_terminal_command && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EDE8E2] dark:bg-[#2A2828]/80 rounded-md border border-[#E2DAD2]/50 dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2]/80"><Terminal size={12}/> Terminal</span>}
                     {skill.tools.search_the_web && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EDE8E2] dark:bg-[#2A2828]/80 rounded-md border border-[#E2DAD2]/50 dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2]/80"><Globe size={12}/> Web</span>}
                     {skill.tools.read_web_page && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EDE8E2] dark:bg-[#2A2828]/80 rounded-md border border-[#E2DAD2]/50 dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2]/80"><Eye size={12}/> Scrape</span>}
                     {skill.tools.edit_code && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EDE8E2] dark:bg-[#2A2828]/80 rounded-md border border-[#E2DAD2]/50 dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2]/80"><Code size={12}/> Code</span>}
                     {skill.tools.create_file && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EDE8E2] dark:bg-[#2A2828]/80 rounded-md border border-[#E2DAD2]/50 dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2]/80"><FilePlus size={12}/> Files</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Skill Guide Viewer Modal */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedDetail(null)}
              className="absolute inset-0 bg-[#1E1C1C]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-[#E2DAD2] dark:border-[#3A3838] flex justify-between items-center bg-[#EDE8E2] dark:bg-[#252222] shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand">{selectedDetail.category}</span>
                  <h2 className="text-xl font-bold text-[#3A3838] dark:text-[#E2DAD2] flex items-center gap-2">
                    <BookOpen size={20} className="text-brand"/> {selectedDetail.name}
                  </h2>
                  <div className="text-xs font-mono font-bold text-brand mt-0.5">@{selectedDetail.keyword}</div>
                </div>
                <button 
                  onClick={() => setSelectedDetail(null)} 
                  className="text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#E2DAD2] transition-colors bg-white dark:bg-[#2A2828] h-8 w-8 flex items-center justify-center rounded-full border border-[#E2DAD2] dark:border-[#3A3838]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedDetail.body}
                </ReactMarkdown>
              </div>

              <div className="p-5 border-t border-[#E2DAD2] dark:border-[#3A3838] bg-[#EDE8E2] dark:bg-[#252222] shrink-0 flex items-center justify-between">
                <span className="text-xs text-[#B8AFA8]">Author: K-Dense Inc. • Open Agent Skills Standard</span>
                <button
                  onClick={() => {
                    const found = scientificSkills.find(s => s.id === selectedDetail.id);
                    if (found) handleInstallScientificSkill(found);
                    setSelectedDetail(null);
                  }}
                  className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add to Swarm (@{selectedDetail.keyword})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Swarm Agent Builder Modal */}
      <AnimatePresence>
        {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }} 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute inset-0 bg-[#1E1C1C]/60 backdrop-blur-sm"
              />
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                 animate={{ opacity: 1, scale: 1, y: 0 }} 
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                 <div className="p-6 border-b border-[#E2DAD2] dark:border-[#3A3838] flex justify-between items-center bg-[#EDE8E2] dark:bg-[#1E1C1C]/20 shrink-0">
                    <h2 className="text-xl font-bold text-[#3A3838] dark:text-[#E2DAD2] flex items-center gap-2"><Wand2 size={20} className="text-brand"/> Create Swarm Agent</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-[#B8AFA8] hover:text-[#3A3838] dark:hover:text-[#E2DAD2] transition-colors bg-white dark:bg-[#2A2828] h-8 w-8 flex items-center justify-center rounded-full border border-[#E2DAD2] dark:border-[#3A3838]"><X size={16} /></button>
                 </div>
                 
                 <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    <div className="flex gap-6">
                       <div className="flex-1">
                          <label className="block text-xs font-bold text-[#B8AFA8] uppercase tracking-widest mb-2 ml-1">Persona Name</label>
                          <input type="text" className="w-full bg-[#EDE8E2] dark:bg-black/30 border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl px-4 py-3 text-[#3A3838] dark:text-[#E2DAD2] focus:outline-none focus:border-brand/50 transition-colors font-medium relative z-20" placeholder="e.g. Database Architect" value={newName} onChange={e=>setNewName(e.target.value)} />
                       </div>
                       <div className="w-1/3">
                          <label className="block text-xs font-bold text-[#B8AFA8] uppercase tracking-widest mb-2 ml-1">Trigger Keyword</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand font-bold">@</span>
                             <input type="text" className="w-full bg-[#EDE8E2] dark:bg-black/30 border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl pl-8 pr-4 py-3 text-[#3A3838] dark:text-[#E2DAD2] focus:outline-none focus:border-brand/50 transition-colors font-mono font-medium z-20 relative" placeholder="keyword" value={newKey} onChange={e=>setNewKey(e.target.value.replace(/[^a-zA-Z0-9_-]/g,''))} />
                          </div>
                       </div>
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold text-[#B8AFA8] uppercase tracking-widest mb-2 ml-1">Logic Block (System Instruction)</label>
                       <textarea 
                          className="w-full bg-[#EDE8E2] dark:bg-black/30 border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl px-4 py-4 text-[#3A3838] dark:text-[#E2DAD2] focus:outline-none focus:border-brand/50 transition-colors h-40 resize-none font-serif tracking-wide leading-relaxed custom-scrollbar z-20 relative" 
                          placeholder="You are an expert... You will strictly follow these logic directives..."
                          value={newInst} onChange={e=>setNewInst(e.target.value)}
                       />
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold text-[#B8AFA8] uppercase tracking-widest mb-4 ml-1">Tool Authorizations</label>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.keys(newTools).map((toolName) => (
                             <label key={toolName} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${newTools[toolName as keyof ToolConfig] ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-[#EDE8E2] dark:bg-[#2A2828]/30 border-[#E2DAD2] dark:border-[#3A3838] text-[#3A3838]/80 dark:text-[#B8AFA8] hover:border-[#E2DAD2] dark:hover:border-[#3A3838]'}`}>
                                <input 
                                   type="checkbox" 
                                   className="hidden" 
                                   checked={newTools[toolName as keyof ToolConfig]} 
                                   onChange={(e) => setNewTools(prev => ({...prev, [toolName]: e.target.checked}))}
                                />
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${newTools[toolName as keyof ToolConfig] ? 'bg-brand border-brand text-white' : 'border-[#E2DAD2] dark:border-[#3A3838]/80'}`}>
                                   {newTools[toolName as keyof ToolConfig] && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <span className="text-xs font-mono font-medium truncate">{toolName.replace(/_/g, ' ')}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-6 border-t border-[#E2DAD2] dark:border-[#3A3838] bg-[#EDE8E2] dark:bg-[#1E1C1C]/20 shrink-0 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-[#3A3838]/80 dark:text-[#B8AFA8] hover:bg-[#E2DAD2] dark:hover:bg-[#2A2828] transition-colors">Cancel</button>
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
