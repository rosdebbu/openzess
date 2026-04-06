import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Send, Terminal, Sparkles, Code, Globe, ShieldAlert, MonitorPlay, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PERSONAS } from '../utils/personas';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

interface ToolExecution {
  tool: string;
  args: any;
  output: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<ToolExecution[]>([]);
  const [pendingCalls, setPendingCalls] = useState<any[] | null>(null);
  
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [lastProcessedMsgId, setLastProcessedMsgId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      loadSessionHistory(sessionId);
    } else {
      setMessages([]);
      setTerminalLogs([]);
      setPendingCalls(null);
      setActiveArtifact(null);
      setLastProcessedMsgId(null);
    }
  }, [sessionId]);

  const loadSessionHistory = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:8000/api/sessions/${id}/messages`);
      if (response.data.messages) {
        const history: Message[] = response.data.messages.map((m: any) => ({
          id: m.id.toString(),
          role: m.role,
          content: m.content
        }));
        setMessages(history);
      }
    } catch (error) {
      console.error("Failed to load session history", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Live UI Artifact Scanner
    const reversedMessages = [...messages].reverse();
    const latestHtmlMsg = reversedMessages.find(m => m.role === 'agent' && m.content.includes('```html'));
    
    if (latestHtmlMsg && latestHtmlMsg.id !== lastProcessedMsgId) {
       const match = latestHtmlMsg.content.match(/```html([\s\S]*?)```/);
       if (match && match[1]) {
           setActiveArtifact(match[1].trim());
           setLastProcessedMsgId(latestHtmlMsg.id);
       }
    }
  }, [messages, isLoading, pendingCalls]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);


  const handleSend = async (suggestedText?: string) => {
    const textToSend = suggestedText ?? input;
    if (!textToSend.trim()) return;

    const apiKey = localStorage.getItem('openzess_api_key');
    if (!apiKey) {
      window.dispatchEvent(new Event('open-settings'));
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!suggestedText) setInput('');
    setIsLoading(true);
    setPendingCalls(null);

    // Swarm Native Parser
    const textTrimmed = textToSend.trim();
    let systemInstruction = localStorage.getItem('openzess_sys_inst') || undefined;
    const allowedTools: string[] = [];

    const isSwarm = textTrimmed.startsWith('@');
    const triggerKeyword = isSwarm ? textTrimmed.split(' ')[0].substring(1).toLowerCase() : null;
    
    // Combine standard personas with local storage skills
    let activePersona = null;
    if (triggerKeyword) {
        if (PERSONAS[triggerKeyword]) {
            activePersona = PERSONAS[triggerKeyword];
        } else {
            const customStored = localStorage.getItem('openzess_custom_skills');
            if (customStored) {
                try {
                    const parsed = JSON.parse(customStored);
                    if (parsed[triggerKeyword]) {
                        activePersona = parsed[triggerKeyword];
                    }
                } catch(e) { console.error(e); }
            }
        }
    }
    
    if (triggerKeyword && activePersona) {
       // Deep Hot Swap Activated for Swarm Agent
       systemInstruction = activePersona.instruction;
       const t = activePersona.tools;
       if (t.run_terminal_command) allowedTools.push('run_terminal_command');
       if (t.search_the_web) allowedTools.push('search_the_web');
       if (t.read_web_page) allowedTools.push('read_web_page');
       if (t.create_file) allowedTools.push('create_file');
       if (t.read_file) allowedTools.push('read_file');
       if (t.edit_code) allowedTools.push('edit_code');
    } else {
       // Standard Load
       if (localStorage.getItem('openzess_tool_term') !== 'false') allowedTools.push('run_terminal_command');
       if (localStorage.getItem('openzess_tool_web') !== 'false') allowedTools.push('search_the_web');
       if (localStorage.getItem('openzess_tool_read') !== 'false') allowedTools.push('read_web_page');
       if (localStorage.getItem('openzess_tool_create') !== 'false') allowedTools.push('create_file');
       if (localStorage.getItem('openzess_tool_readf') !== 'false') allowedTools.push('read_file');
       if (localStorage.getItem('openzess_tool_edit') !== 'false') allowedTools.push('edit_code');
    }

    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: userMessage.content,
        api_key: apiKey,
        provider: localStorage.getItem('openzess_provider') || 'gemini',
        session_id: sessionId || undefined,
        system_instruction: systemInstruction,
        allowed_tools: allowedTools
      });

      const data = response.data;
      
      if (data.session_id && data.session_id !== sessionId) {
        setSearchParams({ session_id: data.session_id }, { replace: true });
      }
      
      if (data.auth_required) {
          setPendingCalls(data.pending_calls);
          return;
      }
      
      if (data.tools && data.tools.length > 0) {
        setTerminalLogs(prev => [...prev, ...data.tools]);
      }

      setMessages(prev => [...prev, { id: Date.now().toString() + 'r', role: 'agent', content: data.reply }]);
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

  const handleApproval = async (approved: boolean) => {
      setIsLoading(true);
      const callsRef = pendingCalls;
      setPendingCalls(null);
      
      try {
         const response = await axios.post('http://localhost:8000/api/chat/approve', {
             session_id: sessionId,
             pending_calls: callsRef,
             approved: approved
         });
         
         const data = response.data;
         
         if (data.auth_required) {
             setPendingCalls(data.pending_calls);
             return;
         }
         
         if (data.tools && data.tools.length > 0) {
            setTerminalLogs(prev => [...prev, ...data.tools]);
         }
         setMessages(prev => [...prev, { id: Date.now().toString() + 'r', role: 'agent', content: data.reply }]);
      } catch (error: any) {
          console.error(error);
          setMessages(prev => [...prev, { id: 'err', role: 'agent', content: `Error fulfilling execution.` }]);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-1 h-full w-full bg-neutral-50 dark:bg-neutral-950 transition-colors overflow-hidden">
      <div className={`flex flex-col relative h-full transition-all duration-500 ease-in-out shrink-0 ${activeArtifact ? 'w-1/2 border-r border-neutral-200 dark:border-neutral-800' : 'w-full'}`}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 mt-[-100px]">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               className="w-20 h-20 bg-gradient-to-br from-brand to-brand-hover rounded-full flex items-center justify-center shadow-lg shadow-brand/20 mb-6 border-4 border-neutral-900"
            >
              <Sparkles size={32} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-medium mb-3 text-neutral-900 dark:text-neutral-100">can I help you today?</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-10 text-sm">Mention Swarm agents (e.g. @scraper or @codegen) to swap dynamically.</p>
            
            <div className="flex flex-col gap-3 w-full max-w-lg">
              <button onClick={() => handleSend("List the files in this directory.")} className="bg-white dark:bg-surface hover:bg-neutral-50 dark:hover:bg-neutral-800/50 shadow-sm dark:shadow-none transition-colors border border-neutral-200 dark:border-border p-4 rounded-xl flex items-center justify-between group">
                <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-300 font-medium text-sm"><Code size={16} className="text-brand" /> Check local files</span>
                <span className="text-neutral-500 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button onClick={() => handleSend("@scraper Search the web for the latest React news.")} className="bg-white dark:bg-surface hover:bg-neutral-50 dark:hover:bg-neutral-800/50 shadow-sm dark:shadow-none transition-colors border border-neutral-200 dark:border-border p-4 rounded-xl flex items-center justify-between group">
                <span className="flex items-center gap-3 text-neutral-800 dark:text-neutral-300 font-medium text-sm"><Globe size={16} className="text-emerald-500" /> Delegate search to Scraper</span>
                <span className="text-neutral-500 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto w-full px-10 py-8 flex flex-col gap-6 custom-scrollbar">
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
                      ? 'bg-neutral-200/50 dark:bg-neutral-800/80 text-neutral-900 border border-neutral-200 dark:border-transparent dark:text-neutral-100 whitespace-pre-wrap' 
                      : 'bg-transparent text-neutral-800 dark:text-neutral-200 w-full prose dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-100 dark:prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-200 dark:prose-pre:border-border'
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
              {isLoading && !pendingCalls && (
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

        <div className="px-10 pb-8 flex justify-center sticky bottom-0 bg-gradient-to-t from-neutral-50 via-neutral-50 dark:from-neutral-950 dark:via-neutral-950 to-transparent pt-10 shrink-0">
          
          {pendingCalls ? (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-4xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col p-5 shadow-xl z-20">
                 <div className="text-rose-800 dark:text-rose-400 font-semibold mb-3 flex items-center gap-2">
                    <ShieldAlert size={20} />
                    Agent requires your permission to execute {pendingCalls.length} sensitive local command(s).
                 </div>
                 
                 <div className="flex flex-col gap-2 mb-5 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {pendingCalls.map((c, i) => (
                       <div key={i} className="bg-white/60 dark:bg-black/40 p-3 rounded-xl text-xs font-mono border border-rose-100 dark:border-rose-900/40 text-neutral-900 dark:text-neutral-300">
                          <span className="font-bold text-rose-600 dark:text-rose-400 mr-2">{c.name}</span>
                          <span className="text-neutral-600 dark:text-neutral-400">{JSON.stringify(c.args)}</span>
                       </div>
                    ))}
                 </div>

                 <div className="flex gap-3">
                    <button onClick={() => handleApproval(true)} disabled={isLoading} className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-brand/20">
                       Safe to Approve
                    </button>
                    <button onClick={() => handleApproval(false)} disabled={isLoading} className="flex-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 py-3 rounded-xl font-medium transition-colors border border-rose-200 dark:border-rose-900 shadow-sm">
                       Reject Operation
                    </button>
                 </div>
              </motion.div>
          ) : (
            <div className="w-full max-w-4xl bg-white/70 dark:bg-black/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-3xl flex items-end p-2.5 px-4 transition-all focus-within:border-brand/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative z-20 overflow-hidden">
              <textarea
                className="flex-1 bg-transparent border-none text-neutral-900 dark:text-neutral-200 text-base resize-none px-3 py-3 min-h-[50px] max-h-[200px] focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 leading-relaxed font-sans"
                placeholder="Ask anything... (@scraper or @codegen via swarm)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                rows={1}
              />
              <button 
                className="bg-brand hover:bg-brand-hover text-white rounded-2xl w-12 h-12 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-brand/20 mb-1 active:scale-95"
                onClick={() => handleSend()} 
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} className="translate-y-[1px] translate-x-[1px]" />
              </button>
            </div>
          )}

        </div>
      </div>
      
      {/* Live Artifact Panel */}
      <AnimatePresence>
      {activeArtifact && (
         <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-white dark:bg-neutral-900 flex flex-col shrink-0 overflow-hidden relative shadow-2xl z-40 border-l border-neutral-200 dark:border-neutral-800"
         >
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-black/40 flex justify-between items-center shrink-0">
               <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2.5 text-sm tracking-wide">
                  <MonitorPlay size={16} className="text-emerald-500" /> 
                  Active UI Environment
               </div>
               <button onClick={() => setActiveArtifact(null)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white dark:hover:bg-neutral-800 p-1.5 rounded-lg transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                 <X size={16} />
               </button>
            </div>
            <div className="flex-1 w-full h-full bg-white relative">
               <iframe 
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                       <meta charset="utf-8">
                       <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body>
                       ${activeArtifact}
                    </body>
                    </html>
                  `}
                  className="w-full h-full border-none bg-white absolute inset-0"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                  title="Live Preview"
               />
            </div>
         </motion.div>
      )}
      </AnimatePresence>

      {/* Dynamic Logs Sidebar for Chat (hidden if Artifact is open) */}
      {!activeArtifact && terminalLogs.length > 0 && (
         <div className="w-[320px] lg:w-[400px] flex flex-col bg-neutral-100/50 dark:bg-surface/50 border-l border-neutral-200 dark:border-border backdrop-blur-xl shrink-0 h-full hidden xl:flex transition-colors duration-300">
            <div className="p-5 border-b border-neutral-200 dark:border-border flex items-center justify-between shadow-sm">
              <div className="font-semibold flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-300">
                <Terminal size={14} className="text-brand" /> Executed Tool Logs
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs flex flex-col gap-3">
              {terminalLogs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="bg-white dark:bg-black/60 p-3 rounded-lg border border-neutral-200 dark:border-border/50 flex flex-col gap-1.5 shadow-sm dark:shadow-none"
                >
                  <div className="text-yellow-600 dark:text-yellow-500 font-semibold truncate hover:text-clip hover:whitespace-normal transition-all" title={JSON.stringify(log.args)}>$&gt; {log.tool}(...)</div>
                  <div className="text-emerald-700 dark:text-emerald-500/80 leading-relaxed h-[100px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
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
