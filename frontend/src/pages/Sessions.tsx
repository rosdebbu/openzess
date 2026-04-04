import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Search, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Session {
  id: string;
  title: string;
  created_at: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/sessions');
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        <header className="mb-8 flex items-end justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white mb-2">
              <History className="text-brand" /> Past Chats
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">Resume your previous discussions and memory traces.</p>
          </div>
          
          <div className="relative">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
             <input 
               type="text" 
               placeholder="Search sessions..." 
               className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 pl-11 pr-4 py-2.5 rounded-xl w-64 focus:outline-none focus:border-brand/40 shadow-sm dark:shadow-none transition-colors text-sm font-medium"
             />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 rounded-full border-t-2 border-brand animate-spin"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800/60 border-dashed mt-10 shadow-sm dark:shadow-none transition-colors">
              <MessageSquare size={48} className="text-neutral-400 dark:text-neutral-600 mb-4" />
              <h2 className="text-xl font-medium text-neutral-800 dark:text-neutral-300 mb-2">No past chats found</h2>
              <p className="text-neutral-500 text-center max-w-md">Once you start chatting with openzess, your history will be saved here so you can pick up precisely where you left off.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessions.map((session, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={session.id}
                  onClick={() => navigate(`/?session_id=${session.id}`)}
                  className="group bg-white dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 hover:border-brand/30 transition-all cursor-pointer rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-brand/5"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-bl-full group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
                  
                  <h3 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3 line-clamp-2 leading-relaxed h-[48px] relative z-10 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    {session.title || "New Conversation"}
                  </h3>
                  
                  <div className="mt-auto flex items-center justify-between text-neutral-500 text-xs font-medium pt-4 border-t border-neutral-100 dark:border-neutral-800/50 relative z-10">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(session.created_at)}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 flex items-center gap-1 text-brand">
                      Resume <ArrowRight size={12} />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
