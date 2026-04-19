import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Save, Trash2, Edit3, Eye, Calendar, Tag, ChevronRight, Hash, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '../contexts/ToastContext';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const LinkPreview = ({ href, children }: any) => {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    if (href && href.startsWith('http')) {
      fetch(`http://localhost:8000/api/link-preview?url=${encodeURIComponent(href)}`)
        .then(res => res.json())
        .then(setData)
        .catch(() => {});
    }
  }, [href]);

  if (data && data.title && data.title !== href && children && children[0] === href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block my-6 no-underline">
        <div className="flex bg-white dark:bg-[#0a0a0c] border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-brand/40 dark:hover:border-brand/40 transition-colors shadow-lg max-w-2xl group">
          {data.image && (
            <div className="w-32 sm:w-48 shrink-0 bg-neutral-100 dark:bg-black/50 border-r border-neutral-200 dark:border-white/5 overflow-hidden">
              <img src={data.image} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}
          <div className="p-5 flex flex-col justify-center">
            <div className="text-xs text-brand font-bold mb-1 uppercase tracking-wider">{data.siteName || new URL(href).hostname}</div>
            <div className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-2 text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>{data.title}</div>
            <div className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">{data.description}</div>
          </div>
        </div>
      </a>
    );
  }

  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-hover underline">{children}</a>;
};

export default function KnowledgeBase() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      showToast("Uploading attachment...", "info");
      const res = await fetch('http://localhost:8000/api/notes/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      const markdownSnip = data.type === 'image' 
        ? `\n![${data.name}](${data.url})\n`
        : `\n[📥 Download ${data.name}](${data.url})\n`;
        
      setEditContent(prev => prev + markdownSnip);
      showToast("Attachment processed successfully", "success");
    } catch (err) {
      showToast("Failed to upload attachment", "error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!isEditing) return;
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFileUpload(e.clipboardData.files[0]);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/notes');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      showToast("Failed to sync matrix canvas.", "error");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNew = () => {
    setActiveNote(null);
    setEditTitle('');
    setEditContent('');
    setEditCategory('General');
    setIsEditing(true);
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      showToast("Canvas requires a title designation.", "error");
      return;
    }

    try {
      if (activeNote) {
        // Update existing
        await fetch(`http://localhost:8000/api/notes/${activeNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle, content: editContent, category: editCategory })
        });
        showToast("Canvas updated successfully.", "success");
      } else {
        // Create new
        const res = await fetch('http://localhost:8000/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle, content: editContent, category: editCategory })
        });
        const data = await res.json();
        setActiveNote({ id: data.note_id, title: editTitle, content: editContent, category: editCategory, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        showToast("New Canvas initialized.", "success");
      }
      setIsEditing(false);
      fetchNotes();
    } catch (err) {
      showToast("Sync failure.", "error");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Purge this canvas permanently?")) return;
    
    try {
      await fetch(`http://localhost:8000/api/notes/${id}`, { method: 'DELETE' });
      showToast("Canvas purged.", "success");
      if (activeNote && activeNote.id === id) {
        setActiveNote(null);
        setIsEditing(false);
      }
      fetchNotes();
    } catch (err) {
      showToast("Failed to purge.", "error");
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-neutral-50 dark:bg-neutral-950 overflow-hidden relative">
      {/* Sidebar List */}
      <div className="w-80 bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-xl border-r border-neutral-200 dark:border-white/5 flex flex-col shrink-0 shadow-xl">
        <div className="p-5 border-b border-neutral-200 dark:border-white/5 bg-white dark:bg-[#0a0a0c]/80 z-10 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold flex items-center gap-2 dark:text-white tracking-wide">
              <BookOpen size={18} className="text-brand" /> Personal Canvas
            </h1>
            <button 
              onClick={handleCreateNew}
              className="w-8 h-8 rounded-lg bg-brand hover:bg-brand-hover text-white flex items-center justify-center transition-all shadow-lg shadow-brand/20 hover:scale-105 active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Search manifests..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-neutral-100 px-4 py-2.5 rounded-xl font-medium text-sm focus:outline-none focus:border-brand/50 transition-colors shadow-inner placeholder:text-neutral-500"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          <AnimatePresence>
            {filteredNotes.map(note => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleSelectNote(note)}
                className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden
                  ${activeNote?.id === note.id 
                    ? 'bg-brand/10 border-brand/30 dark:border-brand/50 shadow-[0_0_15px_rgba(var(--brand-rgb),0.05)]' 
                    : 'bg-white/80 dark:bg-[#0a0a0c]/80 border-transparent hover:border-neutral-200 dark:hover:border-white/10 shadow-sm'}
                `}
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className={`font-bold transition-colors line-clamp-1 pr-6 ${activeNote?.id === note.id ? 'text-brand' : 'text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white'}`}>
                    {note.title}
                  </h3>
                  <button 
                    onClick={(e) => handleDelete(note.id, e)}
                    className="absolute right-0 top-0 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 relative z-10">
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md"><Tag size={10} /> {note.category}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredNotes.length === 0 && (
             <div className="text-center p-8 text-neutral-400 font-medium text-sm">
                 {searchTerm ? 'No manifests match the search schema.' : 'Knowledge base empty. Initialize a new canvas.'}
             </div>
          )}
        </div>
      </div>

      {/* Main Editor/Viewer Pane */}
      <div className="flex-1 flex flex-col bg-white/70 dark:bg-neutral-950 relative overflow-hidden backdrop-blur-3xl">
        {(!activeNote && !isEditing) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto custom-scrollbar">
            <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-brand/5 border border-brand/20">
              <BookOpen size={40} />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>No Canvas Selected</h2>
            <p className="text-neutral-500 max-w-md text-center mb-12">Select a manifest from the sidebar, initialize a new blank canvas, or start from one of the basic templates below.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                {[
                    { title: "Daily Journal", category: "Personal", content: "# Daily Journal\n\n**Date:** \n\n## Goals for Today\n- [ ] \n- [ ]\n\n## Brain Dump\n" },
                    { title: "Code Snippet", category: "Dev", content: "# Code Snippet\n\n**Language:** \n\n## Description\n\n\n## The Code\n```python\n\n```" },
                    { title: "Project Brainstorm", category: "Planning", content: "# Project Brainstorm\n\n## The Problem\n\n## Proposed Solution\n\n## Action Items\n1. \n2. \n3. " }
                ].map((tmpl, idx) => (
                    <div 
                       key={idx}
                       onClick={() => {
                          setActiveNote(null);
                          setEditTitle(tmpl.title);
                          setEditContent(tmpl.content);
                          setEditCategory(tmpl.category);
                          setIsEditing(true);
                       }}
                       className="bg-white dark:bg-[#0a0a0c] border border-neutral-200 dark:border-white/10 p-6 rounded-2xl cursor-pointer hover:border-brand/50 hover:shadow-lg transition-all group flex flex-col items-start text-left"
                    >
                       <div className="bg-brand/10 text-brand p-2 rounded-lg mb-4 group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                       <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">{tmpl.title}</h3>
                       <p className="text-xs text-neutral-500 font-mono"><Tag size={12} className="inline mr-1" />{tmpl.category}</p>
                    </div>
                ))}
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-neutral-200 dark:border-white/5 flex items-center justify-between px-6 bg-white shrink-0 dark:bg-[#0a0a0c]/80 backdrop-blur-md shadow-sm z-20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditing ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white' : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400'}`}
                >
                  {isEditing ? <Eye size={16} /> : <Edit3 size={16} />} {isEditing ? 'Read Mode' : 'Edit Mode'}
                </button>
                {activeNote && !isEditing && (
                    <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 ml-4 border-l border-neutral-200 dark:border-white/10 pl-6">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> Executed: {new Date(activeNote.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5 text-brand bg-brand/10 px-2 py-0.5 rounded-md"><Hash size={12} /> {activeNote.category}</span>
                    </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 border border-neutral-200 dark:border-white/10 shadow-sm"
                  >
                    <Paperclip size={16} /> Attach Media
                  </button>
                )}
                {isEditing && (
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Save size={16} /> Save Canvas
                  </button>
                )}
              </div>
            </div>

            {/* Workspace Area */}
            <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar bg-neutral-50/50 dark:bg-transparent">
              <div className="max-w-4xl mx-auto w-full">
                {isEditing ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                    <input 
                      type="text" 
                      placeholder="Manifest Title (e.g., Daily DevOps Commands)..." 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="text-4xl font-bold bg-transparent border-none focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-800 placeholder:font-light"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    />
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-neutral-400" />
                      <input 
                        type="text" 
                        placeholder="Tag (e.g., GitHub, Career, Snippets)" 
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 focus:border-brand px-3 py-1.5 rounded-lg text-sm font-mono focus:outline-none text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400 w-64 transition-colors"
                      />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileUpload(e.target.files[0])} 
                    />
                    <textarea 
                      placeholder="Initiate brain dump process...\n\nMarkdown supported (Use ``` for code blocks, ## for headers). Drag and drop files or images here, or use the Attach Media button..."
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                      onPaste={handlePaste}
                      className="w-full flex-1 min-h-[500px] bg-transparent border-none focus:outline-none text-neutral-800 dark:text-neutral-200 resize-none text-base leading-loose placeholder:text-neutral-300 dark:placeholder:text-neutral-800 font-mono mt-4 custom-scrollbar p-2 rounded-xl transition-colors ring-0 focus-visible:ring-0"
                    />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:font-outfit prose-a:text-brand prose-pre:bg-[#0a0a0c] prose-pre:border prose-pre:border-neutral-800 prose-pre:shadow-xl prose-pre:rounded-2xl prose-img:rounded-2xl border-none prose-img:shadow-lg prose-img:border prose-img:border-neutral-200 dark:prose-img:border-neutral-800 pb-32">
                    <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-5xl mb-8 pb-8 border-b border-neutral-200 dark:border-white/10">{activeNote?.title}</h1>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: LinkPreview
                      }}
                    >
                      {activeNote?.content || '*Empty canvas.*'}
                    </ReactMarkdown>
                  </motion.div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
