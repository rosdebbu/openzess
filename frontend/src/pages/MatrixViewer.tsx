import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import { Monitor, Wifi, WifiOff } from 'lucide-react';

export default function MatrixViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  
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
    ws.binaryType = 'blob'; // Receive fast binary data
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      // Create an ultra-fast temporary URL for the JPEG stream
      const url = URL.createObjectURL(event.data);
      setImgSrc(prevSrc => {
        if (prevSrc) URL.revokeObjectURL(prevSrc); // Clean old frame
        return url;
      });
    };

    ws.onclose = () => {
      setStatus('disconnected');
      setIsSystemActive(false);
    };

    ws.onerror = (error) => {
      console.error("Matrix WS Error: ", error);
      setStatus('disconnected');
      setIsSystemActive(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [isSystemActive]);

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!imgRef.current) return;
    
    // Calculate precise relative percentages for responsive scaling
    const rect = imgRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    
    // Bounds check to ensure we only click inside the screen
    if (xPct >= 0 && xPct <= 1 && yPct >= 0 && yPct <= 1) {
      wsRef.current.send(JSON.stringify({
        action: 'click',
        x: xPct,
        y: yPct
      }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative">
      <div className="flex items-center justify-between px-6 py-4 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md border-b border-neutral-200 dark:border-border shrink-0 z-10">
        <h1 className="text-xl font-semibold flex items-center gap-3">
          <Monitor size={24} className="text-brand" /> Matrix Virtual Desktop
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 ml-2">Stream Power</span>
            <button 
              onClick={() => setIsSystemActive(!isSystemActive)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${isSystemActive ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isSystemActive ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="w-px h-6 bg-neutral-200 dark:bg-border" />
          {status === 'connected' ? (
            <div className="text-emerald-500 flex items-center gap-2 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full"><Wifi size={16} /> Live Access</div>
          ) : status === 'connecting' ? (
             <div className="text-amber-500 flex items-center gap-2 text-sm font-medium bg-amber-500/10 px-3 py-1 rounded-full animate-pulse"><Wifi size={16} /> Interfacing...</div>
          ) : (
            <div className="text-red-500 flex items-center gap-2 text-sm font-medium bg-red-500/10 px-3 py-1 rounded-full"><WifiOff size={16} /> Offline</div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background purely aesthetic matrix glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none"></div>
        
        <div className="w-full h-full max-w-6xl max-h-[800px] border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl premium-shadow bg-black relative flex items-center justify-center group">
             
             {status !== 'connected' && (
                 <div className="absolute inset-0 z-20 flex flex-col bg-neutral-950/90 backdrop-blur-md overflow-hidden">
                     {/* Radar/Grid Aesthetic */}
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                     
                     <div className="flex flex-col items-center justify-center flex-1 p-8 text-center relative z-10">
                         <div className="w-24 h-24 rounded-full border-2 border-brand/30 border-dashed animate-[spin_10s_linear_infinite] flex items-center justify-center shadow-[0_0_50px_rgba(var(--brand-rgb),0.2)] mb-8">
                             <div className="w-16 h-16 rounded-full bg-brand/10 backdrop-blur-sm flex items-center justify-center">
                                 {status === 'connecting' ? <Wifi className="text-brand animate-ping" size={28} /> : <WifiOff className="text-neutral-500" size={28} />}
                             </div>
                         </div>
                         
                         <h2 className="text-2xl font-bold tracking-widest text-white uppercase mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                             {!isSystemActive ? 'Matrix Subsystem Offline' : status === 'connecting' ? 'Establishing VNC Handshake...' : 'Connection Failed'}
                         </h2>
                         
                         <p className="text-neutral-400 max-w-lg mb-8 leading-relaxed font-mono text-sm">
                             The Matrix Viewer is a real-time visual bridge that allows you to watch the AI autonomously control a sandboxed Linux GUI desktop (Xvfb) without escaping into your host Windows machine.
                         </p>
                         
                         {!isSystemActive && (
                             <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-mono text-xs text-neutral-300 text-left w-full max-w-md shadow-inner">
                                 <div className="text-brand font-bold mb-2 flex items-center gap-2"><Monitor size={14} /> SYSTEM STANDBY</div>
                                 <div className="text-neutral-400 leading-relaxed">
                                     The Matrix bridge is currently powered down to save resources. Toggle the Power switch in the header to activate the WebSocket streaming proxy and establish a live connection to the sandbox display.
                                 </div>
                             </div>
                         )}
                         {isSystemActive && status === 'disconnected' && (
                             <div className="bg-white/5 border border-red-500/30 rounded-lg p-4 font-mono text-xs text-neutral-300 text-left w-full max-w-md shadow-inner">
                                 <div className="text-amber-500 font-bold mb-2 flex items-center gap-2"><Monitor size={14} /> CONNECTION FAILED</div>
                                 <div className="flex gap-4">
                                     <span className="text-neutral-500">HOST:</span>
                                     <span className="text-emerald-400">Environment Ready</span>
                                 </div>
                                 <div className="flex gap-4 mt-1">
                                     <span className="text-neutral-500">SERVICE:</span>
                                     <span className="text-red-400">Websockify / Xvfb Not Responding</span>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-white/10 text-brand font-bold">
                                     {"->"} Ensure the Python Ecosystem is actively running in your sandbox!
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
             )}

             {/* The native custom JPEG WebSocket projector */}
             {status === 'connected' && imgSrc && (
                 <img
                   ref={imgRef}
                   src={imgSrc}
                   className="w-full h-full object-contain cursor-crosshair active:scale-[99%] transition-transform duration-75"
                   onPointerDown={handlePointerDown}
                   alt="Matrix Stream"
                   draggable={false}
                 />
             )}
        </div>
      </div>
    </div>
  );
}
