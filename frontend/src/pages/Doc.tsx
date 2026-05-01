import { BookOpen, FileText, Code, ExternalLink, Rocket, Sparkles, ArrowRight, Globe, Zap, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const docSections = [
  {
    title: "Getting Started",
    description: "Learn how to install, configure, and boot up the system environments correctly via the shell scripts.",
    icon: Rocket,
    link: "https://openzess-docs.vercel.app/getting-started",
    gradient: "from-emerald-500/20 to-cyan-500/20",
    iconColor: "text-emerald-500",
    tags: ["Installation", "Setup", "WSL"]
  },
  {
    title: "Matrix Viewer",
    description: "Understand the sandboxed Linux GUI desktop and how the AI autonomously controls the Xvfb virtual display.",
    icon: Monitor,
    link: "https://openzess-docs.vercel.app/matrix-viewer",
    gradient: "from-[#A89080]/20 to-violet-500/20",
    iconColor: "text-brand",
    tags: ["Xvfb", "VNC", "Sandbox"]
  },
  {
    title: "Developer API",
    description: "Integrate external MCP services and invoke the native Python WebSocket streamers programmatically.",
    icon: Code,
    link: "https://openzess-docs.vercel.app/api/websocket",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
    tags: ["WebSocket", "REST", "MCP"]
  },
  {
    title: "Agent Architecture",
    description: "Deep dive into the multi-agent swarm architecture, persona system, and tool authorization framework.",
    icon: Sparkles,
    link: "https://openzess-docs.vercel.app/architecture",
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-500",
    tags: ["Swarm", "Personas", "Tools"]
  },
  {
    title: "Channels & Cron",
    description: "Configure Telegram, Discord, and email integrations. Set up autonomous background task scheduling.",
    icon: Zap,
    link: "https://openzess-docs.vercel.app/features/tools",
    gradient: "from-violet-500/20 to-[#3A3838]/20",
    iconColor: "text-violet-500",
    tags: ["Telegram", "Discord", "Scheduler"]
  },
  {
    title: "Full Documentation",
    description: "Browse the complete Openzess documentation site with guides, API references, and tutorials.",
    icon: Globe,
    link: "https://openzess-docs.vercel.app/",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    tags: ["All Guides", "Reference"]
  }
];

export default function Doc() {
  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        <header className="mb-10 shrink-0 border-b border-[#E2DAD2] dark:border-[#3A3838] pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/5 border border-brand/20">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3A3838] dark:text-[#E2DAD2] tracking-tight">Documentation</h1>
              <p className="text-[#B8AFA8] dark:text-[#B8AFA8]">Everything you need to know about the OpenZess platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <a 
              href="https://openzess-docs.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand/20 active:scale-95"
            >
              <ExternalLink size={16} /> Open Full Docs Site
            </a>
            <span className="text-xs text-[#B8AFA8] font-mono bg-[#EDE8E2] dark:bg-white/5 px-3 py-1.5 rounded-lg border border-[#E2DAD2] dark:border-[#3A3838]">
              openzess-docs.vercel.app
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {docSections.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  key={i}
                  onClick={() => window.open(doc.link, '_blank')}
                  className="bg-white dark:bg-[#1E1C1C]/60 border border-[#E2DAD2] dark:border-[#3A3838] rounded-3xl overflow-hidden flex flex-col shadow-sm dark:shadow-none hover:border-brand/40 hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  {/* Gradient Banner */}
                  <div className={`h-20 bg-gradient-to-r ${doc.gradient} relative overflow-hidden flex items-center px-6`}>
                    <Icon size={60} className="absolute -right-2 -bottom-2 opacity-15 transform -rotate-12" />
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1 -mt-5 relative">
                    {/* Floating Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] flex items-center justify-center mb-4 shadow-lg ${doc.iconColor} group-hover:scale-110 transition-transform`}>
                      <Icon size={22} />
                    </div>
                    
                    <h3 className="font-bold text-lg text-[#3A3838] dark:text-[#E2DAD2] mb-2 group-hover:text-brand transition-colors">{doc.title}</h3>
                    <p className="text-[#B8AFA8] dark:text-[#B8AFA8] text-sm leading-relaxed flex-1 mb-4">{doc.description}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {doc.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EDE8E2] dark:bg-white/5 text-[#B8AFA8] border border-[#E2DAD2] dark:border-[#3A3838]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#E2DAD2] dark:border-[#3A3838]/50">
                      <span className="text-brand text-sm font-semibold flex items-center gap-1.5 group-hover:gap-3 transition-all">
                        Read Guide <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
