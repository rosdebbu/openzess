import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Github, Database, Globe, Command, PlusCircle, Server, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';

interface PluginCard {
  id: string;
  name: string;
  developer: string;
  description: string;
  icon: any;
  iconColor: string;
  command: string;
  args: string[];
  bannerGradient: string;
  popular?: boolean;
}

const MARKETPLACE_PLUGINS: PluginCard[] = [
  {
    id: "mcp-github",
    name: "GitHub Ecosystem",
    developer: "ModelContextProtocol",
    description: "Allows the Agent to read repositories, manage issues, and natively push Pull Requests to GitHub.",
    icon: Github,
    iconColor: "text-neutral-900 dark:text-white",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    bannerGradient: "from-neutral-200 to-neutral-400 dark:from-neutral-800 dark:to-neutral-900",
    popular: true
  },
  {
    id: "mcp-sqlite",
    name: "SQLite Database Explorer",
    developer: "ModelContextProtocol",
    description: "Gives your Agent native SQL execution access to explore and mutate local SQLite database structures natively.",
    icon: Database,
    iconColor: "text-blue-500",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "--db", "./mydb.sqlite"],
    bannerGradient: "from-blue-500/20 to-cyan-500/20",
    popular: true
  },
  {
    id: "mcp-puppeteer",
    name: "Puppeteer Web Browser",
    developer: "ModelContextProtocol",
    description: "Provides full headless Chromium access. The AI can natively browse the visual web, click buttons, and scrape secure pages.",
    icon: Globe,
    iconColor: "text-emerald-500",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    bannerGradient: "from-emerald-500/20 to-teal-500/20"
  },
  {
    id: "mcp-slack",
    name: "Slack Communicator",
    developer: "ModelContextProtocol",
    description: "Connects Openzess to your Slack workspace to read channels and automatically reply to colleagues.",
    icon: Command,
    iconColor: "text-rose-500",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    bannerGradient: "from-rose-500/20 to-pink-500/20"
  },
  {
    id: "mcp-postgres",
    name: "PostgreSQL Bridge",
    developer: "ModelContextProtocol",
    description: "Native agent logic allowing structural modification and heavy data retrieval from secure production PostgreSQL tables.",
    icon: Server,
    iconColor: "text-indigo-500",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
    bannerGradient: "from-indigo-500/20 to-purple-500/20"
  }
];

export default function Marketplace() {
  const [installedServers, setInstalledServers] = useState<any[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);

  const fetchInstalled = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/mcp/servers');
      setInstalledServers(res.data.saved_servers || []);
    } catch (e) {
      console.error("Failed to fetch installed plugins:", e);
    }
  };

  useEffect(() => {
    fetchInstalled();
  }, []);

  const handleInstall = async (plugin: PluginCard) => {
    setInstalling(plugin.id);
    try {
      await axios.post('http://localhost:8000/api/mcp/connect', {
        server_id: plugin.id + "-" + Date.now().toString().substring(8),
        name: plugin.name,
        command: plugin.command,
        args: plugin.args
      });
      await fetchInstalled();
    } catch (error) {
      console.error('Install failed', error);
      alert('Failed to install plugin context server.');
    } finally {
      setInstalling(null);
    }
  };

  const isInstalled = (pluginName: string) => {
     return installedServers.some(s => s.name === pluginName);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
       <div className="p-8 border-b border-neutral-200 dark:border-border flex justify-between items-center bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl shrink-0">
          <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white">
                <Layers className="text-brand" size={32} />
                Infinite Ecosystem
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl text-sm leading-relaxed">
                 Expand the capabilities of Openzess with a single click. These plugins are built using the open-source Model Context Protocol, allowing massive integrations to hot-load directly into the Agent's neural pathways natively.
              </p>
          </div>
          <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-xl border border-brand/20 font-semibold shadow-sm">
                  <Server size={18} /> Plugins Active
              </div>
          </div>
       </div>

       <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {MARKETPLACE_PLUGINS.map(plugin => {
                const Icon = plugin.icon;
                const installed = isInstalled(plugin.name);
                
                return (
                   <motion.div 
                      key={plugin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden flex flex-col shadow-lg shadow-neutral-200/50 dark:shadow-none hover:-translate-y-1 transition-transform duration-300"
                   >
                      <div className={`h-24 bg-gradient-to-r ${plugin.bannerGradient} flex items-center p-6 relative overflow-hidden`}>
                         <Icon size={80} className="absolute -right-4 -bottom-4 opacity-20 text-neutral-900 dark:text-white transform -rotate-12" />
                         <div className={`w-14 h-14 bg-white dark:bg-neutral-950 rounded-2xl flex items-center justify-center shadow-lg z-10 ${plugin.iconColor}`}>
                            <Icon size={28} />
                         </div>
                         {plugin.popular && (
                            <div className="absolute top-4 right-4 bg-brand text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full shadow-sm">
                               Trending
                            </div>
                         )}
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                         <div className="mb-4">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">{plugin.name}</h3>
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{plugin.developer}</p>
                         </div>
                         <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 flex-1">
                            {plugin.description}
                         </p>
                         
                         <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <button 
                               className="text-xs text-brand hover:text-brand-hover font-semibold flex items-center gap-1 transition-colors"
                               onClick={() => alert(`View Documentation for ${plugin.name} MCP Server at modelcontextprotocol.io`)}
                            >
                               <Info size={14}/> Docs
                            </button>
                            
                            {installed ? (
                               <button 
                                  disabled
                                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                               >
                                  <CheckCircle size={16}/> Installed
                               </button>
                            ) : (
                               <button 
                                  onClick={() => handleInstall(plugin)}
                                  disabled={installing === plugin.id}
                                  className="bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
                               >
                                  {installing === plugin.id ? (
                                     <div className="w-4 h-4 border-2 border-white/30 dark:border-neutral-900/30 border-t-white dark:border-t-neutral-900 rounded-full animate-spin"></div>
                                  ) : (
                                     <><PlusCircle size={16} /> Get</>
                                  )}
                               </button>
                            )}
                         </div>
                      </div>
                   </motion.div>
                )
             })}
             
             {/* Native Development Card */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand/5 border-2 border-dashed border-brand/30 rounded-3xl flex flex-col p-8 items-center justify-center text-center hover:bg-brand/10 transition-colors"
             >
                <div className="w-16 h-16 bg-white dark:bg-neutral-900 rounded-full shadow-lg shadow-brand/20 flex items-center justify-center text-brand mb-4">
                   <Box size={32} />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Build Custom Plugin</h3>
                <p className="text-sm text-neutral-500 max-w-sm mb-6">
                   Are you a developer? Drop any valid Python script into the <code className="bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded text-brand">backend/plugins/</code> directory and it will hot-load into Openzess instantly.
                </p>
                <button 
                   onClick={() => window.dispatchEvent(new Event('open-settings'))}
                   className="bg-white dark:bg-neutral-900 text-brand px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-brand/10 hover:shadow-md transition-all border border-neutral-200 dark:border-neutral-800"
                >
                   Learn More
                </button>
             </motion.div>
             
          </div>
       </div>
    </div>
  );
}
