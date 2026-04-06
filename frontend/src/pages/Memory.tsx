import { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Trash2, Search, AlertTriangle, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Memory {
  id: string;
  document: string;
  metadata?: Record<string, unknown>;
}

export default function MemoryVault() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/memory');
      if (response.data.memories) {
        setMemories(response.data.memories.reverse()); // Show newest first
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/memory/${id}`);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete memory:', error);
      alert('Error deleting memory.');
    }
  };

  const clearAllMemories = async () => {
    if (!window.confirm("Are you entirely sure you want to wipe the agent's long-term memory? This cannot be undone.")) return;
    try {
      await axios.delete('http://localhost:8000/api/memory');
      setMemories([]);
    } catch (error) {
      console.error('Failed to clear memories:', error);
      alert('Error clearing the vault.');
    }
  };

  const filteredMemories = memories.filter(m => 
    m.document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        <header className="mb-8 flex items-end justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white mb-2 tracking-tight">
              <Database className="text-brand" /> Agent Memory Vault
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">Manage the semantic embeddings and long-term context stored by openzess.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Search memories..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 pl-11 pr-4 py-2.5 rounded-xl w-64 focus:outline-none focus:border-brand/40 shadow-sm dark:shadow-none transition-colors text-sm font-medium"
                />
             </div>
             
             <button 
                onClick={clearAllMemories}
                disabled={memories.length === 0}
                className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <AlertTriangle size={16} /> Wipe Vault
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 rounded-full border-t-2 border-brand animate-spin"></div>
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800/60 border-dashed mt-10 shadow-sm dark:shadow-none transition-colors">
              <Database size={48} className="text-neutral-400 dark:text-neutral-600 mb-4" />
              <h2 className="text-xl font-medium text-neutral-800 dark:text-neutral-300 mb-2">The Vault is Empty</h2>
              <p className="text-neutral-500 text-center max-w-md">Your agent hasn't formed any long-term memories yet. Start interacting in the chat to build its context base.</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center p-10 text-neutral-500">No memories match your search query.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {filteredMemories.map((memory, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    key={memory.id}
                    className="group bg-white dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800/80 hover:border-brand/40 transition-all rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-black/40 rounded-full border border-neutral-200 dark:border-white/5">
                          <Fingerprint size={12} className="text-brand" />
                          <span className="text-[10px] font-mono text-neutral-500 tracking-wider truncate w-24">{memory.id.split('-')[0]}</span>
                       </div>
                       
                       <button 
                         onClick={() => deleteMemory(memory.id)}
                         className="text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                         title="Delete Memory"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                    
                    <div className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed overflow-y-auto custom-scrollbar pr-2 pb-2 line-clamp-4">
                       {memory.document}
                    </div>
                    
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
