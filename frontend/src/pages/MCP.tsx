import { useState } from 'react';
import { Zap, Plug, Search, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const servers = [
  { id: '1', name: 'GitHub', desc: 'Read/write repository access and PR management.', connected: true, icon: '🐙' },
  { id: '2', name: 'PostgreSQL', desc: 'Direct secure database queries and schema inspection.', connected: false, icon: '🐘' },
  { id: '3', name: 'Slack', desc: 'Broadcast messages and read channel history.', connected: false, icon: '💬' },
  { id: '4', name: 'Notion', desc: 'Read and update workspace documentation.', connected: true, icon: '📝' },
  { id: '5', name: 'Linear', desc: 'Issue tracking and project management sync.', connected: false, icon: '⚡' },
  { id: '6', name: 'Vercel', desc: 'Trigger deployments and check serverless logs.', connected: false, icon: '▲' },
];

export default function MCP() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServers = servers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server, i) => (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05 }}
               key={server.id}
               className="bg-white dark:bg-surface border border-neutral-200 dark:border-border p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all group flex flex-col h-full"
             >
                <div className="flex items-start justify-between mb-4">
                   <div className="text-4xl">{server.icon}</div>
                   {server.connected ? (
                      <span className="flex items-center gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md">
                         <CheckCircle2 size={14} /> Connected
                      </span>
                   ) : (
                      <span className="flex items-center gap-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-900 text-neutral-500 px-2 py-1 rounded-md">
                         <Plug size={14} /> Available
                      </span>
                   )}
                </div>
                
                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">{server.name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-1 leading-relaxed mb-6">{server.desc}</p>
                
                <button className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${server.connected ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-red-500/10 hover:text-red-500' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>
                   {server.connected ? 'Disconnect' : 'Connect Protocol'} <ChevronRight size={16} className={server.connected ? 'hidden' : ''} />
                </button>
             </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
