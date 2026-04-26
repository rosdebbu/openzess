import { useEffect, useState, useRef } from 'react';
import { GitBranch, Circle, ArrowRight, Layers, AlertTriangle, RefreshCw, ExternalLink, Info, X } from 'lucide-react';

interface GraphStats {
  nodes: number;
  edges: number;
  communities: number;
  extraction: string;
  godNodes: { name: string; edges: number }[];
  gaps: string[];
  surprises: string[];
  loaded: boolean;
}

const BASE_URL = 'http://localhost:8000';

export default function Graphify() {
  const [stats, setStats] = useState<GraphStats>({
    nodes: 305,
    edges: 409,
    communities: 19,
    extraction: '81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS',
    godNodes: [
      { name: 'OpenzessAgent', edges: 32 },
      { name: 'MCPManager', edges: 13 },
      { name: 'chat()', edges: 10 },
      { name: 'start()', edges: 7 },
      { name: 'verify_sandbox_environment()', edges: 7 },
    ],
    gaps: [
      '9 isolated nodes detected',
      'Thin community: swarm_manager.py',
      'Weak cohesion in Community 0 (0.09)',
    ],
    surprises: [
      'swarm squad → OpenzessAgent [INFERRED]',
      'toggleListen() → start() [INFERRED]',
    ],
    loaded: false,
  });

  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'gods' | 'gaps'>('overview');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [graphKey, setGraphKey] = useState(0);

  useEffect(() => {
    // Fetch live report from the backend
    fetch(`${BASE_URL}/api/graphify/report`)
      .then(r => r.json())
      .then(data => {
        if (data?.nodes) {
          setStats(s => ({
            ...s,
            nodes: data.nodes,
            edges: data.edges,
            communities: data.communities,
            extraction: data.extraction,
            godNodes: data.god_nodes || s.godNodes,
            gaps: data.gaps || s.gaps,
            surprises: data.surprises || s.surprises,
            loaded: true,
          }));
        }
      })
      .catch(() => {
        // Use defaults silently if backend not running
        setStats(s => ({ ...s, loaded: true }));
      });
  }, []);

  const graphUrl = `${BASE_URL}/graphify/graph.html`;

  return (
    <div className="flex flex-col bg-[#0f0f1a] overflow-hidden relative" style={{ height: '100%', minHeight: 0 }}>
      
      {/* Top Bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0f0f1a]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <GitBranch size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">Graphify — Codebase Graph</h1>
            <p className="text-neutral-500 text-xs">openzess · {stats.nodes} nodes · {stats.edges} edges · {stats.communities} communities</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md font-mono">
            Live
          </span>
          <button
            onClick={() => setGraphKey(k => k + 1)}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Reload Graph"
          >
            <RefreshCw size={15} />
          </button>
          <a
            href={graphUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={15} />
          </a>
          <button
            onClick={() => setShowPanel(v => !v)}
            className={`p-1.5 rounded-lg transition-colors ${showPanel ? 'text-indigo-400 bg-indigo-400/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
            title="Toggle Stats Panel"
          >
            <Info size={15} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex overflow-hidden" style={{ flex: '1 1 0', minHeight: 0 }}>
        
        {/* Graph iframe */}
        <div className="relative" style={{ flex: '1 1 0', minWidth: 0, minHeight: 0 }}>
          <iframe
            key={graphKey}
            ref={iframeRef}
            src={graphUrl}
            title="Codebase Graph"
            className="border-none"
            style={{ width: '100%', height: '100%', display: 'block', background: '#0f0f1a' }}
          />
          
          {/* Gradient overlay at bottom of iframe for aesthetics */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-[#0f0f1a]/60 to-transparent" />
        </div>

        {/* Stats Panel */}
        {showPanel && (
          <div className="w-[300px] shrink-0 border-l border-white/10 bg-[#0f0f1a] flex flex-col overflow-hidden">
            
            {/* Panel Tabs */}
            <div className="flex border-b border-white/10 shrink-0">
              {(['overview', 'gods', 'gaps'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab === 'gods' ? 'God Nodes' : tab === 'gaps' ? 'Gaps' : 'Overview'}
                </button>
              ))}
            </div>
            
            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
              
              {activeTab === 'overview' && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Nodes', value: stats.nodes, color: 'text-indigo-400', icon: <Circle size={12} /> },
                      { label: 'Edges', value: stats.edges, color: 'text-emerald-400', icon: <ArrowRight size={12} /> },
                      { label: 'Communities', value: stats.communities, color: 'text-amber-400', icon: <Layers size={12} /> },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 rounded-xl p-3 flex flex-col gap-1 items-center">
                        <div className={s.color}>{s.icon}</div>
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-neutral-500 text-[10px]">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Extraction Quality */}
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-2 font-medium">Extraction Quality</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '81%' }} />
                        </div>
                        <span className="text-emerald-400 text-xs font-mono">81% EXTRACTED</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '19%' }} />
                        </div>
                        <span className="text-amber-400 text-xs font-mono">19% INFERRED</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Surprising Connections */}
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-2 font-medium flex items-center gap-1">
                      <AlertTriangle size={10} className="text-amber-400" />
                      Surprising Connections
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {stats.surprises.map((s, i) => (
                        <div key={i} className="text-xs text-amber-300/80 bg-amber-400/5 rounded-lg px-2.5 py-1.5 font-mono leading-relaxed">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {activeTab === 'gods' && (
                <div className="flex flex-col gap-2">
                  <p className="text-neutral-400 text-[10px] uppercase tracking-widest font-medium">Most Connected Nodes</p>
                  {stats.godNodes.map((g, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="text-indigo-400 text-[10px] font-bold">{i + 1}</span>
                        </div>
                        <span className="text-white text-xs font-mono truncate">{g.name}</span>
                      </div>
                      <div className="shrink-0 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                        {g.edges}e
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'gaps' && (
                <div className="flex flex-col gap-2">
                  <p className="text-neutral-400 text-[10px] uppercase tracking-widest font-medium flex items-center gap-1">
                    <AlertTriangle size={10} className="text-red-400" />
                    Knowledge Gaps
                  </p>
                  {stats.gaps.map((g, i) => (
                    <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />
                      <span className="text-red-300/80 text-xs leading-relaxed">{g}</span>
                    </div>
                  ))}
                  
                  <div className="mt-2 bg-white/5 rounded-xl p-3">
                    <p className="text-neutral-400 text-[10px] uppercase tracking-widest mb-2 font-medium">Suggested Questions</p>
                    <div className="flex flex-col gap-2">
                      {[
                        'Why does OpenzessAgent bridge Communities 0, 1, 3, 5?',
                        'Should Community 0 be split into smaller modules?',
                        'Are 23 inferred edges on OpenzessAgent correct?',
                      ].map((q, i) => (
                        <div key={i} className="text-indigo-300/70 text-xs bg-indigo-400/5 rounded-lg px-2.5 py-2 leading-relaxed">
                          💡 {q}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Panel Footer */}
            <div className="shrink-0 p-3 border-t border-white/10">
              <p className="text-neutral-600 text-[10px] text-center">
                Generated by <span className="text-indigo-400">graphifyy</span> · openzess · April 2026
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
