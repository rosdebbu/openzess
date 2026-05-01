import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Search, Zap, Monitor, Key, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
  q: string;
  a: string;
  icon: any;
  category: string;
}

const faqs: FAQ[] = [
  {
    q: "How do I configure the API Keys for swarm?",
    a: "Go to the Global Settings panel (gear icon / open settings) and supply your desired provider keys. They are saved securely in your browser's local storage and synced with the Python backend during generation. You can switch between providers (Gemini, OpenAI, Anthropic, Groq, etc.) at any time from the Welcome screen.",
    icon: Key,
    category: "Configuration"
  },
  {
    q: "Is the Windows native environment supported?",
    a: "OpenZess is heavily optimized for WSL (Windows Subsystem for Linux), particularly the matrix-desktop module which relies on X-server logic to virtualize screens. Run the start_wsl.sh script to boot correctly! While the frontend runs natively on Windows, all backend agent operations require the Linux sandbox for full functionality.",
    icon: Monitor,
    category: "Platform"
  },
  {
    q: "Why is my Matrix Viewer completely blank?",
    a: "This happens when the background Xvfb service drops or fails to start on Display :100. Try stopping the node server and running start_wsl.sh again. If the problem persists, manually run 'pkill -9 Xvfb' in WSL, then restart the script. Check that no other process is holding the display lock.",
    icon: Monitor,
    category: "Troubleshooting"
  },
  {
    q: "How do I add custom MCP servers?",
    a: "Navigate to the MCP Grid page and click 'Add Protocol'. You can specify the server command, arguments, and environment variables. Custom servers are saved persistently and will auto-reconnect on restart. You can also install pre-built plugins from the Infinite Ecosystem marketplace.",
    icon: Zap,
    category: "Integrations"
  },
  {
    q: "How do custom Skills / Personas work?",
    a: "Skills are hot-swappable agent configurations that change the AI's behavior, system prompt, and tool access. Default personas like @coder, @researcher, and @writer come built-in. You can create custom personas from the Skills page with specific tool authorizations and system instructions. Switch between them by typing @keyword in the chat.",
    icon: Settings,
    category: "Features"
  },
  {
    q: "Where is my conversation history stored?",
    a: "All conversations are persisted in a PostgreSQL database (Neon cloud or local). You can browse, resume, and delete past sessions from the 'Past Chats' page. The agent's long-term semantic memory is stored separately in ChromaDB and can be managed from the Memory Vault page.",
    icon: MessageCircle,
    category: "Data"
  }
];

const categoryColors: Record<string, string> = {
  Configuration: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Platform: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Troubleshooting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Integrations: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Features: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Data: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        <header className="mb-10 shrink-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E2DAD2] dark:border-[#3A3838]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/5 border border-brand/20">
                <HelpCircle size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#3A3838] dark:text-[#E2DAD2] tracking-tight">FAQ</h1>
                <p className="text-[#B8AFA8] dark:text-[#B8AFA8]">Frequently asked questions & troubleshooting guides</p>
              </div>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8AFA8] dark:text-[#B8AFA8]" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2] pl-11 pr-4 py-2.5 rounded-xl w-64 focus:outline-none focus:border-brand/40 shadow-sm dark:shadow-none transition-colors text-sm font-medium"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
          {filteredFaqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-[#1E1C1C]/40 rounded-3xl border border-[#E2DAD2] dark:border-[#3A3838]/60 border-dashed">
              <HelpCircle size={48} className="text-[#B8AFA8] dark:text-[#3A3838]/80 mb-4" />
              <h2 className="text-xl font-medium text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2">No matching questions</h2>
              <p className="text-[#B8AFA8] text-center max-w-md">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, i) => {
                const isOpen = openIndex === i;
                const Icon = faq.icon;
                const catColor = categoryColors[faq.category] || 'bg-[#EDE8E2] text-[#B8AFA8]';

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    key={i}
                    className={`bg-white dark:bg-[#1E1C1C]/60 border rounded-2xl overflow-hidden transition-all ${
                      isOpen
                        ? 'border-brand/30 shadow-lg shadow-brand/5'
                        : 'border-[#E2DAD2] dark:border-[#3A3838] shadow-sm dark:shadow-none hover:border-[#E2DAD2] dark:hover:border-[#3A3838]'
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className="w-full flex items-center gap-4 p-5 text-left transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-brand/10 text-brand'
                          : 'bg-[#EDE8E2] dark:bg-white/5 text-[#B8AFA8] dark:text-[#B8AFA8]/80'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-[15px] leading-snug transition-colors ${
                          isOpen ? 'text-brand' : 'text-[#3A3838] dark:text-[#E2DAD2]'
                        }`}>
                          {faq.q}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${catColor} shrink-0 hidden md:block`}>
                        {faq.category}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-brand/10 text-brand' : 'bg-[#EDE8E2] dark:bg-white/5 text-[#B8AFA8]'
                      }`}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pl-[4.5rem]">
                            <div className="bg-[#EDE8E2] dark:bg-white/5 rounded-xl p-5 border border-[#E2DAD2] dark:border-[#3A3838]/60">
                              <p className="text-[#3A3838]/80 dark:text-[#E2DAD2]/80 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
