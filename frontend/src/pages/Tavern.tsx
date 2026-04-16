import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Users, Play, Ghost, MessageSquare, Bot, PlusCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface Persona {
  id: string;
  name: string;
  description: string;
  avatar_base64: string;
}

interface Message {
  role: string;
  content: string;
}

export default function Tavern() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [roomSessionId, setRoomSessionId] = useState(() => Math.random().toString(36).substring(7));
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomPersonas, setRoomPersonas] = useState<Persona[]>([]);
  const [targetPersona, setTargetPersona] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchPersonas = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/personas');
      setPersonas(res.data.personas);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await axios.post('http://localhost:8000/api/personas/import', formData);
      fetchPersonas();
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to parse Tavern card. Ensure it is a valid V2/V3 PNG or JSON.');
    } finally {
      setUploading(false);
    }
  };

  const deletePersona = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/personas/${id}`);
      setRoomPersonas(prev => prev.filter(p => p.id !== id));
      if (targetPersona === id) setTargetPersona(null);
      fetchPersonas();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRoomPresence = (p: Persona) => {
    if (roomPersonas.find(rp => rp.id === p.id)) {
      setRoomPersonas(prev => prev.filter(rp => rp.id !== p.id));
      if (targetPersona === p.id) setTargetPersona(null);
    } else {
      setRoomPersonas(prev => [...prev, p]);
      if (!targetPersona) setTargetPersona(p.id);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !targetPersona) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:8000/api/tavern/chat', {
        message: userMsg,
        api_key: localStorage.getItem('openzess_api_key') || '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',
        provider: localStorage.getItem('openzess_provider') || 'glm',
        session_id: roomSessionId,
        target_persona_id: targetPersona,
        stream: false
      });
      
      setMessages(prev => [...prev, { role: `agent:${res.data.agent_name || 'Agent'}`, content: res.data.reply }]);
    } catch (e) {
       console.error(e);
       setMessages(prev => [...prev, { role: 'system', content: 'Connection error while communicating with persona.'}]);
    } finally {
       setIsTyping(false);
    }
  };

  const handleAutoPlay = async () => {
     if (roomPersonas.length < 2) {
         alert("Need at least 2 characters in the room to trigger an auto-play interaction!");
         return;
     }
     
     // Find the next persona to speak, usually not the one who just spoke
     const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
     let nextPersonaId = roomPersonas[0].id;
     
     if (lastMsg && lastMsg.role.startsWith('agent:')) {
         const speakingName = lastMsg.role.split(':')[1];
         // Pick a random persona in the room who isn't the last speaker
         const others = roomPersonas.filter(p => p.name !== speakingName);
         if (others.length > 0) {
             const randomIdx = Math.floor(Math.random() * others.length);
             nextPersonaId = others[randomIdx].id;
         }
     }
     
     setTargetPersona(nextPersonaId);
     const name = roomPersonas.find(p => p.id === nextPersonaId)?.name;
     setIsTyping(true);

     try {
       const res = await axios.post('http://localhost:8000/api/tavern/chat', {
         message: `[System]: The group is waiting. It's your turn to speak, ${name}. Respond to the ongoing conversation naturally. DO NOT prefix your message with your name.`,
         api_key: localStorage.getItem('openzess_api_key') || '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',
         provider: localStorage.getItem('openzess_provider') || 'glm',
         session_id: roomSessionId,
         target_persona_id: nextPersonaId,
         stream: false
       });
       setMessages(prev => [...prev, { role: `agent:${res.data.agent_name}`, content: res.data.reply }]);
     } catch (e) {
        console.error(e);
     } finally {
        setIsTyping(false);
     }
  };


  return (
    <div className="flex-1 flex overflow-hidden bg-transparent">
       {/* Left Column: Character Shelf */}
       <div className="w-[320px] bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md border-r border-neutral-200 dark:border-border flex flex-col shrink-0">
          <div className="p-6 border-b border-neutral-200 dark:border-border flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Ghost size={20} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Tavern Shelf</h2>
                   <p className="text-xs text-neutral-500">Your loaded Personas</p>
                </div>
             </div>
             
             <label className="border-2 border-dashed border-indigo-500/30 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center shadow-inner">
                {uploading ? (
                   <div className="animate-spin text-indigo-500"><PlusCircle size={24} /></div>
                ) : (
                   <>
                     <Upload size={20} className="text-indigo-500" />
                     <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Import Tavern Card</span>
                     <span className="text-[10px] text-neutral-500 font-mono text-center">Drag inside or click (.png/.json)</span>
                   </>
                )}
                <input type="file" accept=".png,.json" className="hidden" onChange={handleFileUpload} disabled={uploading}/>
             </label>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
             <AnimatePresence>
                {personas.map(p => (
                   <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl shadow-sm group hover:border-indigo-500/50 transition-colors"
                   >
                      <div className="flex items-center gap-3 relative">
                         {p.avatar_base64 ? (
                            <img src={p.avatar_base64} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-neutral-100" />
                         ) : (
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400"><Bot size={20}/></div>
                         )}
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{p.name}</h3>
                            <p className="text-[10px] text-neutral-500 truncate mt-0.5">{p.description}</p>
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); deletePersona(p.id); }}
                            className="absolute -top-1 -right-1 p-1.5 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600 transition-all"
                         >
                            <Trash2 size={12} />
                         </button>
                      </div>
                      <div className="mt-3">
                         <button 
                            onClick={() => toggleRoomPresence(p)}
                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${roomPersonas.find(rp => rp.id === p.id) ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                         >
                            {roomPersonas.find(rp => rp.id === p.id) ? <><CheckCircle size={14}/> In Room</> : <><PlusCircle size={14}/> Add to Room</>}
                         </button>
                      </div>
                   </motion.div>
                ))}
             </AnimatePresence>
             {personas.length === 0 && (
                <div className="text-center p-6 text-sm text-neutral-500 dark:text-neutral-400">
                   No cards imported. Upload a PNG to begin!
                </div>
             )}
          </div>
       </div>

       {/* Right Column: The Room Chat */}
       <div className="flex-1 flex flex-col bg-white/30 dark:bg-surface/30 backdrop-blur-xl">
          <div className="p-6 border-b border-neutral-200 dark:border-border flex justify-between items-center bg-white/50 dark:bg-neutral-950/50">
             <div>
                 <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2"><Users size={20} className="text-brand"/> The Commons (Room)</h2>
                 <p className="text-xs text-neutral-500 mt-1">Multi-character interaction framework</p>
             </div>
             {roomPersonas.length > 0 && (
                 <div className="flex items-center gap-2">
                    <button 
                       onClick={handleAutoPlay}
                       disabled={isTyping}
                       className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                       <Play size={14} className={isTyping ? "animate-pulse" : ""} fill="currentColor"/> Let them talk!
                    </button>
                    <button 
                       onClick={() => { setMessages([]); setRoomSessionId(Math.random().toString(36).substring(7)); }}
                       className="bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-500 hover:text-white text-neutral-600 dark:text-neutral-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-transparent hover:border-rose-500"
                    >
                       Clear Room
                    </button>
                 </div>
             )}
          </div>
          
          {/* Main Chat Display */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
             {roomPersonas.length === 0 ? (
                <div className="m-auto text-center flex flex-col items-center gap-4 text-neutral-500 dark:text-neutral-400 max-w-sm">
                   <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center">
                      <Ghost size={32} className="text-neutral-300 dark:text-neutral-700"/>
                   </div>
                   <p className="text-base font-medium">The room is empty.</p>
                   <p className="text-sm border border-dashed border-neutral-300 dark:border-neutral-700 p-4 rounded-xl">Add imported Personas to the room from the left shelf to begin a multi-character simulation.</p>
                </div>
             ) : (
                <>
                   {messages.map((msg, i) => {
                      const isUser = msg.role === 'user';
                      const isSystem = msg.role === 'system';
                      const agentName = msg.role.startsWith('agent:') ? msg.role.split(':')[1] : 'Agent';
                      const pData = roomPersonas.find(p => p.name === agentName);
                      
                      return (
                         <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 max-w-[85%] ${isUser ? 'self-end flex-row-reverse' : isSystem ? 'self-center w-full max-w-full justify-center' : 'self-start'}`}
                         >
                            {isSystem ? (
                               <div className="text-xs font-mono text-rose-500 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">{msg.content}</div>
                            ) : (
                               <>
                                  <div className="mt-1 shrink-0">
                                     {isUser ? (
                                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-brand/20">U</div>
                                     ) : pData?.avatar_base64 ? (
                                        <img src={pData.avatar_base64} alt={agentName} className="w-10 h-10 rounded-full object-cover shadow-sm bg-neutral-100 border border-neutral-200 dark:border-neutral-800" />
                                     ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">{agentName.charAt(0)}</div>
                                     )}
                                  </div>
                                  <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                                     <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-1">{isUser ? 'You' : agentName}</span>
                                     <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${isUser ? 'bg-brand text-white rounded-tr-none' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 rounded-tl-none'}`}>
                                        {msg.content}
                                     </div>
                                  </div>
                               </>
                            )}
                         </motion.div>
                      )
                   })}
                   {isTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 self-start items-center text-neutral-400">
                         <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                         <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-4 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                         </div>
                      </motion.div>
                   )}
                   <div ref={messagesEndRef} />
                </>
             )}
          </div>
          
          {/* Chat Control Footer */}
          {roomPersonas.length > 0 && (
             <div className="p-6 bg-white/80 dark:bg-neutral-950/80 border-t border-neutral-200 dark:border-border backdrop-blur-md">
                 <div className="flex gap-2 mb-3">
                    <span className="text-xs font-semibold text-neutral-500 flex items-center">Target Persona:</span>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                       {roomPersonas.map(p => (
                          <button 
                             key={p.id}
                             onClick={() => setTargetPersona(p.id)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${targetPersona === p.id ? 'bg-brand/10 text-brand border-brand flex items-center gap-1 shadow-sm' : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:border-brand/30'}`}
                          >
                             {targetPersona === p.id && <MessageSquare size={12}/>}
                             {p.name}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <input 
                       type="text"
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                       placeholder={`Send a message directly to ${roomPersonas.find(p => p.id === targetPersona)?.name || '...'}`}
                       className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 focus:outline-none focus:border-brand/50 shadow-sm text-sm"
                       disabled={isTyping || !targetPersona}
                    />
                    <button 
                       onClick={handleSendMessage}
                       disabled={isTyping || !input.trim() || !targetPersona}
                       className="bg-brand hover:bg-brand-hover text-white px-6 rounded-xl font-bold shadow-lg shadow-brand/20 disabled:opacity-50 transition-colors"
                    >
                       Send
                    </button>
                 </div>
             </div>
          )}
       </div>
    </div>
  );
}
