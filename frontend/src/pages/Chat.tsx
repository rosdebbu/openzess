import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Terminal, Sparkles, Code, Globe, ShieldAlert, MonitorPlay, X, Mic, Users, Brain, Focus, Clock, RotateCcw, ChevronDown, Paperclip, Copy, CheckCircle2, Download, Play, FileText, Plus, Image } from 'lucide-react';
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
  const [useTools, setUseTools] = useState(() => localStorage.getItem('openzess_use_tools') !== 'false');
  const [useSwarm, setUseSwarm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastProcessedMsgId, setLastProcessedMsgId] = useState<string | null>(null);
  const isStreamingRef = useRef(false);
  const [currentPersonaKey, setCurrentPersonaKey] = useState(() => localStorage.getItem('openzess_persona') || 'architect');

  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    }
    const handlePersonaChanged = () => {
      setCurrentPersonaKey(localStorage.getItem('openzess_persona') || 'architect');
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("persona-changed", handlePersonaChanged);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("persona-changed", handlePersonaChanged);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          setInput(prev => prev + `\n[Attached File: ${file.name}]\n`);
          e.target.value = ''; // trigger reset
      }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const handleDownload = (code: string, language: string) => {
      const ext = language || 'txt';
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openzess_snippet.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleRun = (code: string) => {
      setActiveArtifact(code);
  };

  useEffect(() => {
    if (sessionId && !isStreamingRef.current) {
      localStorage.setItem('openzess_current_session', sessionId);
      loadSessionHistory(sessionId);
    } else if (!sessionId) {
      const isNewReq = searchParams.get('new') === 'true';
      const storedSession = localStorage.getItem('openzess_current_session');
      
      if (isNewReq) {
         localStorage.removeItem('openzess_current_session');
         setSearchParams({}, { replace: true });
         setMessages([]);
         setTerminalLogs([]);
         setPendingCalls(null);
         setActiveArtifact(null);
         setLastProcessedMsgId(null);
      } else if (storedSession) {
         setSearchParams({ session_id: storedSession }, { replace: true });
      } else {
         setMessages([]);
         setTerminalLogs([]);
         setPendingCalls(null);
         setActiveArtifact(null);
         setLastProcessedMsgId(null);
      }
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

  const handleSendRef = useRef<any>(null);

  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const finalTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        finalTranscriptRef.current = inputRef.current ? inputRef.current + ' ' : '';
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let sessionFinal = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            sessionFinal += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentText = (finalTranscriptRef.current + sessionFinal + interimTranscript).trim();
        setInput(currentText);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        if (sessionFinal.trim().length > 0 && interimTranscript.trim().length === 0) {
            silenceTimerRef.current = setTimeout(() => {
                handleSendRef.current(currentText);
                recognition.stop();
            }, 2500);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
         setIsListening(false);
         if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
      }
      try { recognitionRef.current.start(); } catch(e) {}
    }
  };


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
    if (!suggestedText) {
       setInput('');
       setTimeout(() => {
           const tas = document.querySelectorAll('textarea');
           tas.forEach(ta => ta.style.height = 'auto');
       }, 10);
    }
    setIsLoading(true);
    isStreamingRef.current = true;
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
    
    if (!useTools) {
       // User opted for Fast Chat mode (Tools disabled entirely)
       // allowedTools remains empty []
    } else if (triggerKeyword && activePersona) {
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
      const requestBody = {
        message: userMessage.content,
        api_key: apiKey,
        provider: localStorage.getItem('openzess_provider') || 'gemini',
        session_id: sessionId || undefined,
        system_instruction: systemInstruction,
        allowed_tools: allowedTools,
        stream: true,
        use_swarm: useSwarm,
        matrix_keys: {
            deepseek2: localStorage.getItem('openzess_deepseek2_key') || '',
            deepseek3: localStorage.getItem('openzess_deepseek3_key') || '',
            glm: localStorage.getItem('openzess_glm_key') || '',
        }
      };

      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const responseId = Date.now().toString() + 'r';
      setMessages(prev => [...prev, { id: responseId, role: 'agent', content: '' }]);

      let done = false;
      let streamedResponse = '';
      let buffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '');
                    try {
                        const data = JSON.parse(dataStr);
                        
                        if (data.type === 'session') {
                            if (data.session_id && data.session_id !== sessionId) {
                              setSearchParams({ session_id: data.session_id }, { replace: true });
                            }
                        } else if (data.type === 'content') {
                            streamedResponse += data.content;
                            setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: streamedResponse } : m));
                        } else if (data.type === 'tool_start') {
                            streamedResponse += `\n\n⚙️ Executing \`${data.tool}\`...\n\n`;
                            setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: streamedResponse } : m));
                        } else if (data.type === 'tool_result') {
                            setTerminalLogs(prev => [...prev, { tool: data.tool, args: data.args, output: data.output }]);
                        } else if (data.type === 'auth_required') {
                            setPendingCalls(data.pending_calls);
                        } else if (data.type === 'error') {
                            streamedResponse += `\n\n❌ Error: ${data.error}`;
                            setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: streamedResponse } : m));
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data', e);
                    }
                }
            }
        }
      }

      // Phase 3 trigger
      if (streamedResponse && (window as any).electronAPI) {
          (window as any).electronAPI.companionSpeak(streamedResponse);
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || 'Unknown error occurred.';
      setMessages(prev => [...prev, { id: 'err', role: 'agent', content: `Error: ${errMsg}` }]);
      if (errMsg.includes('API Key')) {
        window.dispatchEvent(new Event('open-settings'));
      }
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  };
  
  handleSendRef.current = handleSend;

  const handleApproval = async (approved: boolean) => {
      setIsLoading(true);
      const callsRef = pendingCalls;
      setPendingCalls(null);
      
      try {
         const response = await fetch('http://localhost:8000/api/chat/approve', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 session_id: sessionId,
                 pending_calls: callsRef,
                 approved: approved,
                 stream: true
             })
         });
         
         if (!response.ok) {
             const errorText = await response.text();
             throw new Error(errorText);
         }

         if (!response.body) throw new Error("No response body");

         const reader = response.body.getReader();
         const decoder = new TextDecoder();
         
         const responseId = Date.now().toString() + 'r';
         setMessages(prev => [...prev, { id: responseId, role: 'agent', content: '' }]);

         let done = false;
         let streamedResponse = '';
         let buffer = '';

         while (!done) {
             const { value, done: doneReading } = await reader.read();
             done = doneReading;
             if (value) {
                 buffer += decoder.decode(value, { stream: true });
                 
                 const lines = buffer.split('\n\n');
                 buffer = lines.pop() || '';
                 
                 for (const line of lines) {
                     if (line.startsWith('data: ')) {
                         const dataStr = line.replace('data: ', '');
                         try {
                             const data = JSON.parse(dataStr);
                             
                             if (data.type === 'content') {
                                 streamedResponse += data.content;
                                 setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: streamedResponse } : m));
                             } else if (data.type === 'tool_start') {
                                 streamedResponse += `\n\n⚙️ Executing \`${data.tool}\`...\n\n`;
                                 setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: streamedResponse } : m));
                             } else if (data.type === 'tool_result') {
                                 setTerminalLogs(prev => [...prev, { tool: data.tool, args: data.args, output: data.output }]);
                             } else if (data.type === 'auth_required') {
                                 setPendingCalls(data.pending_calls);
                             } else if (data.type === 'error') {
                                 streamedResponse += `\n\n❌ Error: ${data.error}`;
                                 setMessages(prev => prev.map(m => m.id === responseId ? { ...m, content: streamedResponse } : m));
                             }
                         } catch (e) {
                             console.error('Error parsing SSE data', e);
                         }
                     }
                 }
             }
         }
         
         // Phase 3 trigger
         if (streamedResponse && (window as any).electronAPI) {
             (window as any).electronAPI.companionSpeak(streamedResponse);
         }
      } catch (error: any) {
          console.error(error);
          setMessages(prev => [...prev, { id: 'err', role: 'agent', content: `Error fulfilling execution: ${error.message}` }]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleToolToggle = () => {
    const val = !useTools;
    setUseTools(val);
    localStorage.setItem('openzess_use_tools', val.toString());
  };

  const handleDeleteMessage = async (msgId: string) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (!msgId.includes('r') && msgId !== 'err' && sessionId) {
          try {
              await axios.delete(`http://localhost:8000/api/messages/${msgId}?session_id=${sessionId}`);
          } catch(e) { console.error("Failed to delete", e); }
      }
  };

  return (
    <div className={`flex flex-1 h-full w-full bg-white dark:bg-[#131314] transition-colors duration-500 overflow-hidden relative ${zenMode ? 'p-2 md:p-6' : 'p-0'}`}>
      <div className={`flex flex-col relative h-full transition-all duration-500 ease-in-out shrink-0 ${activeArtifact ? 'w-1/2 border-r border-neutral-200 dark:border-neutral-800' : 'w-full'} ${zenMode ? 'rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl bg-white/50 dark:bg-black/20 overflow-hidden backdrop-blur-xl scale-[0.98]' : ''}`}>
        
        {/* Modern Clean Header */}
        <div className={`w-full px-5 pt-5 pb-2 z-30 flex items-center justify-between shrink-0 transition-all ${zenMode ? 'px-8 pt-8' : ''}`}>
            {/* Left Header - Dropdowns */}
            <div className="flex items-center gap-1">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
                     {PERSONAS[currentPersonaKey]?.name || 'Developer'}
                  </span>
               </div>
               <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-700/50 mx-1"></div>
               <div className="relative group/select">
                  <select 
                     className="appearance-none bg-transparent hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 text-[14px] font-medium py-2 pl-3 pr-8 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-0 max-w-[200px] outline-none"
                     defaultValue="gemini-3.1-flash-lite-preview-google"
                  >
                     <option className="bg-white dark:bg-[#131314]" value="gemini-3.1-flash-lite-preview-google">Gemini 3.1 Flash</option>
                     <option className="bg-white dark:bg-[#131314]" value="gemini-2.5-flash">Gemini 2.5</option>
                     <option className="bg-white dark:bg-[#131314]" value="openai">OpenAI GPT-4o</option>
                     <option className="bg-white dark:bg-[#131314]" value="deepseek">DeepSeek</option>
                     <option className="bg-white dark:bg-[#131314]" value="qwen">Qwen</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none group-hover/select:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors" />
               </div>
            </div>

            {/* Right Header - Actions */}
            <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => {
                     setMessages([]);
                     setTerminalLogs([]);
                     setPendingCalls(null);
                     setActiveArtifact(null);
                     setSearchParams({ new: 'true' }, { replace: true });
                  }}
                  title="New Chat / Refresh" 
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                >
                    <RotateCcw size={16} />
                </button>
                <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-1"></div>
                <button 
                  onClick={() => setShowLogs(!showLogs)}
                  title="Memory Vault / Tool Output" 
                  className={`w-[36px] h-[36px] rounded-full transition-colors group flex items-center justify-center ${showLogs ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10'}`}
                >
                    <Brain size={16} />
                </button>
                <button 
                  onClick={() => {
                     const newZen = !zenMode;
                     setZenMode(newZen);
                     window.dispatchEvent(new CustomEvent('toggle-zen-mode', { detail: newZen }));
                  }}
                  title="Focus Mode" 
                  className={`w-[36px] h-[36px] rounded-full transition-colors flex items-center justify-center ${zenMode ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10'}`}
                >
                    <Focus size={16} />
                </button>
                <button 
                  onClick={() => navigate('/sessions')}
                  title="History" 
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                >
                    <Clock size={16} />
                </button>
            </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center p-6 md:p-10 relative overflow-y-auto max-w-4xl mx-auto w-full custom-scrollbar">
             <div className="mt-auto pb-8 pt-20">
                <h1 className="text-[44px] md:text-[52px] font-semibold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent pb-2 tracking-tight leading-tight">Hello, {PERSONAS[currentPersonaKey]?.name || 'Developer'}</h1>
                <p className="text-[32px] md:text-[38px] font-medium text-neutral-400 dark:text-neutral-500 tracking-tight mt-1 leading-tight">How can I help you today?</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full mt-auto">
                <button onClick={() => setInput("Link and explore this Github repository: ")} className="flex flex-col gap-3 p-4 rounded-[1.5rem] bg-neutral-50 hover:bg-neutral-100 dark:bg-[#1e1f20] dark:hover:bg-[#2a2b2e] transition-colors text-left group h-40 justify-between">
                    <div className="font-medium text-neutral-600 dark:text-neutral-300 text-[15px] leading-snug">Explore a<br/>GitHub Repository</div>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-black/20 shadow-sm flex items-center justify-center shrink-0 self-end">
                       <Globe size={18} className="text-blue-500" />
                    </div>
                </button>
                <button onClick={() => setInput("Let's brainstorm ideas and analysis for: ")} className="flex flex-col gap-3 p-4 rounded-[1.5rem] bg-neutral-50 hover:bg-neutral-100 dark:bg-[#1e1f20] dark:hover:bg-[#2a2b2e] transition-colors text-left group h-40 justify-between">
                    <div className="font-medium text-neutral-600 dark:text-neutral-300 text-[15px] leading-snug">Brainstorm ideas<br/>& workflow logic</div>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-black/20 shadow-sm flex items-center justify-center shrink-0 self-end">
                       <Brain size={18} className="text-purple-500" />
                    </div>
                </button>
                <button onClick={() => setInput("Analyze the attached PDF report: ")} className="flex flex-col gap-3 p-4 rounded-[1.5rem] bg-neutral-50 hover:bg-neutral-100 dark:bg-[#1e1f20] dark:hover:bg-[#2a2b2e] transition-colors text-left group h-40 justify-between">
                    <div className="font-medium text-neutral-600 dark:text-neutral-300 text-[15px] leading-snug">Analyze a<br/>PDF report</div>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-black/20 shadow-sm flex items-center justify-center shrink-0 self-end">
                       <FileText size={18} className="text-emerald-500" />
                    </div>
                </button>
                <button onClick={() => setInput("Make a roadmap and workflow for: ")} className="flex flex-col gap-3 p-4 rounded-[1.5rem] bg-neutral-50 hover:bg-neutral-100 dark:bg-[#1e1f20] dark:hover:bg-[#2a2b2e] transition-colors text-left group h-40 justify-between">
                    <div className="font-medium text-neutral-600 dark:text-neutral-300 text-[15px] leading-snug">Make a roadmap<br/>& project workflow</div>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-black/20 shadow-sm flex items-center justify-center shrink-0 self-end">
                       <Code size={18} className="text-orange-500" />
                    </div>
                </button>
             </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto w-full px-10 py-4 flex flex-col gap-6 custom-scrollbar">
            <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto pb-4">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start ml-2 lg:ml-12'} mb-4`}
                >
                  {msg.role === 'agent' && (
                    <div className="flex max-w-full lg:max-w-[90%] gap-4 w-full">
                      {/* Agent Avatar */}
                      <div className="flex-shrink-0 mt-1 hidden md:block">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                            <Sparkles size={14} />
                         </div>
                      </div>
                      <div className="flex flex-col gap-1 w-full min-w-0 pr-10">
                        <div className="relative group/bubble pt-1 pb-2 text-neutral-800 dark:text-neutral-100 w-full prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-50 dark:prose-pre:bg-[#1A1A1E] prose-pre:border prose-pre:border-neutral-200 dark:prose-pre:border-white/5">
                          <button 
                             onClick={() => handleDeleteMessage(msg.id)}
                             className="absolute top-0 -right-10 z-10 text-neutral-400 hover:text-rose-500 p-1.5 rounded-full opacity-0 group-hover/bubble:opacity-100 transition-all bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                          >
                             <X size={12} />
                          </button>
                          <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      const language = match ? match[1] : '';
                                      const isBlock = !inline && match;
                                      const codeString = String(children).replace(/\n$/, '');

                                      if (!isBlock) {
                                          return <code className={`${className} bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-[13px] font-mono`} {...props}>{children}</code>;
                                      }

                                      return (
                                          <div className="flex flex-col w-full my-4 rounded-xl overflow-hidden border border-neutral-200/50 dark:border-white/[0.1] bg-white dark:bg-[#131317]">
                                              <div className="flex items-center justify-between px-4 py-2 bg-neutral-100/80 dark:bg-[#1A1A1E] border-b border-neutral-200/50 dark:border-white/[0.05]">
                                                  <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">
                                                      {language || 'text'}
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                      <button onClick={() => { navigator.clipboard.writeText(codeString); setCopiedId(codeString); setTimeout(() => setCopiedId(null), 2000); }} className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5">
                                                          {copiedId === codeString ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />} Copy
                                                      </button>
                                                      <button onClick={() => handleDownload(codeString, language)} className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5">
                                                          <Download size={13} /> Download
                                                      </button>
                                                      {(language === 'html' || language === 'xml' || language === 'javascript') && (
                                                          <>
                                                              <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-700 mx-1" />
                                                              <button onClick={() => handleRun(codeString)} className="flex items-center gap-1.5 px-2 py-1 text-xs text-brand hover:text-brand-hover hover:bg-brand/10 transition-colors rounded bg-brand/5 shadow-sm">
                                                                  <Play size={13} fill="currentColor" /> Run
                                                              </button>
                                                          </>
                                                      )}
                                                  </div>
                                              </div>
                                              <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-[#F8F9FA] dark:bg-[#0D0D10] text-neutral-800 dark:text-neutral-300">
                                                  <code {...props}>{children}</code>
                                              </div>
                                          </div>
                                      );
                                  }
                              }}
                          >
                              {msg.content}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
                            <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 2000); }} className="flex items-center gap-1 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                               {copiedId === msg.id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                               {copiedId === msg.id ? 'Copied' : 'Copy'}
                            </button>
                            <span className="px-1.5 text-neutral-300 dark:text-neutral-700">•</span>
                            <span className="bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-neutral-500">
                               {localStorage.getItem('openzess_provider') || 'Gemini'}
                            </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.role === 'user' && (
                      <div className="flex items-start gap-3 max-w-[85%] lg:max-w-[65%] ml-auto">
                         <div className="flex flex-col items-end gap-1 w-full">
                           <div className="px-5 py-3.5 rounded-[1.5rem] bg-[#f0f4f9] dark:bg-[#1e1f20] text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap text-[15px] leading-relaxed w-full inline-block">
                              {msg.content}
                           </div>
                         </div>
                      </div>
                  )}
                </motion.div>
              ))}
              {isLoading && !pendingCalls && (
                <div className="flex max-w-full lg:max-w-[90%] gap-4 w-full">
                   <div className="flex-shrink-0 mt-1 hidden md:block">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                         <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                   </div>
                   <div className="flex flex-col gap-1 w-full min-w-0 pr-10">
                      <div className="relative group/bubble pt-1 pb-2 text-neutral-800 dark:text-neutral-100 w-full prose dark:prose-invert max-w-none">
                         <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="w-24 h-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[4px] my-2"></motion.div>
                      </div>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="px-4 md:px-10 pb-6 md:pb-8 flex justify-center sticky bottom-0 bg-gradient-to-t from-white via-white dark:from-[#131314] dark:via-[#131314] to-transparent pt-10 shrink-0">
          
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
            <div className="w-full max-w-4xl bg-[#f0f4f9] dark:bg-[#1e1f20] border border-transparent rounded-[2rem] flex items-end p-2 md:p-3 transition-all focus-within:bg-white dark:focus-within:bg-[#2a2b2e] focus-within:shadow-[0_4px_25px_rgba(0,0,0,0.05)] dark:focus-within:shadow-[0_4px_25px_rgba(0,0,0,0.3)] focus-within:border-neutral-200 dark:focus-within:border-neutral-700/50 relative z-20">
              <div ref={plusMenuRef} className="relative flex gap-1.5 mb-[3px] shrink-0 pl-1 mr-2">
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      multiple 
                  />
                  <button 
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                    disabled={isLoading}
                    title="Add features"
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlusMenuOpen ? 'bg-neutral-200 dark:bg-[#2a2b2e] text-neutral-800 dark:text-neutral-100' : 'bg-transparent text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-white/10 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                  >
                    <Plus size={20} className={`transition-transform duration-300 ${isPlusMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
                  </button>

                  <AnimatePresence>
                     {isPlusMenuOpen && (
                       <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-12 left-0 w-48 bg-[#f0f4f9] dark:bg-[#1e1f20] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700/50 py-2 z-50 overflow-hidden"
                       >
                          <button 
                             onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-200/60 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200 text-[14px] font-medium transition-colors"
                          >
                             <Paperclip size={18} className="text-neutral-500 dark:text-neutral-400" />
                             <span>Upload files</span>
                          </button>
                          
                          <button 
                             onClick={() => setIsPlusMenuOpen(false)}
                             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-200/60 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200 text-[14px] font-medium transition-colors"
                          >
                             <Image size={18} className="text-neutral-500 dark:text-neutral-400" />
                             <span>Photos</span>
                          </button>
                          
                          <button 
                             onClick={() => {
                                setInput(prev => prev + '\n```\n// Paste your code here\n```\n');
                                setIsPlusMenuOpen(false);
                             }}
                             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-200/60 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200 text-[14px] font-medium transition-colors"
                          >
                             <Code size={18} className="text-neutral-500 dark:text-neutral-400" />
                             <span>Import code</span>
                          </button>
                       </motion.div>
                     )}
                  </AnimatePresence>
              </div>
              <textarea
                className="flex-1 bg-transparent border-none text-neutral-800 dark:text-neutral-200 text-[15px] resize-none py-3 min-h-[48px] max-h-[200px] focus:outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400 leading-relaxed font-sans"
                placeholder={`Ask ${PERSONAS[currentPersonaKey]?.name || "Developer"}...`}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                rows={1}
              />
              <div className="flex gap-1.5 mb-[3px] shrink-0 pr-1 ml-2">
                  <button 
                    onClick={handleToolToggle}
                    disabled={isLoading}
                    title={useTools ? "Tools: Enabled" : "Tools: Disabled"}
                    className={`p-2.5 rounded-full transition-colors ${useTools ? 'text-brand bg-brand/10 dark:text-brand dark:bg-brand/20' : 'text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-white/10 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                  >
                    <Terminal size={18} />
                  </button>
                  <button 
                    onClick={toggleListen}
                    disabled={isLoading}
                    title="Speak Command"
                    className={`p-2.5 rounded-full transition-colors ${isListening ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-white/10 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                  >
                    <Mic size={18} />
                  </button>
                  <button 
                    className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-full w-10 h-10 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ml-1 active:scale-95 shadow-sm"
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || isLoading}
                  >
                    <Send size={16} className="translate-y-[1px] translate-x-[1px]" />
                  </button>
              </div>
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
      {!activeArtifact && showLogs && (
         <div className={`w-[320px] lg:w-[400px] flex flex-col bg-[#161922] border-l border-emerald-500/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] shrink-0 h-full hidden xl:flex transition-all duration-300 z-40 ${zenMode ? 'rounded-r-3xl' : ''}`}>
            <div className="p-5 border-b border-white/5 flex items-center justify-between shadow-sm bg-[#121614]/80">
              <div className="font-semibold flex items-center gap-2 text-sm text-emerald-400 tracking-wide">
                <Brain size={16} /> Advanced Tool Telemetry
              </div>
              <button onClick={() => setShowLogs(false)} className="text-neutral-500 hover:text-white">
                 <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs flex flex-col gap-3 custom-scrollbar">
              {terminalLogs.length === 0 ? (
                 <div className="text-neutral-600 italic text-center mt-10">No tool telemetry recorded yet...</div>
              ) : (
                 terminalLogs.map((log, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: 10 }}
                     animate={{ opacity: 1, x: 0 }}
                     key={i} 
                     className="bg-[#0E1117] p-3 rounded-lg border border-white/5 flex flex-col gap-1.5"
                   >
                     <div className="text-emerald-500 font-semibold truncate hover:text-clip hover:whitespace-normal transition-all" title={JSON.stringify(log.args)}>$&gt; {log.tool}(...)</div>
                     <div className="text-emerald-300/80 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                       {log.output}
                     </div>
                   </motion.div>
                 ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
      )}
    </div>
  );
}
