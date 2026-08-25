import { Rocket, Sparkles, Code2, ChevronRight, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';

const changelogData = [
  {
     version: "v1.2.0",
     codename: "The Ecosystem Update",
     date: "Today",
     type: "major",
     icon: Rocket,
     gradient: "from-brand to-violet-600",
     changes: [
        "Implemented full Channels workspace for system broadcast monitoring.",
        "Added Cron Jobs visualizer for background task scheduling.",
        "Introduced Heartbeat live telemetry panel.",
        "Integrated MCP Protocol marketplace UI.",
        "Replaced 'Coming Soon' placeholders with functional mockups.",
        "Added Knowledge Base personal canvas with markdown support.",
        "Debate Arena multi-agent discussion feature."
     ]
  },
  {
     version: "v1.1.5",
     codename: "Premium Interface",
     date: "April 4, 2026",
     type: "minor",
     icon: Sparkles,
     gradient: "from-emerald-500 to-cyan-500",
     changes: [
        "Upgraded ChromaDB Memory Vault integration.",
        "Implemented 'Awwwards' tier animations and glassmorphic UI.",
        "Refined Semantic Memory viewer grid.",
        "Added Graphify codebase visualization page.",
        "Integrated VRM companion 3D avatar viewer."
     ]
  },
  {
     version: "v1.0.0",
     codename: "Alpha Release",
     date: "March 20, 2026",
     type: "major",
     icon: Code2,
     gradient: "from-amber-500 to-orange-500",
     changes: [
        "Initial release of the generic Openzess prototype.",
        "Terminal command execution and basic filesystem integration.",
        "Dark mode context switching setup.",
        "Multi-provider LLM support (Gemini, OpenAI, Anthropic, etc.)",
        "WebSocket-based chat streaming."
     ]
  }
];

export default function Changelog() {
  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        <header className="mb-10 shrink-0 border-b border-[#E2DAD2] dark:border-[#3A3838] pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/5 border border-brand/20">
              <GitBranch size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3A3838] dark:text-[#E2DAD2] tracking-tight">Changelog</h1>
              <p className="text-[#B8AFA8] dark:text-[#B8AFA8]">Track all updates and features of the openzess system</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-16 custom-scrollbar pr-2">
          {/* Vertical Timeline */}
          <div className="relative pl-8">
            {/* Timeline Line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-brand/50 via-neutral-300 dark:via-neutral-700 to-transparent"></div>

            <div className="space-y-10">
              {changelogData.map((log, i) => {
                const Icon = log.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    key={i}
                    className="relative"
                  >
                    {/* Timeline Dot */}
                    <div className={`absolute -left-8 w-8 h-8 rounded-full bg-gradient-to-br ${log.gradient} flex items-center justify-center shadow-lg z-10 ring-4 ring-white dark:ring-neutral-950`}>
                      <Icon size={14} className="text-white" />
                    </div>

                    {/* Card */}
                    <div className="bg-white dark:bg-[#1E1C1C]/60 border border-[#E2DAD2] dark:border-[#3A3838] rounded-2xl overflow-hidden shadow-sm dark:shadow-none hover:border-brand/30 transition-colors group ml-4">
                      {/* Header */}
                      <div className={`px-6 py-4 bg-gradient-to-r ${log.gradient} bg-opacity-10 border-b border-[#E2DAD2] dark:border-[#3A3838]/50 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/90 dark:bg-[#1E1C1C]/90"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-[#3A3838] dark:text-[#E2DAD2]">{log.version}</h3>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              log.type === 'major' 
                                ? 'bg-brand/10 text-brand border-brand/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {log.type}
                            </span>
                          </div>
                          <span className="text-sm font-mono text-[#B8AFA8]">{log.date}</span>
                        </div>
                        <p className="relative z-10 text-sm font-medium text-[#B8AFA8] dark:text-[#B8AFA8] mt-1">{log.codename}</p>
                      </div>

                      {/* Changes */}
                      <div className="p-6">
                        <div className="space-y-2.5">
                          {log.changes.map((change, j) => (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 + j * 0.05 }}
                              key={j}
                              className="flex items-start gap-3 group/item"
                            >
                              <div className="w-5 h-5 rounded-md bg-[#EDE8E2] dark:bg-white/5 border border-[#E2DAD2] dark:border-[#3A3838] flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-brand/10 group-hover/item:border-brand/30 group-hover/item:text-brand transition-colors">
                                <ChevronRight size={12} className="text-[#B8AFA8] group-hover/item:text-brand transition-colors" />
                              </div>
                              <span className="text-[#3A3838]/80 dark:text-[#E2DAD2]/80 text-sm leading-relaxed">{change}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Timeline End */}
            <div className="absolute left-[11px] bottom-0 w-2 h-2 rounded-full bg-[#E2DAD2] dark:bg-[#3A3838]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
