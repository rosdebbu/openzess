import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Terminal } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface AddMCPServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (serverData: { id: string; name: string; command: string; args: string[] }) => Promise<void>;
}

export default function AddMCPServerModal({ isOpen, onClose, onAdd }: AddMCPServerModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [command, setCommand] = useState('npx');
  const [argsStr, setArgsStr] = useState('-y @modelcontextprotocol/server-postgres postgresql://localhost/mydb');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !command) {
      showToast('Name and Command are required', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      // Simple arg splitting handling quotes roughly
      const argsArray = argsStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const cleanArgs = argsArray.map(a => a.replace(/^"|"$/g, ''));
      
      await onAdd({
        id,
        name,
        command,
        args: cleanArgs
      });
      
      showToast(`${name} server configuration added successfully!`, 'success');
      onClose();
      // reset forms
      setName('');
      setCommand('npx');
      setArgsStr('');
    } catch (error) {
      showToast('Failed to add custom server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-border rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-neutral-900 dark:text-white">
                <Server size={20} className="text-indigo-500" /> Add Custom Protocol
              </h2>
              <button 
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-800 dark:text-neutral-200">Server Alias (Name)</label>
                <input
                  type="text"
                  placeholder="e.g. My Local Database"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-surface border border-neutral-200 dark:border-border rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-800 dark:text-neutral-200">Command</label>
                <input
                  type="text"
                  placeholder="e.g. npx, python, docker"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-surface border border-neutral-200 dark:border-border rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-neutral-800 dark:text-neutral-200">Arguments (Space separated)</label>
                <div className="relative">
                  <Terminal size={16} className="absolute left-3 top-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="-y @modelcontextprotocol/server-postgres"
                    value={argsStr}
                    onChange={e => setArgsStr(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-surface border border-neutral-200 dark:border-border rounded-xl p-3 pl-10 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Connecting...' : 'Connect Server'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
