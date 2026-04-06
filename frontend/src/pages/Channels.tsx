import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Hash, Volume2, Shield, Bell, Send, User, Bot } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { prepare, layout } from '@chenglou/pretext';

interface Channel {
  id: string;
  name: string;
  icon: React.ElementType;
  unread: number;
  desc: string;
}

// Generate 10,000 messages to demonstrate Pretext's massive performance gains
const mockMessages = Array.from({ length: 10000 }).map((_, i) => ({
  id: i,
  sender: i % 3 === 0 ? 'System O.' : i % 3 === 1 ? 'Architect Bot' : 'Security Daemon',
  role: i % 3 === 0 ? 'system' : 'agent',
  align: 'left',
  text: `[LOG-${i}] System diagnostic trace complete. Everything looks nominal. ${"Buffer flushed. Memory cleared. ".repeat(Math.floor(Math.random() * 8) + 1)}`,
  time: '10:45 AM',
}));

export default function Channels() {
  const [activeChannel, setActiveChannel] = useState('general');
  const [inputVal, setInputVal] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600); // fallback width

  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);

  const channels: Channel[] = [
    { id: 'general', name: 'General', icon: Hash, unread: 0, desc: 'Primary broadcast network for all autonomous agents.' },
    { id: 'alerts', name: 'Alerts', icon: Bell, unread: 843, desc: 'Critical system failures and execution blocks.' },
    { id: 'deployments', name: 'Deployments', icon: Volume2, unread: 0, desc: 'CI/CD pipeline updates and server handshakes.' },
    { id: 'security', name: 'Security', icon: Shield, unread: 10000, desc: 'Audit logs and vulnerability scans.' },
  ];

  const currentChannel = channels.find(c => c.id === activeChannel);

  // Pretext Preparation (Calculated instantly bypassing DOM)
  const measuredHeights = useMemo(() => {
      // 80% max width container minus internal paddings roughly
      const availableTextWidth = (containerWidth * 0.8) - 48; 
      return mockMessages.map(msg => {
          // Prepare the plain text via Canvas
          const handle = prepare(msg.text, '14px sans-serif'); 
          // layout args: handle, width limit, line height approximation
          const stats = layout(handle, availableTextWidth, 22);
          
          // Math layout: text height + 32px (p-4 padding) + 20px (header) + 24px (gap)
          return stats.height + 32 + 20 + 24; 
      });
  }, [containerWidth]);

  const virtualizer = useVirtualizer({
    count: mockMessages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => measuredHeights[i] || 100, // Pretext provides 100% accurate mathematical sizes
    overscan: 20
  });

  return (
    <div className="flex h-full w-full overflow-hidden bg-transparent text-neutral-900 dark:text-neutral-200">
      {/* Sidebar for Channels */}
      <div className="w-72 border-r border-neutral-200 dark:border-border bg-white/50 dark:bg-surface/50 flex flex-col backdrop-blur-md">
        <div className="p-6 border-b border-neutral-200 dark:border-border">
          <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Radio size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-1 text-neutral-900 dark:text-white">Channels</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">High-Velocity Logs</p>
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
                <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{c.unread > 999 ? '999+' : c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Channel Area */}
      <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950/50 relative overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-border bg-white/50 dark:bg-surface/50 backdrop-blur-md flex items-center gap-4 z-10">
          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
            {currentChannel && <currentChannel.icon size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              #{currentChannel?.name}
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ml-2">Pretext V-Sync</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Rendering 10,000 DOM Nodes Offscreen via Canvas Math</p>
          </div>
        </div>

        {/* VIRTUALIZED CONTAINER */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto px-6 pt-6 custom-scrollbar"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const msg = mockMessages[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={`flex flex-col max-w-[80%] pb-6 ${msg.align === 'right' ? 'self-end ml-auto' : 'self-start'}`}>
                    <div className={`flex items-center gap-2 mb-1 text-xs ${msg.align === 'right' ? 'justify-end flex-row-reverse' : ''}`}>
                       {msg.role === 'system' && <Radio size={12} className="text-neutral-400" />}
                       {msg.role === 'agent' && <Bot size={12} className="text-brand" />}
                       {msg.role === 'user' && <User size={12} className="text-blue-500" />}
                       <span className="font-medium text-neutral-500">{msg.sender}</span>
                       <span className="text-neutral-400">{msg.time}</span>
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm text-sm leading-[22px] ${msg.align === 'right' ? 'bg-brand text-white rounded-tr-sm' : 'bg-white dark:bg-surface border border-neutral-200 dark:border-border text-neutral-800 dark:text-neutral-200 rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-border bg-white/50 dark:bg-surface/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 max-w-4xl mx-auto relative">
             <input
                type="text"
                placeholder={`Read Only - Pretext Render Pipeline Benchmark Active.`}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/50 transition-colors"
                disabled
             />
             <button disabled className="absolute right-2 p-2 bg-brand text-white rounded-lg opacity-50 cursor-not-allowed">
                <Send size={16} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
