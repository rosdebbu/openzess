import { MessageSquare, Folder, Wrench, Sun, Moon, Database, Zap, SlidersHorizontal, Activity, Radio, Users, CalendarClock, Wand2, FileText, Smile, Layers, Monitor, BookOpen, Swords, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { PERSONAS } from '../utils/personas';

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ 'Tools': true });

  const toggleMenu = (name: string) => {
      setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };
  
  useEffect(() => {
    const handleZenMode = (e: any) => {
      setIsCollapsed(e.detail);
    };
    window.addEventListener('toggle-zen-mode', handleZenMode);
    
    // Listen for global theme toggle from App header
    const handleGlobalThemeToggle = () => toggleTheme();
    window.addEventListener('toggle-theme-global', handleGlobalThemeToggle);
    
    return () => {
        window.removeEventListener('toggle-zen-mode', handleZenMode);
        window.removeEventListener('toggle-theme-global', handleGlobalThemeToggle);
    };
  }, [toggleTheme]);
  
  const navSections = [
    {
      title: 'Control',
      items: [
        { name: 'Channels', icon: <Radio size={18} />, path: '/channels' },
        { name: 'Sessions', icon: <Users size={18} />, path: '/sessions' },
        { name: 'Matrix Viewer', icon: <Monitor size={18} />, path: '/matrix' }
      ]
    },
    {
      title: 'Workspace',
      items: [
        { name: 'Files', icon: <Folder size={18} />, path: '/files' },
        { 
          name: 'Tools', 
          icon: <Wrench size={18} />, 
          subItems: [
            { name: 'Core Tools', path: '/tools' },
            { name: 'Skills', path: '/skills' },
            { name: 'Cron Jobs', path: '/cron-jobs' },
            { name: 'MCP Plugins', path: '/mcp' }
          ]
        },
        { name: 'Configuration', icon: <SlidersHorizontal size={18} />, action: () => window.dispatchEvent(new Event('open-settings')) },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'Settings & Models', icon: <Database size={18} />, path: '/memory' },
      ]
    }
  ];

  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [activeAgentName, setActiveAgentName] = useState(() => localStorage.getItem('openzess_persona') || 'Architect');

  const handleAgentSelect = (personaKey: string) => {
      const p = PERSONAS[personaKey];
      if (p) {
          localStorage.setItem('openzess_persona', p.name);
          localStorage.setItem('openzess_sys_inst', p.instruction);
          localStorage.setItem('openzess_tool_term', p.tools.run_terminal_command.toString());
          localStorage.setItem('openzess_tool_web', p.tools.search_the_web.toString());
          localStorage.setItem('openzess_tool_read', p.tools.read_web_page.toString());
          localStorage.setItem('openzess_tool_create', p.tools.create_file.toString());
          localStorage.setItem('openzess_tool_readf', p.tools.read_file.toString());
          localStorage.setItem('openzess_tool_edit', p.tools.edit_code.toString());
          setActiveAgentName(p.name);
          // Optional: refresh the UI or notify Chat that persona changed
          window.dispatchEvent(new Event('persona-changed'));
      }
      setShowAgentMenu(false);
  };

  return (
    <div className={`bg-[#fdfdfd] dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 shrink-0 flex flex-col h-full transition-all duration-300 relative z-20 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
      
      {/* Current Agent Dropdown Area Inspired by QwenPaw */}
      <div className={`p-4 border-b border-transparent shrink-0 flex flex-col justify-center relative ${isCollapsed ? 'items-center px-2' : ''}`}>
         {!isCollapsed ? (
             <div className="flex flex-col gap-1 w-full mt-2 relative">
                 <span className="text-[11px] text-neutral-400 font-medium tracking-wide uppercase px-1 mb-1">Current Agent ({Object.keys(PERSONAS).length})</span>
                 <button 
                    onClick={() => setShowAgentMenu(!showAgentMenu)}
                    className="flex items-center justify-between w-full p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors text-sm font-medium text-neutral-800 dark:text-neutral-200"
                 >
                     <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xs"><Smile size={12}/></div>
                         <span className="truncate max-w-[130px] text-left">{activeAgentName}</span>
                     </div>
                     <ChevronDown size={14} className={`text-neutral-400 transition-transform ${showAgentMenu ? 'rotate-180' : ''}`} />
                 </button>
                 
                 <AnimatePresence>
                    {showAgentMenu && (
                        <motion.div 
                           initial={{ opacity: 0, y: -5 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -5 }}
                           className="absolute top-[65px] left-0 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                        >
                           {Object.entries(PERSONAS).map(([key, p]) => (
                               <button 
                                  key={key}
                                  onClick={() => handleAgentSelect(key)}
                                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                               >
                                  {p.name}
                               </button>
                           ))}
                        </motion.div>
                    )}
                 </AnimatePresence>
             </div>
         ) : (
             <button onClick={() => setShowAgentMenu(!showAgentMenu)} className="w-10 h-10 mt-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl flex items-center justify-center transition-colors">
                 <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500"><Smile size={14}/></div>
             </button>
         )}
      </div>
      
      <motion.div 
        className="flex-1 py-2 px-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar"
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
        <div className="flex flex-col mb-2">
           <NavLink 
                to="/"
                className={({ isActive }) => `
                    flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ease-out font-medium text-sm border border-transparent
                    ${isActive ? 'bg-[#f0f0f0] dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}
                `}
            >
                <span className="shrink-0"><MessageSquare size={16} /></span>
                {!isCollapsed && <span className="truncate">Chat</span>}
            </NavLink>
        </div>

        {navSections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1.5">
            <p className={`text-[11px] text-neutral-400 dark:text-neutral-500 mb-1 font-medium tracking-wide ${isCollapsed ? 'text-center pl-0' : 'pl-3'}`}>
                {isCollapsed ? '—' : section.title}
            </p>
            {section.items.map((item) => (
              <motion.div 
                 key={item.name}
                 variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                 }}
                 title={item.name}
              >
                {item.subItems ? (
                  <div className="flex flex-col gap-1">
                      <button 
                         onClick={() => toggleMenu(item.name)}
                         className={`w-full flex items-center justify-between ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ease-out font-medium text-sm border border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-[#fafafa] dark:hover:bg-neutral-800/80`}
                      >
                         <div className="flex items-center gap-3">
                             <span className="shrink-0">{item.icon}</span>
                             {!isCollapsed && <span className="truncate">{item.name}</span>}
                         </div>
                         {!isCollapsed && <ChevronDown size={14} className={`transition-transform duration-300 ${openMenus[item.name] ? 'rotate-180' : ''}`} />}
                      </button>
                      
                      <AnimatePresence>
                         {openMenus[item.name] && !isCollapsed && (
                             <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex flex-col overflow-hidden relative"
                             >
                                 <div className="absolute left-[21px] top-1 bottom-1 w-[1px] bg-neutral-200 dark:bg-neutral-800 z-0"></div>
                                 <div className="flex flex-col pl-9 pr-2 py-1 gap-1 z-10">
                                     {item.subItems.map((subItem: any) => (
                                         <NavLink 
                                             key={subItem.name}
                                             to={subItem.path}
                                             className={({ isActive }) => `
                                                flex items-center py-2 px-3 rounded-lg transition-all duration-200 ease-out font-medium text-[13px] border border-transparent
                                                ${isActive ? 'bg-[#f0f0f0] dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-[#fafafa] dark:hover:bg-neutral-800/80'}
                                             `}
                                         >
                                             {subItem.name}
                                         </NavLink>
                                     ))}
                                 </div>
                             </motion.div>
                         )}
                      </AnimatePresence>
                  </div>
                ) : item.path ? (
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ease-out font-medium text-sm border border-transparent
                      ${isActive ? 'bg-[#f0f0f0] dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-[#fafafa] dark:hover:bg-neutral-800/80'}
                    `}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </NavLink>
                ) : (
                  <button 
                    onClick={item.action}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 ease-out font-medium text-sm border border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-[#fafafa] dark:hover:bg-neutral-800/80`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </motion.div>
      
      {/* Collapse Bottom Action */}
      <div className="p-3 border-t border-transparent flex justify-end shrink-0">
         <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10 hidden sm:flex items-center justify-center"
         >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
         </button>
      </div>

    </div>
  );
}
