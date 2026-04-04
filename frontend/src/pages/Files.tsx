import { useEffect, useState } from 'react';
import axios from 'axios';
import { Folder, File as FileIcon, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileItem {
  name: string;
  is_dir: boolean;
}

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [directory, setDirectory] = useState<string>('');

  useEffect(() => {
    axios.get('http://localhost:8000/api/files').then(res => {
      setFiles(res.data.files);
      setDirectory(res.data.directory);
    }).catch(console.error);
  }, []);

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-2 text-neutral-100">Files</h2>
        <p className="text-neutral-400 mb-10 flex items-center gap-2 font-mono text-sm">
          <HardDrive size={16} /> {directory}
        </p>

        <div className="bg-surface border border-border rounded-2xl p-2 shadow-lg w-full">
          {files.map((f, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              key={i} 
              className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/50 rounded-xl transition-colors cursor-default border-b border-border/50 last:border-0"
            >
              {f.is_dir ? <Folder size={20} className="text-brand shrink-0" /> : <FileIcon size={20} className="text-neutral-500 shrink-0" />}
              <span className={f.is_dir ? 'text-neutral-200 font-medium' : 'text-neutral-400'}>{f.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
