import { BookOpen, FileText, Code } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Doc() {
  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-neutral-200 dark:border-border">
           <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-sm">
             <BookOpen size={24} />
           </div>
           <div>
             <h2 className="text-3xl font-semibold text-neutral-900 dark:text-white">Documentation</h2>
             <p className="text-neutral-500 dark:text-neutral-400">Everything you need to know about the OpenZess system.</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white dark:bg-surface border border-neutral-200 dark:border-border rounded-2xl shadow-sm hover:border-brand transition-colors cursor-pointer group" onClick={() => window.open('http://localhost:5175/getting-started', '_blank')}>
             <FileText className="text-brand mb-4 group-hover:scale-110 transition-transform" size={32} />
             <h3 className="text-xl font-bold mb-2 dark:text-white">Getting Started</h3>
             <p className="text-neutral-500 mb-4 text-sm leading-relaxed">Learn how to install, configure, and boot up the system environments correctly via the shell scripts.</p>
             <a href="http://localhost:5175/getting-started" target="_blank" rel="noopener noreferrer" className="text-brand text-sm font-semibold hover:underline">Read Guide &rarr;</a>
           </motion.div>
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 bg-white dark:bg-surface border border-neutral-200 dark:border-border rounded-2xl shadow-sm hover:border-brand transition-colors cursor-pointer group" onClick={() => window.open('http://localhost:5175/matrix-viewer', '_blank')}>
             <Code className="text-brand mb-4 group-hover:scale-110 transition-transform" size={32} />
             <h3 className="text-xl font-bold mb-2 dark:text-white">Developer API</h3>
             <p className="text-neutral-500 mb-4 text-sm leading-relaxed">Integrate external MCP services and invoke the native Python WebSocket streamers programmatically.</p>
             <a href="http://localhost:5175/matrix-viewer" target="_blank" rel="noopener noreferrer" className="text-brand text-sm font-semibold hover:underline">View Matrix Guide &rarr;</a>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
