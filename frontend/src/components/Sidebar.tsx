import { MessageSquare, Folder, Wrench, History, Sun, Moon, Database, Zap, SlidersHorizontal, Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  
  const navSections = [
    {
      title: 'General',
      items: [
        { name: 'New Chat', icon: <MessageSquare size={18} />, path: '/' },
        { name: 'Past Chats', icon: <History size={18} />, path: '/sessions' },
      ]
    },
    {
      title: 'Workspace',
      items: [
        { name: 'Files', icon: <Folder size={18} />, path: '/files' },
        { name: 'Skills', icon: <Activity size={18} />, path: '/skills' },
        { name: 'Tools', icon: <Wrench size={18} />, path: '/tools' },
        { name: 'MCP', icon: <Zap size={18} />, path: '/mcp' },
        { name: 'Configuration', icon: <SlidersHorizontal size={18} />, action: () => window.dispatchEvent(new Event('open-settings')) },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'Agent Memory', icon: <Database size={18} />, path: '/memory' },
      ]
    }
  ];

  return (
    <div className="w-[280px] bg-white/50 dark:bg-neutral-950/50 border-r border-neutral-200 dark:border-border shrink-0 flex flex-col h-full backdrop-blur-xl transition-colors duration-300">
      <div className="p-6 border-b border-neutral-200 dark:border-border pb-4 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-3 tracking-wide">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-lg shadow-brand/20">
            <span className="text-white font-black text-sm">O</span>
          </div>
          openzess
        </h1>
      </div>
      
      <motion.div 
        className="flex-1 py-4 px-3 flex flex-col gap-6 overflow-y-auto"
        initial="hidden"
        animate="visible"
        variants={{
           hidden: { opacity: 0 },
           visible: {
             opacity: 1,
             transition: { staggerChildren: 0.1 }
           }
        }}
      >
        {navSections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-2 font-mono uppercase tracking-widest pl-3">{section.title}</p>
            {section.items.map((item) => (
              <motion.div 
                 key={item.name}
                 variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                 }}
              >
                {item.path ? (
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm border-l-2
                      ${isActive ? 'bg-brand/10 text-brand font-semibold border-brand shadow-sm shadow-brand/5' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-surface border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'}
                    `}
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                ) : (
                  <button 
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm border-l-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-surface border-transparent hover:border-neutral-300 dark:hover:border-neutral-700"
                  >
                    {item.icon}
                    {item.name}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </motion.div>
      
      <div className="p-4 border-t border-neutral-200 dark:border-border flex flex-col gap-2 shrink-0">
        <button 
          className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-surface transition-colors py-2.5 px-3 w-full text-left rounded-lg text-sm font-medium"
          onClick={toggleTheme}
        >
          <span className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <span>Theme Toggle</span>
          </span>
          <div className="w-8 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full relative transition-colors shadow-inner">
             <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${theme === 'dark' ? 'left-[18px] bg-brand' : 'left-[2px]'}`}></div>
          </div>
        </button>
      </div>
    </div>
  );
}
