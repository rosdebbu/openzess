import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Plug, Search, ChevronRight, CheckCircle2, Loader2, Plus, Trash2, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddMCPServerModal from '../components/AddMCPServerModal';
import { useToast } from '../contexts/ToastContext';

interface MCPServerInfo {
  id: string;
  name: string;
  desc: string;
  icon: string;
  command: string;
  args: string[];
  isCustom?: boolean;
}

const DEFAULT_SERVERS: MCPServerInfo[] = [
  { id: 'github', name: 'GitHub', desc: 'Read/write repository access and PR management.', icon: '🐙', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
  { id: 'postgres', name: 'PostgreSQL', desc: 'Direct secure database queries and schema inspection.', icon: '🐘', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'] },
  { id: 'everything', name: 'Test Sandbox', desc: 'Demo server with echo, long running tools and more.', icon: '🛠️', command: 'npx', args: ['-y', '@modelcontextprotocol/server-everything'] },
  { id: 'memory', name: 'Memory', desc: 'A knowledge graph built natively into MCP.', icon: '🧠', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] },
  { id: 'filesystem', name: 'Filesystem', desc: 'Standard local filesystem access protocol.', icon: '📁', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '.'] },
];

export default function MCP() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [serverStats, setServerStats] = useState<Record<string, any>>({});
  const [savedServers, setSavedServers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchServers = async () => {
     try {
        const res = await axios.get('http://localhost:8000/api/mcp/servers');
        setConnectedIds(Object.keys(res.data.servers || {}));
        setServerStats(res.data.servers || {});
        setSavedServers(res.data.saved_servers || []);
     } catch(e) { console.error(e); }
  };

  useEffect(() => {
     fetchServers();
     const int = setInterval(fetchServers, 5000);
     return () => clearInterval(int);
  }, []);

  const toggleServer = async (server: typeof DEFAULT_SERVERS[0]) => {
     setLoadingIds(prev => [...prev, server.id]);
     try {
        if (connectedIds.includes(server.id)) {
           await axios.post(`http://localhost:8000/api/mcp/disconnect/${server.id}`);
        } else {
           await axios.post('http://localhost:8000/api/mcp/connect', {
              server_id: server.id,
              name: server.name || server.id,
              command: server.command,
              args: server.args
           });
           showToast(`Connected to ${server.name}`, 'success');
        }
        await fetchServers();
     } catch (e) {
        console.error(e);
        showToast(`Failed to toggle ${server.name}`, 'error');
     } finally {
        setLoadingIds(prev => prev.filter(id => id !== server.id));
     }
  };

  const handleAddCustom = async (serverData: any) => {
     try {
        await axios.post('http://localhost:8000/api/mcp/connect', {
           server_id: serverData.id,
           name: serverData.name,
           command: serverData.command,
           args: serverData.args
        });
        await fetchServers();
     } catch (e) {
        throw e; // Modal handles toast
     }
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     try {
        await axios.delete(`http://localhost:8000/api/mcp/saved/${id}`);
        showToast('Server deleted permanently.', 'success');
        await fetchServers();
     } catch(err) {
        showToast('Failed to delete server.', 'error');
     }
  };

  // Merge default servers and custom saved servers uniquely by ID
  const allServers: MCPServerInfo[] = [...DEFAULT_SERVERS];
  savedServers.forEach(ss => {
     if (!allServers.find(s => s.id === ss.id)) {
        allServers.push({
           id: ss.id,
           name: ss.name,
           desc: 'User defined custom MCP server.',
           icon: '⚙️',
           command: ss.command,
           args: ss.args,
           isCustom: true
        });
     }
  });

  const filteredServers = allServers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
           <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <Zap size={24} />
                </div>
                <h2 className="text-3xl font-semibold text-neutral-900 dark:text-white">MCP Grid</h2>
             </div>
             <p className="text-neutral-500 dark:text-neutral-400">Model Context Protocol integrations. Connect external tools safely.</p>
           </div>

           <div className="flex items-center gap-4">
              <button 
                 onClick={() => setIsModalOpen(true)}
                 className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-xl font-medium text-sm hover:scale-[0.98] transition-transform shadow-sm"
              >
                  <Plus size={16} /> Add Protocol
              </button>
              
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Search protocols..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-10 pr-4 py-2 bg-white dark:bg-surface border border-neutral-200 dark:border-border rounded-xl focus:outline-none focus:border-indigo-500 transition-colors shadow-sm w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server, i) => {
             const isConnected = connectedIds.includes(server.id);
             const isLoading = loadingIds.includes(server.id);

             return (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05 }}
               key={server.id}
               className={`bg-white dark:bg-surface border ${isConnected ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-neutral-200 dark:border-border hover:border-indigo-500/50 hover:shadow-xl'} p-6 rounded-2xl shadow-sm transition-all group flex flex-col h-full relative overflow-hidden`}
             >
                {isLoading && (
                   <div className="absolute inset-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <Loader2 size={32} className="text-indigo-500 animate-spin" />
                   </div>
                )}
                <div className="flex items-start justify-between mb-4">
                   <div className="text-4xl">{server.icon}</div>
                   <div className="flex items-center gap-2">
                       {server.isCustom && (
                          <button 
                             onClick={(e) => handleDeleteSaved(server.id, e)}
                             className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                             title="Delete Custom Server"
                          >
                             <Trash2 size={16} />
                          </button>
                       )}
                       {isConnected ? (
                          <span className="flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md">
                             <CheckCircle2 size={14} /> Connected
                          </span>
                       ) : (
                          <span className="flex items-center gap-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-900 text-neutral-500 px-2 py-1 rounded-md">
                             <Plug size={14} /> Available
                          </span>
                       )}
                   </div>
                </div>
                
                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">{server.name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-1 leading-relaxed mb-4">{server.desc}</p>
                
                {/* Specific Tools Loaded via MCP */}
                {isConnected && serverStats[server.id]?.toolNames && (
                   <div className="mb-6 flex flex-wrap gap-2">
                      {serverStats[server.id].toolNames.length === 0 ? (
                         <span className="text-xs text-neutral-400 italic">No tools exposed</span>
                      ) : (
                         serverStats[server.id].toolNames.map((tName: string) => (
                            <span key={tName} className="flex items-center gap-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700">
                               <Wrench size={10} /> {tName}
                            </span>
                         ))
                      )}
                   </div>
                )}
                
                <button 
                   onClick={() => toggleServer(server)}
                   disabled={isLoading}
                   className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${isConnected ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-red-500/10 hover:text-red-500' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}
                >
                   {isConnected ? 'Disconnect Protocol' : 'Connect Protocol'} {!isConnected && <ChevronRight size={16} />}
                </button>
             </motion.div>
             );
          })}
        </div>
      </div>
      <AddMCPServerModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onAdd={handleAddCustom} 
      />
    </div>
  );
}
