import { useEffect, useState } from 'react';
import { MessageSquare, Folder, Wrench, Settings, Plus, Clock } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface Session {
  id: string;
  title: string;
}

export default function Sidebar() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchSessions = () => {
    axios.get('http://localhost:8000/api/sessions')
      .then(res => setSessions(res.data.sessions))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
    // Re-fetch when navigating to root or when a new chat occurs
    const handleRefresh = () => fetchSessions();
    window.addEventListener('refresh-sessions', handleRefresh);
    return () => window.removeEventListener('refresh-sessions', handleRefresh);
  }, [location.pathname]);

  const navItems = [
    { name: 'Chat Workspace', icon: <MessageSquare size={18} />, path: '/' },
    { name: 'Files', icon: <Folder size={18} />, path: '/files' },
    { name: 'Tools', icon: <Wrench size={18} />, path: '/tools' },
  ];

  return (
    <div className="w-[280px] bg-neutral-950/50 border-r border-border shrink-0 flex flex-col h-full backdrop-blur-xl">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-3 tracking-wide cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/20">
            <span className="text-white font-black text-sm">O</span>
          </div>
          openzess
        </h1>
        <p className="text-[10px] text-neutral-500 mt-4 font-mono uppercase tracking-widest pl-1">Workspace</p>
      </div>
      
      <div className="py-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm
              ${isActive ? 'bg-brand/10 text-brand font-semibold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-surface'}
            `}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-2 flex items-center justify-between mt-2">
          <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Memory</p>
          <button 
             onClick={() => navigate('/')}
             className="text-neutral-400 hover:text-brand transition-colors p-1"
             title="New Chat"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 custom-scrollbar">
           {sessions.map((session) => (
              <NavLink 
                key={session.id} 
                to={`/chat/${session.id}`}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs
                  ${isActive ? 'bg-surface text-neutral-200 font-medium' : 'text-neutral-500 hover:text-neutral-300 hover:bg-surface/50'}
                `}
              >
                <Clock size={12} className="shrink-0" />
                <span className="truncate">{session.title}</span>
              </NavLink>
           ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-border mt-auto">
        <button 
          className="flex items-center gap-3 text-neutral-400 hover:text-neutral-200 hover:bg-surface transition-colors py-2.5 px-3 w-full text-left rounded-lg text-sm font-medium"
          onClick={() => window.dispatchEvent(new Event('open-settings'))}
        >
          <Settings size={18} />
          <span>Configuration</span>
        </button>
      </div>
    </div>
  );
}
