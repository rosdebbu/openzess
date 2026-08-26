import React, { useEffect, useState } from 'react';
import { 
  Brain, Dna, Database, Cpu, RefreshCw, Search, Plus, Trash2, 
  Code2, CheckCircle2, Copy, Sparkles, Activity
} from 'lucide-react';
import axios from 'axios';

interface PluginSkill {
  filename: string;
  name: string;
  code: string;
  size_bytes: number;
  line_count: number;
  tools: { name: string; description: string }[];
}

interface MemoryItem {
  id: string;
  concept: string;
  document: string;
  tags: string;
  score?: number | null;
}

interface TelemetryData {
  status: string;
  uptime_seconds: number;
  python_engine: string;
  rust_sidecar: {
    enabled: boolean;
    healthy: boolean;
    url: string;
  };
  memory_vault: {
    status: string;
    total_documents: number;
  };
  skills_active: number;
}

export default function BrainEvolution() {
  const [activeTab, setActiveTab] = useState<'skills' | 'memories' | 'telemetry'>('skills');
  
  // Skills state
  const [skills, setSkills] = useState<PluginSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<PluginSkill | null>(null);
  const [totalTools, setTotalTools] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  // Memories state
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConcept, setNewConcept] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newTags, setNewTags] = useState('general');

  // Telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch Skills
  const fetchSkills = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/brain/skills');
      setSkills(res.data.skills || []);
      setTotalTools(res.data.total_tools || 0);
      if (res.data.skills && res.data.skills.length > 0 && !selectedSkill) {
        setSelectedSkill(res.data.skills[0]);
      }
    } catch (e) {
      console.error('Failed to load skills:', e);
    }
  };

  // Fetch Memories
  const fetchMemories = async (query?: string) => {
    try {
      const url = query && query.trim() 
        ? `http://localhost:8000/api/brain/memories?query=${encodeURIComponent(query)}`
        : 'http://localhost:8000/api/brain/memories';
      const res = await axios.get(url);
      setMemories(res.data.memories || []);
    } catch (e) {
      console.error('Failed to load memories:', e);
    }
  };

  // Fetch Telemetry
  const fetchTelemetry = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/brain/telemetry');
      setTelemetry(res.data);
    } catch (e) {
      console.error('Failed to load telemetry:', e);
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchMemories();
    fetchTelemetry();
  }, []);

  const handleReloadSkills = async () => {
    setIsReloading(true);
    try {
      await axios.post('http://localhost:8000/api/brain/skills/reload');
      await fetchSkills();
      await fetchTelemetry();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReloading(false);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcept.trim() || !newDetails.trim()) return;

    try {
      await axios.post('http://localhost:8000/api/brain/memories', {
        concept: newConcept,
        details: newDetails,
        tags: newTags
      });
      setNewConcept('');
      setNewDetails('');
      setNewTags('general');
      setShowAddModal(false);
      fetchMemories();
      fetchTelemetry();
    } catch (e) {
      console.error('Failed to store memory:', e);
    }
  };

  const handleDeleteMemory = async (docId: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/brain/memories/${encodeURIComponent(docId)}`);
      setMemories(prev => prev.filter(m => m.id !== docId));
      fetchTelemetry();
    } catch (e) {
      console.error('Failed to delete memory:', e);
    }
  };

  const handleCopyCode = () => {
    if (!selectedSkill) return;
    navigator.clipboard.writeText(selectedSkill.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#EDE8E2] dark:bg-[#1E1C1C] overflow-hidden relative font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/60 dark:bg-[#1A1818]/60 backdrop-blur-md border-b border-[#E2DAD2] dark:border-border shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center shadow-inner">
            <Brain size={22} className="text-brand animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
              Agent Brain & Evolution
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/30">Self-Growing</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ChromaDB Memory Vault · Dynamic Skill Synthesizer · Hybrid Rust Acceleration
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-[#E2DAD2]/50 dark:bg-surface p-1 rounded-xl border border-[#E2DAD2] dark:border-[#3A3838]">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'skills' ? 'bg-brand text-white shadow' : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
            }`}
          >
            <Dna size={14} /> Learned Skills ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'memories' ? 'bg-brand text-white shadow' : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
            }`}
          >
            <Database size={14} /> Memory Vault ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry' ? 'bg-brand text-white shadow' : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu size={14} /> Telemetry
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        
        {/* TAB 1: LEARNED SKILLS VAULT */}
        {activeTab === 'skills' && (
          <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
            {/* Left Sidebar: Skill List */}
            <div className="col-span-4 flex flex-col bg-white/70 dark:bg-[#161414] border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl overflow-hidden shadow-lg">
              <div className="p-3.5 bg-black/5 dark:bg-black/20 border-b border-[#E2DAD2] dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dna size={16} className="text-brand" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider">Synthesized Plugins</span>
                </div>
                <button
                  onClick={handleReloadSkills}
                  disabled={isReloading}
                  className="px-2 py-1 bg-white/10 hover:bg-brand/20 text-neutral-300 hover:text-brand border border-white/10 rounded text-[11px] font-mono transition-all flex items-center gap-1"
                >
                  <RefreshCw size={11} className={isReloading ? 'animate-spin' : ''} /> Reload
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {skills.map(skill => (
                  <div
                    key={skill.filename}
                    onClick={() => setSelectedSkill(skill)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSkill?.filename === skill.filename
                        ? 'bg-brand/10 border-brand text-neutral-900 dark:text-white shadow-md'
                        : 'bg-white/40 dark:bg-white/5 border-transparent hover:border-white/10 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Code2 size={13} className="text-brand" /> {skill.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">{skill.line_count} lines</span>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate mb-2">
                      {skill.filename}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {skill.tools.map(t => (
                        <span key={t.name} className="px-1.5 py-0.5 rounded bg-black/20 text-brand text-[10px] font-mono border border-brand/20">
                          @{t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Source Code & Schema Inspector */}
            <div className="col-span-8 flex flex-col bg-[#121111] border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl overflow-hidden shadow-lg">
              {selectedSkill ? (
                <>
                  <div className="px-4 py-3 bg-[#1A1818] border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <Code2 size={16} className="text-brand" />
                      <div>
                        <span className="text-xs font-bold text-white font-mono">{selectedSkill.filename}</span>
                        <span className="text-[10px] text-neutral-500 ml-3">({(selectedSkill.size_bytes / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-mono transition-all flex items-center gap-1.5"
                    >
                      {copiedCode ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedCode ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-neutral-300 bg-black/40 custom-scrollbar leading-relaxed">
                    <pre className="whitespace-pre-wrap">{selectedSkill.code}</pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-xs font-mono">
                  Select a skill on the left to inspect its live Python code.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VECTOR MEMORY VAULT */}
        {activeTab === 'memories' && (
          <div className="flex-1 flex flex-col bg-white/70 dark:bg-[#161414] border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl overflow-hidden shadow-lg">
            {/* Search & Actions Bar */}
            <div className="p-4 bg-black/5 dark:bg-black/20 border-b border-[#E2DAD2] dark:border-white/5 flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchMemories(e.target.value);
                  }}
                  placeholder="Semantic search memories in ChromaDB Vector Vault..."
                  className="w-full bg-white/40 dark:bg-black/40 border border-[#E2DAD2] dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-brand"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl transition-all shadow flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} /> Add Concept
              </button>
            </div>

            {/* Memories Grid */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {memories.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs font-mono text-center">
                  <Database size={32} className="text-neutral-400 mb-2 opacity-50" />
                  <span>No memories found matching your search.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memories.map(m => (
                    <div
                      key={m.id}
                      className="bg-white/60 dark:bg-black/30 border border-[#E2DAD2] dark:border-white/5 hover:border-brand/40 p-4 rounded-xl shadow transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles size={13} className="text-brand shrink-0" />
                            <span>{m.concept}</span>
                          </h3>
                          <button
                            onClick={() => handleDeleteMemory(m.id)}
                            className="text-neutral-400 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete memory"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap line-clamp-5 mb-3">
                          {m.document}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#E2DAD2] dark:border-white/5 text-[10px] font-mono text-neutral-400">
                        <span className="px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                          #{m.tags}
                        </span>
                        <span>{m.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HYBRID TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
            {/* Card 1: Python Brain */}
            <div className="bg-white/70 dark:bg-[#161414] border border-[#E2DAD2] dark:border-[#3A3838] p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">Core AI Runtime</span>
                  <Activity size={18} className="text-emerald-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">FastAPI + LiteLLM</h3>
                <p className="text-xs text-neutral-500 font-mono mb-6">Python 3.12 · Async Event Loop</p>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 border-b border-white/5 pb-2">
                    <span>Server Uptime:</span>
                    <span className="text-white font-bold">{telemetry?.uptime_seconds || 0}s</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 border-b border-white/5 pb-2">
                    <span>Active Custom Tools:</span>
                    <span className="text-brand font-bold">{totalTools} tools</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Tool-Calling Protocol:</span>
                    <span className="text-emerald-400 font-bold">Native Hermes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Rust Sidecar Acceleration */}
            <div className="bg-white/70 dark:bg-[#161414] border border-[#E2DAD2] dark:border-[#3A3838] p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">Native Sidecar</span>
                  <Cpu size={18} className="text-brand" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Rust Axum Engine</h3>
                <p className="text-xs text-neutral-500 font-mono mb-6">SIMD Math · 60FPS Video Encoder</p>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 border-b border-white/5 pb-2">
                    <span>Sidecar Port:</span>
                    <span className="text-white font-bold">localhost:8100</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 border-b border-white/5 pb-2">
                    <span>Active Features:</span>
                    <span className="text-brand font-bold">Vector Top-K, Graph BFS</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Fail-Safe Fallback:</span>
                    <span className="text-emerald-400 font-bold">Pillow & NumPy Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Memory Vault */}
            <div className="bg-white/70 dark:bg-[#161414] border border-[#E2DAD2] dark:border-[#3A3838] p-6 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">Vector Storage</span>
                  <Database size={18} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">ChromaDB Vault</h3>
                <p className="text-xs text-neutral-500 font-mono mb-6">Persistent Knowledge Embeddings</p>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 border-b border-white/5 pb-2">
                    <span>Collection Name:</span>
                    <span className="text-white font-bold">openzess_memory</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400 border-b border-white/5 pb-2">
                    <span>Stored Memories:</span>
                    <span className="text-purple-400 font-bold">{telemetry?.memory_vault.total_documents || memories.length} records</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Auto-Recall Hook:</span>
                    <span className="text-emerald-400 font-bold">Top-3 Ranked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1818] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Brain size={18} className="text-brand" /> Add Concept to Memory Vault
            </h2>
            <form onSubmit={handleCreateMemory} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Concept Title</label>
                <input
                  type="text"
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  placeholder="e.g., Rust Axum Routing Pattern"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Details & Learnings</label>
                <textarea
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Explain the architectural pattern, code fix, or key insight..."
                  required
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-400 block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="rust, architecture, fast-api"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 hover:bg-white/5 text-neutral-400 hover:text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold transition-all shadow"
                >
                  Persist Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
