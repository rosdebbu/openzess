import { FileText, Rocket, Sparkles, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

const changelogData = [
  {
     version: "v1.2.0 - The Ecosystem Update",
     date: "Today",
     type: "major",
     icon: <Rocket />,
     changes: [
        "Implemented full Channels workspace for system broadcast monitoring.",
        "Added Cron Jobs visualizer for background task scheduling.",
        "Introduced Heartbeat live telemetry panel.",
        "Integrated MCP Protocol marketplace UI.",
        "Replaced 'Coming Soon' placeholders with functional mockups."
     ]
  },
  {
     version: "v1.1.5",
     date: "April 4, 2026",
     type: "minor",
     icon: <Sparkles />,
     changes: [
        "Upgraded ChromaDB Memory Vault integration.",
        "Implemented 'Awwwards' tier animations and glassmorphic UI.",
        "Refined Semantic Memory viewer grid."
     ]
  },
  {
     version: "v1.0.0 - Alpha Release",
     date: "March 20, 2026",
     type: "major",
     icon: <Code2 />,
     changes: [
        "Initial release of the generic Openzess prototype.",
        "Terminal command execution and basic filesystem integration.",
        "Dark mode context switching setup."
     ]
  }
];

export default function Changelog() {
  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-neutral-200 dark:border-border">
           <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-sm">
             <FileText size={24} />
           </div>
           <div>
             <h2 className="text-3xl font-semibold text-neutral-900 dark:text-white">Changelog</h2>
             <p className="text-neutral-500 dark:text-neutral-400">Track all updates and features of the openzess system.</p>
           </div>
        </div>

        <div className="relative pl-8 md:pl-0">
           {/* Timeline line */}
           <div className="absolute left-8 md:left-1/2 top-4 bottom-0 w-px bg-neutral-200 dark:bg-border -translate-x-1/2"></div>
           
           <div className="space-y-12">
              {changelogData.map((log, i) => (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    key={i} 
                    className={`relative flex flex-col md:flex-row gap-8 items-start ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                 >
                    {/* Timeline dot/icon */}
                    <div className="absolute left-0 md:left-1/2 w-10 h-10 rounded-full border-4 border-white dark:border-neutral-950 bg-brand text-white flex items-center justify-center -translate-x-1/2 shadow-lg z-10">
                       <div className="scale-75">{log.icon}</div>
                    </div>

                    <div className="w-full md:w-1/2"></div> {/* Spacer for alternate sides */}

                    <div className={`w-full md:w-1/2 p-6 bg-white dark:bg-surface border border-neutral-200 dark:border-border rounded-2xl shadow-sm ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                       <div className={`flex flex-col md:flex-row md:items-center gap-2 mb-4 ${i % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                          <h3 className="text-xl font-bold text-brand">{log.version}</h3>
                          <span className="text-sm font-mono text-neutral-400">{log.date}</span>
                       </div>
                       
                       <ul className={`space-y-2 text-neutral-600 dark:text-neutral-300 text-sm ${i % 2 === 0 ? '' : 'mdInlineText'}`}>
                          {log.changes.map((change, j) => (
                             <li key={j} className="flex items-start gap-2">
                                <span className="text-brand shrink-0 mt-1">•</span>
                                <span className={i % 2 !== 0 && window.innerWidth >= 768 ? 'text-right' : 'text-left'}>{change}</span>
                             </li>
                          ))}
                       </ul>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
