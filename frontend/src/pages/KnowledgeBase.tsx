import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Save, Trash2, Edit3, Eye, Calendar, Tag, ChevronRight, Hash } from 'lucide-react';
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

export default function KnowledgeBase() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

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
    <div className="flex h-full w-full bg-[#EDE8E2] dark:bg-[#1A1818] overflow-hidden relative">
      {/* Sidebar List */}
      <div className="w-80 bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-xl border-r border-[#E2DAD2] dark:border-[#3A3838]/60 flex flex-col shrink-0 shadow-xl">
        <div className="p-5 border-b border-[#E2DAD2] dark:border-[#3A3838]/60 bg-white dark:bg-[#0a0a0c]/80 z-10 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold flex items-center gap-2 dark:text-[#E2DAD2] tracking-wide">
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
            className="w-full bg-[#EDE8E2] dark:bg-[#1E1C1C]/40 border border-[#E2DAD2] dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2] px-4 py-2.5 rounded-xl font-medium text-sm focus:outline-none focus:border-brand/50 transition-colors shadow-inner placeholder:text-[#B8AFA8]"
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
                    : 'bg-white/80 dark:bg-[#0a0a0c]/80 border-transparent hover:border-[#E2DAD2] dark:hover:border-white/10 shadow-sm'}
                `}
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className={`font-bold transition-colors line-clamp-1 pr-6 ${activeNote?.id === note.id ? 'text-brand' : 'text-[#3A3838] dark:text-[#E2DAD2] group-hover:text-[#3A3838] dark:group-hover:text-white'}`}>
                    {note.title}
                  </h3>
                  <button 
                    onClick={(e) => handleDelete(note.id, e)}
                    className="absolute right-0 top-0 text-[#B8AFA8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-[#EDE8E2] dark:bg-[#2A2828] p-1.5 rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-[#B8AFA8] relative z-10">
                  <span className="flex items-center gap-1 text-brand dark:text-brand/80 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md"><Tag size={10} /> {note.category}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredNotes.length === 0 && (
             <div className="text-center p-8 text-[#B8AFA8] font-medium text-sm">
                 {searchTerm ? 'No manifests match the search schema.' : 'Knowledge base empty. Initialize a new canvas.'}
             </div>
          )}
        </div>
      </div>

      {/* Main Editor/Viewer Pane */}
      <div className="flex-1 flex flex-col bg-white/70 dark:bg-[#1A1818] relative overflow-hidden backdrop-blur-3xl">
        {(!activeNote && !isEditing) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto custom-scrollbar">
            <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-brand/5 border border-brand/20">
              <BookOpen size={40} />
            </div>
            <h2 className="text-3xl font-bold text-[#3A3838] dark:text-[#E2DAD2] mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>No Canvas Selected</h2>
            <p className="text-[#B8AFA8] max-w-md text-center mb-12">Select a manifest from the sidebar, initialize a new blank canvas, or start from one of the basic templates below.</p>
            
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
                       className="bg-white dark:bg-[#0a0a0c] border border-[#E2DAD2] dark:border-[#3A3838] p-6 rounded-2xl cursor-pointer hover:border-brand/50 hover:shadow-lg transition-all group flex flex-col items-start text-left"
                    >
                       <div className="bg-brand/10 text-brand p-2 rounded-lg mb-4 group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                       <h3 className="text-lg font-bold text-[#3A3838] dark:text-[#E2DAD2] mb-1">{tmpl.title}</h3>
                       <p className="text-xs text-[#B8AFA8] font-mono"><Tag size={12} className="inline mr-1" />{tmpl.category}</p>
                    </div>
                ))}
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-[#E2DAD2] dark:border-[#3A3838]/60 flex items-center justify-between px-6 bg-white shrink-0 dark:bg-[#0a0a0c]/80 backdrop-blur-md shadow-sm z-20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditing ? 'bg-[#EDE8E2] dark:bg-white/10 text-[#3A3838] dark:text-[#E2DAD2]' : 'hover:bg-[#EDE8E2] dark:hover:bg-white/5 text-[#3A3838]/80 dark:text-[#B8AFA8]'}`}
                >
                  {isEditing ? <Eye size={16} /> : <Edit3 size={16} />} {isEditing ? 'Read Mode' : 'Edit Mode'}
                </button>
                {activeNote && !isEditing && (
                    <div className="flex items-center gap-4 text-xs font-mono text-[#B8AFA8] ml-4 border-l border-[#E2DAD2] dark:border-[#3A3838] pl-6">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> Executed: {new Date(activeNote.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5 text-brand bg-brand/10 px-2 py-0.5 rounded-md"><Hash size={12} /> {activeNote.category}</span>
                    </div>
                )}
              </div>
              <div className="flex items-center gap-2">
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
            <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar bg-[#EDE8E2]/50 dark:bg-transparent">
              <div className="max-w-4xl mx-auto w-full">
                {isEditing ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                    <input 
                      type="text" 
                      placeholder="Manifest Title (e.g., Daily DevOps Commands)..." 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="text-4xl font-bold bg-transparent border-none focus:outline-none text-[#3A3838] dark:text-[#E2DAD2] placeholder:text-[#B8AFA8]/60 dark:placeholder:text-[#3A3838] placeholder:font-light"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    />
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-[#B8AFA8]" />
                      <input 
                        type="text" 
                        placeholder="Tag (e.g., GitHub, Career, Snippets)" 
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="bg-[#EDE8E2] dark:bg-white/5 border border-[#E2DAD2] dark:border-[#3A3838] focus:border-brand px-3 py-1.5 rounded-lg text-sm font-mono focus:outline-none text-[#3A3838] dark:text-[#E2DAD2]/80 placeholder:text-[#B8AFA8] w-64 transition-colors"
                      />
                    </div>
                    <textarea 
                      placeholder="Initiate brain dump process...\n\nMarkdown supported (Use ``` for code blocks, ## for headers)..."
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full flex-1 min-h-[500px] bg-transparent border-none focus:outline-none text-[#3A3838] dark:text-[#E2DAD2] resize-none text-base leading-loose placeholder:text-[#B8AFA8]/60 dark:placeholder:text-[#3A3838] font-mono mt-4"
                    />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-brand prose-pre:bg-[#1E1C1C] prose-pre:border prose-pre:border-[#3A3838] prose-pre:shadow-xl prose-pre:rounded-2xl pb-32">
                    <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-5xl mb-8 pb-8 border-b border-[#E2DAD2] dark:border-[#3A3838]">{activeNote?.title}</h1>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
