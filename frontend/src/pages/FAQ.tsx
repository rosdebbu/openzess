import { HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const faqs = [
  { q: "How do I configure the API Keys for swarm?", a: "Go to the Global Settings panel (gear icon / open settings) and supply your desired provider keys. They are saved securely in your browser's local storage and synced with the Python backend during generation." },
  { q: "Is the Windows native environment supported?", a: "OpenZess is heavily optimized for WSL (Windows Subsystem for Linux), particularly the matrix-desktop module which relies on X-server logic to virtualize screens. Run the start_wsl.sh script to boot correctly!" },
  { q: "Why is my Matrix Viewer completely blank?", a: "This happens when the background Xvfb service drops or fails to start on Display :99. Try stopping the node server and running start_wsl.sh again." }
];

export default function FAQ() {
  return (
    <div className="flex-1 p-10 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-neutral-200 dark:border-border">
           <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-sm">
             <HelpCircle size={24} />
           </div>
           <div>
             <h2 className="text-3xl font-semibold text-neutral-900 dark:text-white">FAQ</h2>
             <p className="text-neutral-500 dark:text-neutral-400">Frequently Asked Questions & troubleshooting</p>
           </div>
        </div>
        
        <div className="space-y-4">
           {faqs.map((faq, i) => (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="p-6 bg-white dark:bg-surface border border-neutral-200 dark:border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
               <h3 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">{faq.q}</h3>
               <p className="text-neutral-500 leading-relaxed text-sm">{faq.a}</p>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
}
