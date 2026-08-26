import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Wifi, WifiOff, Terminal, Sparkles, Play, Trash2, Send, Cpu, Layers } from 'lucide-react';

interface TerminalLog {
  id: string;
  command?: string;
  output: string;
  timestamp: string;
  isError?: boolean;
}

export default function MatrixViewer() {
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'split' | 'matrix' | 'terminal'>('split');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [fpsMode, setFpsMode] = useState<30 | 60>(30);
  const [qualityMode, setQualityMode] = useState<'eco' | 'balanced' | 'ultra'>('balanced');

  // Terminal state
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'welcome',
      output: '⚡ Hermes Agent Autonomous Matrix Terminal ready.\nType any bash / shell command below or click a quick action to execute in the sandbox environment.',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [imgSrc]);

  useEffect(() => {
    if (!isSystemActive) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');
    const wsUrl = `ws://${window.location.hostname}:8000/api/matrix/stream`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'blob';
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      // Send initial configuration
      const quality = qualityMode === 'eco' ? 50 : qualityMode === 'balanced' ? 70 : 90;
      ws.send(JSON.stringify({ action: 'config', fps: fpsMode, quality }));
    };

    ws.onmessage = (event) => {
      const url = URL.createObjectURL(event.data);
      setImgSrc(prevSrc => {
        if (prevSrc) URL.revokeObjectURL(prevSrc);
        return url;
      });
    };

    ws.onclose = () => {
      setStatus('disconnected');
      setIsSystemActive(false);
    };

    ws.onerror = () => {
      setStatus('disconnected');
      setIsSystemActive(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [isSystemActive, fpsMode, qualityMode]);

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    if (xPct >= 0 && xPct <= 1 && yPct >= 0 && yPct <= 1) {
      wsRef.current.send(JSON.stringify({
        action: 'click',
        x: xPct,
        y: yPct
      }));
    }
  };

  const handleExecuteCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun !== undefined ? cmdToRun : commandInput).trim();
    if (!cmd || isExecuting) return;

    setIsExecuting(true);
    const newLogId = String(Date.now());
    
    // Add command entry immediately
    setTerminalLogs(prev => [
      ...prev,
      {
        id: newLogId,
        command: cmd,
        output: 'Executing...',
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
    setCommandInput('');

    try {
      const resp = await fetch('http://localhost:8000/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await resp.json();

      setTerminalLogs(prev =>
        prev.map(item =>
          item.id === newLogId
            ? { ...item, output: data.output || '(No output returned)' }
            : item
        )
      );
    } catch (err: any) {
      setTerminalLogs(prev =>
        prev.map(item =>
          item.id === newLogId
            ? { ...item, output: `Execution failed: ${err.message}`, isError: true }
            : item
        )
      );
    } finally {
      setIsExecuting(false);
      setTimeout(() => terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const clearTerminal = () => {
    setTerminalLogs([]);
  };

  const quickActions = [
    { label: 'git status', cmd: 'git status --short' },
    { label: 'list files', cmd: 'ls -la' },
    { label: 'sidecar health', cmd: 'curl -s http://127.0.0.1:8100/health || echo "Sidecar Offline"' },
    { label: 'rust check', cmd: 'cd rust-sidecar && cargo check' },
    { label: 'python tests', cmd: 'pytest backend/tests/test_hybrid_rust_sidecar.py -v' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#EDE8E2] dark:bg-[#1E1C1C] overflow-hidden relative">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white/60 dark:bg-[#1A1818]/60 backdrop-blur-md border-b border-[#E2DAD2] dark:border-border shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold flex items-center gap-2.5">
            <Monitor size={22} className="text-brand" /> 
            <span>Hermes Matrix & Terminal</span>
          </h1>

          {/* View Tabs */}
          <div className="flex items-center bg-[#E2DAD2]/50 dark:bg-surface p-0.5 rounded-lg border border-[#E2DAD2] dark:border-[#3A3838]">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'split' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Layers size={13} /> Split Console
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'matrix' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Monitor size={13} /> Matrix Only
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'terminal' ? 'bg-brand text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Terminal size={13} /> Terminal Only
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* FPS & Quality Toggle */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setFpsMode(fpsMode === 30 ? 60 : 30)}
              className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-colors ${
                fpsMode === 60 ? 'bg-brand/10 text-brand border-brand/40' : 'bg-surface border-border text-neutral-400'
              }`}
              title="Toggle target frame rate"
            >
              <Cpu size={12} className="inline mr-1" /> {fpsMode} FPS
            </button>
            <select
              value={qualityMode}
              onChange={(e) => setQualityMode(e.target.value as any)}
              className="bg-surface border border-border text-xs rounded-md px-2 py-1 focus:outline-none focus:border-brand font-mono"
            >
              <option value="eco">Eco Quality</option>
              <option value="balanced">Balanced</option>
              <option value="ultra">Ultra 60FPS</option>
            </select>
          </div>

          <div className="w-px h-5 bg-[#E2DAD2] dark:bg-border" />

          {/* Stream Power Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Stream</span>
            <button
              onClick={() => setIsSystemActive(!isSystemActive)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isSystemActive ? 'bg-brand' : 'bg-[#E2DAD2] dark:bg-[#3A3838]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isSystemActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {status === 'connected' ? (
            <div className="text-emerald-500 flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Wifi size={14} /> Live
            </div>
          ) : status === 'connecting' ? (
            <div className="text-amber-500 flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full animate-pulse">
              <Wifi size={14} /> Connecting...
            </div>
          ) : (
            <div className="text-neutral-400 flex items-center gap-1.5 text-xs font-semibold bg-neutral-500/10 px-2.5 py-1 rounded-full">
              <WifiOff size={14} /> Standby
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area (Split / Single) */}
      <div className="flex-1 p-4 grid gap-4 overflow-hidden" style={{
        gridTemplateColumns: activeTab === 'split' ? '1fr 1fr' : '1fr'
      }}>
        
        {/* PANEL 1: Virtual Desktop Matrix */}
        {(activeTab === 'split' || activeTab === 'matrix') && (
          <div className="flex flex-col h-full bg-black border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl overflow-hidden shadow-xl relative">
            <div className="px-4 py-2 bg-[#1A1818] border-b border-white/10 flex items-center justify-between text-xs font-mono text-neutral-400 shrink-0">
              <div className="flex items-center gap-2">
                <Monitor size={14} className="text-brand" />
                <span className="text-white font-medium">Virtual Display (Xvfb / Windows)</span>
              </div>
              <span className="text-brand text-[11px]">Click anywhere on canvas to control</span>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {status !== 'connected' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#1E1C1C]/90 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full border border-brand/30 border-dashed animate-[spin_10s_linear_infinite] flex items-center justify-center mb-4">
                    <Monitor className="text-brand" size={24} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Matrix Stream Standby</h3>
                  <p className="text-neutral-400 text-xs max-w-sm mb-4 leading-relaxed font-mono">
                    Toggle the Stream switch in the top right to start the high-speed 60FPS video bridge.
                  </p>
                  <button
                    onClick={() => setIsSystemActive(true)}
                    className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-medium rounded-lg transition-all shadow-md flex items-center gap-2"
                  >
                    <Play size={14} /> Launch Stream Bridge
                  </button>
                </div>
              )}

              {status === 'connected' && imgSrc && (
                <img
                  ref={imgRef}
                  src={imgSrc}
                  className="w-full h-full object-contain cursor-crosshair active:scale-[99.5%] transition-transform"
                  onPointerDown={handlePointerDown}
                  alt="Matrix Live Desktop Feed"
                  draggable={false}
                />
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: Live Hermes Terminal Console */}
        {(activeTab === 'split' || activeTab === 'terminal') && (
          <div className="flex flex-col h-full bg-[#121111] border border-[#E2DAD2] dark:border-[#3A3838] rounded-xl overflow-hidden shadow-xl font-mono text-xs">
            {/* Terminal Header */}
            <div className="px-4 py-2 bg-[#1A1818] border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-neutral-300 font-medium">
                <Terminal size={14} className="text-emerald-400" />
                <span>Hermes Live Shell</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearTerminal}
                  className="px-2 py-0.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded text-[11px] transition-colors flex items-center gap-1"
                  title="Clear Terminal Output"
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="px-3 py-2 bg-[#161414] border-b border-white/5 flex flex-wrap gap-1.5 shrink-0">
              <span className="text-[10px] text-neutral-500 py-0.5 flex items-center gap-1"><Sparkles size={10} /> Quick:</span>
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleExecuteCommand(qa.cmd)}
                  disabled={isExecuting}
                  className="px-2 py-0.5 bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-neutral-300 hover:text-brand rounded text-[11px] transition-all disabled:opacity-50"
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Terminal Output Log Feed */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar text-neutral-300 leading-relaxed font-mono">
              {terminalLogs.map((log) => (
                <div key={log.id} className="space-y-1">
                  {log.command && (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                      <span>openzess@sandbox:~$</span>
                      <span className="text-white">{log.command}</span>
                      <span className="text-neutral-600 text-[10px] ml-auto">{log.timestamp}</span>
                    </div>
                  )}
                  <pre className={`whitespace-pre-wrap rounded bg-black/40 p-2 border border-white/5 text-[11px] ${log.isError ? 'text-red-400' : 'text-neutral-300'}`}>
                    {log.output}
                  </pre>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Command Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteCommand();
              }}
              className="p-2.5 bg-[#1A1818] border-t border-white/10 flex items-center gap-2 shrink-0"
            >
              <span className="text-emerald-400 font-bold pl-1">❯</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Enter shell command (e.g. ls -la, python --version, cargo check)..."
                disabled={isExecuting}
                className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-neutral-600 text-xs font-mono"
              />
              <button
                type="submit"
                disabled={!commandInput.trim() || isExecuting}
                className="px-3 py-1.5 bg-brand hover:bg-brand-hover disabled:opacity-40 text-white rounded font-medium text-xs transition-all flex items-center gap-1.5 shadow"
              >
                <Send size={12} /> {isExecuting ? 'Running...' : 'Run'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
