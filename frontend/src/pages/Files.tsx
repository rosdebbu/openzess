import { useEffect, useState } from 'react';
import axios from 'axios';
import { Folder, File as FileIcon, HardDrive, Search, ArrowUpRight, ChevronRight, FileCode2, FileImage, FileText, FileArchive, FileCog, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileItem {
  name: string;
  is_dir: boolean;
}

const getFileIcon = (name: string, isDir: boolean) => {
  if (isDir) return <Folder size={18} className="text-brand" />;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'cpp', 'c', 'sh'].includes(ext)) return <FileCode2 size={18} className="text-emerald-400" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) return <FileImage size={18} className="text-pink-400" />;
  if (['md', 'txt', 'json', 'yaml', 'yml', 'toml', 'csv'].includes(ext)) return <FileText size={18} className="text-amber-400" />;
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return <FileArchive size={18} className="text-orange-400" />;
  if (['env', 'lock', 'config', 'cfg'].includes(ext)) return <FileCog size={18} className="text-violet-400" />;
  if (['sql', 'db', 'sqlite'].includes(ext)) return <Database size={18} className="text-cyan-400" />;
  return <FileIcon size={18} className="text-[#B8AFA8]" />;
};

const getFileTagColor = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx'].includes(ext)) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (['js', 'jsx'].includes(ext)) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  if (['py'].includes(ext)) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (['md'].includes(ext)) return 'bg-[#EDE8E2]0/10 text-[#B8AFA8] border-[#B8AFA8]/20';
  if (['json'].includes(ext)) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (['css', 'scss'].includes(ext)) return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
  return '';
};

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [directory, setDirectory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:8000/api/files').then(res => {
      setFiles(res.data.files);
      setDirectory(res.data.directory);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const directories = filteredFiles.filter(f => f.is_dir).sort((a, b) => a.name.localeCompare(b.name));
  const regularFiles = filteredFiles.filter(f => !f.is_dir).sort((a, b) => a.name.localeCompare(b.name));
  const sortedFiles = [...directories, ...regularFiles];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-10 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-[#3A3838] dark:text-[#E2DAD2] mb-2 tracking-tight">
              <HardDrive className="text-brand" /> Project Files
            </h1>
            <p className="text-[#3A3838]/80 dark:text-[#B8AFA8] flex items-center gap-2 font-mono text-sm">
              <span className="bg-[#EDE8E2] dark:bg-white/5 border border-[#E2DAD2] dark:border-[#3A3838] px-3 py-1 rounded-lg">
                {directory || 'Loading...'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 bg-brand/10 text-brand px-3 py-1.5 rounded-lg border border-brand/20 font-medium">
                <Folder size={14} /> {directories.length}
              </span>
              <span className="flex items-center gap-1.5 bg-[#EDE8E2] dark:bg-white/5 text-[#3A3838]/80 dark:text-[#B8AFA8] px-3 py-1.5 rounded-lg border border-[#E2DAD2] dark:border-[#3A3838] font-medium">
                <FileIcon size={14} /> {regularFiles.length}
              </span>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8AFA8] dark:text-[#B8AFA8]" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-[#1E1C1C] border border-[#E2DAD2] dark:border-[#3A3838] text-[#3A3838] dark:text-[#E2DAD2] pl-11 pr-4 py-2.5 rounded-xl w-64 focus:outline-none focus:border-brand/40 shadow-sm dark:shadow-none transition-colors text-sm font-medium"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 rounded-full border-t-2 border-brand animate-spin"></div>
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-[#1E1C1C]/40 rounded-3xl border border-[#E2DAD2] dark:border-[#3A3838]/60 border-dashed mt-10 shadow-sm dark:shadow-none transition-colors">
              <HardDrive size={48} className="text-[#B8AFA8] dark:text-[#3A3838]/80 mb-4" />
              <h2 className="text-xl font-medium text-[#3A3838] dark:text-[#E2DAD2]/80 mb-2">{searchTerm ? 'No matching files' : 'Directory is empty'}</h2>
              <p className="text-[#B8AFA8] text-center max-w-md">{searchTerm ? 'Try adjusting your search query.' : 'This directory doesn\'t contain any visible files or folders.'}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E1C1C]/50 border border-[#E2DAD2] dark:border-[#3A3838] rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              <AnimatePresence>
                {sortedFiles.map((f, i) => {
                  const ext = f.name.split('.').pop()?.toLowerCase() || '';
                  const tagColor = getFileTagColor(f.name);

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                      key={f.name}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#EDE8E2] dark:hover:bg-white/5 transition-colors cursor-default border-b border-[#E2DAD2] dark:border-[#3A3838]/50 last:border-0 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#EDE8E2] dark:bg-white/5 border border-[#E2DAD2] dark:border-[#3A3838] flex items-center justify-center shrink-0 group-hover:border-brand/30 transition-colors">
                        {getFileIcon(f.name, f.is_dir)}
                      </div>
                      <span className={`flex-1 truncate font-medium text-sm ${f.is_dir ? 'text-[#3A3838] dark:text-[#E2DAD2]' : 'text-[#3A3838]/80 dark:text-[#E2DAD2]/80'}`}>
                        {f.name}
                      </span>
                      {!f.is_dir && tagColor && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tagColor}`}>
                          {ext}
                        </span>
                      )}
                      {f.is_dir && (
                        <ChevronRight size={16} className="text-[#B8AFA8]/60 dark:text-[#3A3838]/80 group-hover:text-brand transition-colors" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
