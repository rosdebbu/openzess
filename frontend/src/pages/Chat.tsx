import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Terminal, Sparkles, Code, Globe, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams, useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  tools?: any;
}

interface ToolExecution {
  tool: string;
  args: any;
  output: string;
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<ToolExecution[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);
  
  useEffect(() => {
    if (id) {
      setIsFetchingHistory(true);
      setTerminalLogs([]);
      axios.get(`http://localhost:8000/api/sessions/${id}`)
        .then(res => {
           setMessages(res.data.messages);
           // Restore terminal logs from history
           const allTools: ToolExecution[] = [];
           res.data.messages.forEach((m: any) => {
              if (m.tools) allTools.push(...m.tools);
           });
           setTerminalLogs(allTools);
        })
        .catch(err => {
           console.error(err);
           navigate('/');
        })
        .finally(() => setIsFetchingHistory(false));
    } else {
      setMessages([]);
      setTerminalLogs([]);
    }
  }, [id, navigate]);

  const handleSend = async (suggestedText?: string) => {
    const textToSend = suggestedText ?? input;
    if (!textToSend.trim()) return;

    const apiKey = localStorage.getItem('openzess_api_key');
    if (!apiKey) {
      window.dispatchEvent(new Event('open-settings'));
      return;
    }

    const tempId = Date.now().toString();
    const userMessage: Message = { id: tempId, role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    
    if (!suggestedText) setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: textToSend,
        api_key: apiKey,
        session_id: id || null
      });

      const data = response.data;
      
      if (data.tools && data.tools.length > 0) {
        setTerminalLogs(prev => [...prev, ...data.tools]);
      }

      setMessages(prev => [...prev, { id: Date.now().toString() + 'r', role: 'agent', content: data.reply }]);
      
      // If we just created a new session, navigate to it to lock it in
      if (!id && data.session_id) {
         navigate(`/chat/${data.session_id}`);
         window.dispatchEvent(new Event('refresh-sessions'));
      }
      
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.detail || error.message || 'Unknown error occurred.';
      setMessages(prev => [...prev, { id: 'err', role: 'agent', content: `Error: ${errMsg}` }]);
      if (errMsg.includes('API Key')) {
        window.dispatchEvent(new Event('open-settings'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingHistory) {
      return (
         <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-brand" size={32} />
         </div>
      );
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col relative h-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 mt-[-100px]">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               className="w-20 h-20 bg-gradient-to-br from-brand to-brand-hover rounded-full flex items-center justify-center shadow-lg shadow-brand/20 mb-6 border-4 border-neutral-900"
            >
              <Sparkles size={32} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-medium mb-3 text-neutral-100">Hello, how can I help you today?</h2>
            <p className="text-neutral-400 mb-10 text-sm">I am a helpful assistant with persistent memory powered by SQLite.</p>
            
            <div className="flex flex-col gap-3 w-full max-w-lg">
              <button onClick={() => handleSend("List the files in this directory.")} className="bg-surface hover:bg-neutral-800 transition-colors border border-border p-4 rounded-xl flex items-center justify-between group">
                <span className="flex items-center gap-3 text-neutral-300 font-medium text-sm"><Code size={16} className="text-brand" /> Check local files</span>
                <span className="text-neutral-500 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button onClick={() => handleSend("Search the web for the latest AI news.")} className="bg-surface hover:bg-neutral-800 transition-colors border border-border p-4 rounded-xl flex items-center justify-between group">
                <span className="flex items-center gap-3 text-neutral-300 font-medium text-sm"><Globe size={16} className="text-emerald-500" /> Search the web</span>
                <span className="text-neutral-500 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto w-full px-10 py-8 flex flex-col gap-6">
            <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto pb-4">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex max-w-[90%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                >
                  <div className={`px-5 py-4 rounded-2xl leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-neutral-800/80 text-neutral-100 whitespace-pre-wrap' 
                      : 'bg-transparent text-neutral-200 w-full prose prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-border'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="flex gap-4">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-hover shrink-0 flex items-center justify-center shadow-lg shadow-brand/20 mt-1">
                            <span className="text-white font-black text-xs">O</span>
                          </div>
                         <div className="pt-1 w-full"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex max-w-[85%] self-start pl-4">
                   <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-hover shrink-0 flex items-center justify-center shadow-lg shadow-brand/20 mt-1">
                        <span className="text-white font-black text-xs">O</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-transparent">
                          <div className="flex gap-1.5 px-2">
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }}></div>
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }}></div>
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></div>
                          </div>
                      </div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="px-10 pb-8 flex justify-center sticky bottom-0 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent pt-10 shrink-0">
          <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl flex items-end p-2 px-3 transition-all focus-within:border-brand/40 shadow-2xl relative z-20">
            <textarea
              className="flex-1 bg-transparent border-none text-neutral-200 text-base resize-none px-3 py-3 min-h-[50px] max-h-[200px] focus:outline-none placeholder:text-neutral-500 leading-relaxed font-sans"
              placeholder="Ask anything... (/tools or /files via prompt)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />
            <button 
              className="bg-brand hover:bg-brand-hover text-white rounded-xl w-10 h-10 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-md mb-1.5"
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading}
            >
              <Send size={16} className="translate-y-[1px] translate-x-[1px]" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Dynamic Logs Sidebar for Chat */}
      {terminalLogs.length > 0 && (
         <div className="w-[320px] lg:w-[400px] flex flex-col bg-surface/50 border-l border-border backdrop-blur-xl shrink-0 h-full hidden xl:flex">
            <div className="p-5 border-b border-border flex items-center justify-between shadow-sm">
              <div className="font-semibold flex items-center gap-2 text-sm text-neutral-300">
                <Terminal size={14} className="text-brand" /> Terminal Activity
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-emerald-400 flex flex-col gap-3">
              {terminalLogs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="bg-black/60 p-3 rounded-lg border border-border/50 flex flex-col gap-1.5"
                >
                  <div className="text-yellow-500 font-semibold truncate hover:text-clip hover:whitespace-normal transition-all" title={JSON.stringify(log.args)}>$&gt; {log.tool}(...)</div>
                  <div className="text-emerald-500/80 leading-relaxed h-[100px] overflow-y-auto custom-scrollbar">
                    {log.output}
                  </div>
                </motion.div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
      )}
    </div>
  );
}
