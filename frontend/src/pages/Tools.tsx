import { useEffect, useState } from 'react';
import axios from 'axios';
import { Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

interface Tool {
  name: string;
  description: string;
}

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/tools').then(res => setTools(res.data.tools)).catch(console.error);
  }, []);

  return (
    <div className="flex-1 p-10 overflow-y-auto w-full">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-2 text-neutral-100">Skills & Tools</h2>
        <p className="text-neutral-400 mb-10">Available skills openzess can invoke natively.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((t, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={i} 
              className="bg-surface border border-border p-6 rounded-2xl shadow-lg hover:border-brand/50 transition-colors group"
            >
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mb-4 border border-border group-hover:bg-brand/10 group-hover:text-brand transition-colors text-neutral-400">
                <Wrench size={20} />
              </div>
              <h3 className="text-lg font-medium text-neutral-200 mb-2 font-mono text-sm">{t.name}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{t.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
