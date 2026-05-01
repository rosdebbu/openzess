import { useEffect, useState } from 'react';
import axios from 'axios';
import { Wrench, Search, Zap, Terminal, Globe, Eye, Code, FilePlus, Cpu, Sparkles, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface Tool {
  name: string;
  description: string;
}

const getToolIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('terminal') || n.includes('command') || n.includes('shell') || n.includes('run')) return <Terminal size={22} />;
  if (n.includes('web') || n.includes('search') || n.includes('browse') || n.includes('internet')) return <Globe size={22} />;
  if (n.includes('read') || n.includes('view') || n.includes('scrape')) return <Eye size={22} />;
  if (n.includes('code') || n.includes('edit') || n.includes('write') || n.includes('patch')) return <Code size={22} />;
  if (n.includes('file') || n.includes('create') || n.includes('save')) return <FilePlus size={22} />;
  if (n.includes('memory') || n.includes('recall')) return <Cpu size={22} />;
  if (n.includes('ai') || n.includes('generate') || n.includes('llm')) return <Sparkles size={22} />;
  if (n.includes('auth') || n.includes('secure') || n.includes('key')) return <Shield size={22} />;
  return <Wrench size={22} />;
};

const getToolGradient = (index: number) => {
  const gradients = [
    'from-[#A89080]/20 to-violet-500/20',
    'from-emerald-500/20 to-cyan-500/20',
    'from-amber-500/20 to-orange-500/20',
    'from-pink-500/20 to-rose-500/20',
    'from-blue-500/20 to-[#A89080]/20',
    'from-violet-500/20 to-[#3A3838]/20',
    'from-cyan-500/20 to-teal-500/20',
    'from-rose-500/20 to-red-500/20',
  ];
  return gradients[index % gradients.length];
};

const getToolIconColor = (index: number) => {
  const colors = [
    'text-brand',
    'text-emerald-400',
    'text-amber-400',
    'text-pink-400',
    'text-blue-400',
    'text-violet-400',
    'text-cyan-400',
    'text-rose-400',
  ];
  return colors[index % colors.length];
};

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:8000/api/tools').then(res => setTools(res.data.tools)).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const filteredTools = tools.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 border-b border-[#E2DAD2] dark:border-[#3A3838] pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-[#3A3838] dark:text-[#E2DAD2] mb-2 tracking-tight">
              <Zap className="text-brand" /> Native Skills & Tools
            </h1>
            <p className="text-[#3A3838]/80 dark:text-[#B8AFA8]">
              Available capabilities openzess can invoke natively during agent execution.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-xl border border-brand/20 font-semibold text-sm shadow-sm">
              <Wrench size={16} /> {tools.length} Tools
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8AFA8] dark:text-[#B8AFA8]" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2] pl-11 pr-4 py-2.5 rounded-xl w-56 focus:outline-none focus:border-brand/40 shadow-sm dark:shadow-none transition-colors text-sm font-medium"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 rounded-full border-t-2 border-brand animate-spin"></div>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-[#1E1C1C]/40 rounded-3xl border border-[#E2DAD2] dark:border-[#3A3838]/60 border-dashed mt-10">
              <Wrench size={48} className="text-[#B8AFA8] dark:text-[#3A3838]/80 mb-4" />
              <h2 className="text-xl font-medium text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2">{searchTerm ? 'No matching tools' : 'No tools available'}</h2>
              <p className="text-[#B8AFA8] text-center max-w-md">{searchTerm ? 'Try adjusting your search query.' : 'The agent hasn\'t loaded any native tools yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTools.map((t, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  key={i}
                  className="bg-white dark:bg-[#1E1C1C]/60 border border-[#E2DAD2] dark:border-[#3A3838] rounded-3xl overflow-hidden flex flex-col shadow-sm dark:shadow-none hover:border-brand/40 hover:-translate-y-0.5 transition-all group"
                >
                  {/* Gradient Banner */}
                  <div className={`h-16 bg-gradient-to-r ${getToolGradient(i)} relative overflow-hidden flex items-center px-6`}>
                    <div className="absolute -right-3 -bottom-3 opacity-15 transform -rotate-12">
                      {getToolIcon(t.name)}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1 -mt-5 relative">
                    {/* Floating Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] flex items-center justify-center mb-4 shadow-lg ${getToolIconColor(i)} group-hover:scale-105 transition-transform`}>
                      {getToolIcon(t.name)}
                    </div>
                    
                    <h3 className="font-bold text-[#3A3838] dark:text-[#E2DAD2] mb-2 font-mono text-sm leading-tight">{t.name}</h3>
                    <p className="text-[#B8AFA8] dark:text-[#B8AFA8] text-sm leading-relaxed flex-1">{t.description}</p>
                    
                    <div className="mt-4 pt-3 border-t border-[#E2DAD2] dark:border-[#3A3838]/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AFA8] bg-[#EDE8E2] dark:bg-white/5 px-2 py-1 rounded-md border border-[#E2DAD2] dark:border-[#3A3838]">Native Tool</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
