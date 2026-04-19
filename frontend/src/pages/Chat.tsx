import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Terminal, Sparkles, Code, Globe, ShieldAlert, MonitorPlay, X, Mic, Users, Brain, Focus, Clock, RotateCcw, ChevronDown, Paperclip, Copy, CheckCircle2, Download, Play } from 'lucide-react';
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
  
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastProcessedMsgId, setLastProcessedMsgId] = useState<string | null>(null);
  const isStreamingRef = useRef(false);
  
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Stay alive while button is held
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => { setIsListening(true); isListeningRef.current = true; };
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(prev => (prev + ' ' + transcript).trim());
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        
        // J.A.R.V.I.S Auto-Submit logic
        if (autoSubmitRef.current) {
            autoSubmitRef.current = false;
            // Delay to allow input state to finalize
            setTimeout(() => {
                const submitBtn = document.getElementById('auto-submit-btn');
                if (submitBtn) submitBtn.click();
            }, 300);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListen = (e: any) => {
    e.preventDefault();
    if (!recognitionRef.current) {
        alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
    }
    if (!isListeningRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
    }
  };

  const stopListen = (e: any) => {
    e.preventDefault();
    if (isListeningRef.current) {
        autoSubmitRef.current = true;
        recognitionRef.current.stop();
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
    if (!suggestedText) setInput('');
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
       const p = localStorage.getItem('openzess_provider') || 'gemini';
       if (localStorage.getItem('openzess_tool_term') !== 'false') allowedTools.push('run_terminal_command');
       if (localStorage.getItem('openzess_tool_web') !== 'false') allowedTools.push('search_the_web');
       if (localStorage.getItem('openzess_tool_read') !== 'false') allowedTools.push('read_web_page');
       if (localStorage.getItem('openzess_tool_create') !== 'false') allowedTools.push('create_file');
       if (localStorage.getItem('openzess_tool_readf') !== 'false') allowedTools.push('read_file');
       if (localStorage.getItem('openzess_tool_edit') !== 'false') allowedTools.push('edit_code');
       
       // Force PC Control tools into standard agents if they exist in the registry 
       // to allow JARVIS Chrome control. (Backend plugin_registry automatically exports them if present)
       allowedTools.push('launch_application');
       allowedTools.push('keyboard_hotkey');
       allowedTools.push('keyboard_press');
       allowedTools.push('keyboard_type');
       allowedTools.push('mouse_click');
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

      // Phase 3 trigger: Electron TTS or Web TTS
      if (streamedResponse) {
          if ((window as any).electronAPI) {
              (window as any).electronAPI.companionSpeak(streamedResponse);
          } else if ('speechSynthesis' in window) {
              // Web native Jarvis playback natively strips markdown
              const utterThis = new SpeechSynthesisUtterance(streamedResponse.replace(/[*_#]/g, ''));
              window.speechSynthesis.speak(utterThis);
          }
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
    <div className={`flex flex-1 h-full w-full bg-[#0E1117] transition-all overflow-hidden relative ${zenMode ? 'p-6' : 'p-0'}`}>
      <div className={`flex flex-col relative h-full transition-all duration-500 ease-in-out shrink-0 ${activeArtifact ? 'w-1/2 border-r border-neutral-200 dark:border-neutral-800' : 'w-full'} ${zenMode ? 'rounded-3xl border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)] bg-[#121614]/50 overflow-hidden backdrop-blur-sm scale-[0.98]' : ''}`}>
        
        {/* Top Control Bar (OpenClaw Style) */}
        <div className={`w-full px-10 pt-6 pb-2 z-30 flex items-center justify-between shrink-0 transition-all ${zenMode ? 'px-12 pt-8' : ''}`}>
            {/* Left Header - Dropdowns */}
            <div className="flex items-center gap-3">
               <div className="relative">
                  <select className="appearance-none bg-[#1A1C23] border border-transparent hover:bg-[#252830] text-neutral-300 text-[13px] font-medium py-2.5 pl-4 pr-10 rounded-[12px] transition-all cursor-pointer focus:outline-none focus:ring-0 min-w-[220px]">
                     <option>main</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
               </div>
               <div className="relative group/select">
                  <div className="absolute inset-0 bg-transparent border-2 border-emerald-500/50 rounded-[14px] pointer-events-none -m-[1px]" />
                  <select 
                     className="appearance-none bg-transparent hover:bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)] text-neutral-200 text-[13px] font-medium py-2.5 pl-4 pr-10 rounded-[12px] transition-all cursor-pointer focus:outline-none focus:ring-0 min-w-[300px] outline-none"
                     defaultValue="gemini-3.1-flash-lite-preview-google"
                  >
                     <option className="bg-[#0E1117]" value="gemini-3.1-flash-lite-preview-google">gemini-3.1-flash-lite-preview · google</option>
                     <option className="bg-[#0E1117]" value="gemini-2.5-flash">gemini 2.5 flash</option>
                     <option className="bg-[#0E1117]" value="openai">openai</option>
                     <option className="bg-[#0E1117]" value="deepseek">deepseek</option>
                     <option className="bg-[#0E1117]" value="mistral-ai">mistral AI</option>
                     <option className="bg-[#0E1117]" value="groq">groq</option>
                     <option className="bg-[#0E1117]" value="cohere">cohere</option>
                     <option className="bg-[#0E1117]" value="glm">glm</option>
                     <option className="bg-[#0E1117]" value="gemma">gemma</option>
                     <option className="bg-[#0E1117]" value="qwen">qwen</option>
                     <option className="bg-[#0E1117]" value="kimi">kimi</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none group-hover/select:text-emerald-400 transition-colors" />
               </div>
            </div>

            {/* Right Header - Actions */}
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                     setMessages([]);
                     setTerminalLogs([]);
                     setPendingCalls(null);
                     setActiveArtifact(null);
                     setSearchParams({ new: 'true' }, { replace: true });
                  }}
                  title="New Chat / Refresh" 
                  className="w-[42px] h-[42px] rounded-[14px] bg-[#1A1C23] border border-transparent flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#252830] transition-all"
                >
                    <RotateCcw size={18} />
                </button>
                <div className="w-[1px] h-6 bg-neutral-800 mx-1"></div>
                <button 
                  onClick={() => setShowLogs(!showLogs)}
                  title="Memory Vault / Tool Output" 
                  className={`w-[42px] h-[42px] rounded-[14px] transition-all group flex items-center justify-center ${showLogs ? 'bg-[#121614] border-2 border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400' : 'bg-[#121614] border-2 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] text-emerald-500 hover:bg-emerald-500/10'}`}
                >
                    <Brain size={18} className="transition-transform group-hover:scale-110" />
                </button>
                <button 
                  onClick={() => {
                     const newZen = !zenMode;
                     setZenMode(newZen);
                     window.dispatchEvent(new CustomEvent('toggle-zen-mode', { detail: newZen }));
                  }}
                  title="Focus Mode (Zoom Out)" 
                  className={`w-[42px] h-[42px] rounded-[14px] transition-all flex items-center justify-center ${zenMode ? 'bg-[#121614] border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#1A1C23] border border-transparent text-neutral-400 hover:text-white hover:bg-[#252830]'}`}
                >
                    <Focus size={18} />
                </button>
                <button 
                  onClick={() => navigate('/sessions')}
                  title="View Details / History" 
                  className="w-[42px] h-[42px] rounded-[14px] bg-[#121614] border-2 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all group"
                >
                    <Clock size={18} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 relative overflow-hidden pointer-events-none select-none">
             {/* Emptied state per user request */}
             <div className="w-16 h-16 bg-neutral-900/50 rounded-full flex items-center justify-center opacity-30 shadow-inner">
                <Sparkles size={24} className="text-neutral-500" />
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
                    <div className="flex max-w-[90%] lg:max-w-[75%] gap-4">
                      {/* Agent Floating Avatar Star */}
                      <div className="flex-shrink-0 mt-3 hidden md:block">
                         <div className="w-10 h-10 rounded-[14px] bg-[#1A1C23] border border-white/5 flex items-center justify-center">
                            <Sparkles size={18} className="text-neutral-400" />
                         </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="relative group/bubble px-6 py-4 rounded-2xl bg-[#1E212A] border border-white/5 text-neutral-300 w-full prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#12141A] prose-pre:border prose-pre:border-white/5">
                          <button 
                             onClick={() => handleDeleteMessage(msg.id)}
                             className="absolute top-3 right-12 z-10 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white p-1.5 rounded-md opacity-0 group-hover/bubble:opacity-100 transition-all"
                          >
                             <X size={12} />
                          </button>
                          <button className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-300 opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-[#1A1C23] border border-white/10 p-1 rounded-md">
                              <span className="text-[11px] font-mono px-2">Copy</span>
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
                        <div className="flex items-center gap-3 px-2 text-xs text-neutral-500 font-medium">
                            <span className="text-neutral-400">Assistant</span>
                            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="flex gap-2">
                               <span className="text-neutral-600">1.2k ctx</span>
                               <span className="bg-[#1A1C23] px-2 py-0.5 rounded-full text-brand/70 border border-white/5">
                                  {localStorage.getItem('openzess_provider') || 'gemini'}
                               </span>
                            </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.role === 'user' && (
                      <div className="flex items-start gap-4 max-w-[85%] lg:max-w-[70%]">
                         <div className="flex flex-col items-end gap-1.5 w-full">
                           {/* Dark Blue Box for User */}
                           <div className="px-5 py-4 rounded-xl bg-[#1C2B42] text-neutral-300 whitespace-pre-wrap text-[15px] leading-relaxed w-full min-w-[200px]">
                              {msg.content}
                           </div>
                           <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium mr-1">
                              <span>You</span>
                              <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                         </div>
                         {/* User Avatar */}
                         <div className="flex-shrink-0 mt-2 hidden md:block">
                           <div className="w-10 h-10 rounded-[14px] bg-[#1C2B42] border border-white/5 flex items-center justify-center">
                              <div className="w-5 h-5 bg-blue-500/80 rounded-full" />
                           </div>
                         </div>
                      </div>
                  )}
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
            <div className="w-full max-w-4xl bg-[#1A1C23] border border-neutral-800/80 rounded-[1.5rem] flex items-end p-2 px-3 transition-all focus-within:border-brand/40 shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative z-20">
              <div className="flex gap-1.5 mb-[3px] shrink-0 pl-1">
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      multiple 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Attach File"
                    className="p-2.5 rounded-xl transition-all text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button 
                    onPointerDown={startListen}
                    onPointerUp={stopListen}
                    onPointerLeave={stopListen}
                    disabled={isLoading}
                    title="Hold to Speak (J.A.R.V.I.S Mode)"
                    className={`p-2.5 rounded-xl transition-all select-none ${isListening ? 'bg-emerald-500/20 text-emerald-500 animate-pulse scale-110 shadow-lg shadow-emerald-500/20' : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'}`}
                  >
                    <Mic size={18} />
                  </button>
                  <button 
                    onClick={handleToolToggle}
                    disabled={isLoading}
                    title={useTools ? "Tools: Enabled" : "Tools: Disabled"}
                    className={`p-2.5 rounded-xl transition-all ${useTools ? 'bg-brand/10 text-brand' : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'}`}
                  >
                    <Terminal size={18} />
                  </button>
              </div>
              <textarea
                className="flex-1 bg-transparent border-none text-neutral-200 text-[15px] resize-none px-3 py-3.5 min-h-[50px] max-h-[200px] focus:outline-none placeholder:text-neutral-600 leading-relaxed font-sans"
                placeholder="Message Agent (Enter to send)"
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
              <div className="flex gap-2 mb-[3px] shrink-0 pr-1">
                  <button 
                    onClick={() => setUseSwarm(!useSwarm)}
                    disabled={isLoading}
                    title="Swarm Mode"
                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${useSwarm ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'}`}
                  >
                    <Users size={18} />
                  </button>
                  <button 
                    id="auto-submit-btn"
                    className="bg-brand/90 hover:bg-brand text-white rounded-[10px] w-10 h-10 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ml-1 mt-1 shadow-md shadow-brand/10 active:scale-95"
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
