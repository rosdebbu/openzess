import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Hash, Volume2, Shield, Bell, Send, User, Bot } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  icon: React.ElementType;
  unread: number;
  desc: string;
}

const mockMessages = [
  { id: 1, sender: 'System O.', role: 'system', align: 'left', text: 'Channel initialized successfully. All background workers are attached.', time: '10:45 AM' },
  { id: 2, sender: 'Architect Bot', role: 'agent', align: 'left', text: 'I am monitoring the current workspace for changes. Proceed with deployments when ready.', time: '10:46 AM' },
  { id: 3, sender: 'You', role: 'user', align: 'right', text: 'Acknowledged. Standing by.', time: '10:50 AM' },
];

export default function Channels() {
  const [activeChannel, setActiveChannel] = useState('general');
  const [inputVal, setInputVal] = useState('');

  const channels: Channel[] = [
    { id: 'general', name: 'General', icon: Hash, unread: 0, desc: 'Primary broadcast network for all autonomous agents.' },
    { id: 'alerts', name: 'Alerts', icon: Bell, unread: 3, desc: 'Critical system failures and execution blocks.' },
    { id: 'deployments', name: 'Deployments', icon: Volume2, unread: 0, desc: 'CI/CD pipeline updates and server handshakes.' },
    { id: 'security', name: 'Security', icon: Shield, unread: 1, desc: 'Audit logs and vulnerability scans.' },
  ];

  const currentChannel = channels.find(c => c.id === activeChannel);

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent text-neutral-900 dark:text-neutral-200">
      {/* Sidebar for Channels */}
      <div className="w-72 border-r border-neutral-200 dark:border-border bg-white/50 dark:bg-surface/50 flex flex-col backdrop-blur-md">
        <div className="p-6 border-b border-neutral-200 dark:border-border">
          <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Radio size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-1 text-neutral-900 dark:text-white">Channels</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Broadcast networks</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${activeChannel === c.id ? 'bg-brand/10 text-brand' : 'hover:bg-neutral-100 dark:hover:bg-surface text-neutral-600 dark:text-neutral-400'}`}
            >
              <c.icon size={18} className={activeChannel === c.id ? 'text-brand' : 'text-neutral-400'} />
              <span className="font-medium text-sm flex-1">{c.name}</span>
              {c.unread > 0 && (
                <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Channel Area */}
      <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950/50">
        <div className="p-6 border-b border-neutral-200 dark:border-border bg-white/50 dark:bg-surface/50 backdrop-blur-md flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
            {currentChannel && <currentChannel.icon size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              #{currentChannel?.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{currentChannel?.desc}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar">
          <AnimatePresence>
            {mockMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col max-w-[80%] ${msg.align === 'right' ? 'self-end' : 'self-start'}`}
              >
                <div className={`flex items-center gap-2 mb-1 text-xs ${msg.align === 'right' ? 'justify-end flex-row-reverse' : ''}`}>
                   {msg.role === 'system' && <Radio size={12} className="text-neutral-400" />}
                   {msg.role === 'agent' && <Bot size={12} className="text-brand" />}
                   {msg.role === 'user' && <User size={12} className="text-blue-500" />}
                   <span className="font-medium text-neutral-500">{msg.sender}</span>
                   <span className="text-neutral-400">{msg.time}</span>
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.align === 'right' ? 'bg-brand text-white rounded-tr-sm' : 'bg-white dark:bg-surface border border-neutral-200 dark:border-border text-neutral-800 dark:text-neutral-200 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-border bg-white/50 dark:bg-surface/50 backdrop-blur-md">
          <div className="flex items-center gap-2 max-w-4xl mx-auto relative">
             <input
                type="text"
                placeholder={`Message #${currentChannel?.name}`}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 transition-colors"
                disabled
             />
             <button disabled className="absolute right-2 p-2 bg-brand text-white rounded-lg opacity-50 cursor-not-allowed">
                <Send size={16} />
             </button>
          </div>
          <p className="text-center text-[10px] text-neutral-400 mt-2">Channel broadcasting is in mock mode.</p>
        </div>
      </div>
    </div>
  );
}
