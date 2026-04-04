import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Sidebar from './components/Sidebar';
import Chat from './pages/Chat';
import Files from './pages/Files';
import Tools from './pages/Tools';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openzess_api_key') || '');
  const [showSettings, setShowSettings] = useState(!apiKey);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('openzess_api_key', apiKey);
    setShowSettings(false);
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-neutral-900 border border-border p-8 rounded-2xl w-full max-w-md shadow-2xl"
              >
                <h2 className="text-xl font-medium mb-2 flex items-center gap-2">
                  <Key size={20} className="text-brand" /> Configure Gemini API Key
                </h2>
                <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
                  To power the agent natively on your device, please supply a Gemini API Key. It defaults to the lightning-fast <code>gemini-2.5-flash</code>.
                </p>
                <input 
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-surface border border-border text-neutral-200 p-3 rounded-xl mb-6 focus:outline-none focus:border-brand font-mono"
                />
                <button 
                  className="w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-medium transition-colors shadow-lg shadow-brand/20"
                  onClick={saveApiKey}
                >
                  Save & Continue
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Sidebar />

        <div className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/files" element={<Files />} />
            <Route path="/tools" element={<Tools />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
