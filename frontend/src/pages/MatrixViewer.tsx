import React, { useEffect, useRef, useState } from 'react';
import RFB from '@novnc/novnc';
import { Monitor, Wifi, WifiOff } from 'lucide-react';

export default function MatrixViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      setStatus('connecting');
      // Connect to the websockify proxy which hits X11VNC port 5900 natively inside WSL
      const rfb = new RFB(containerRef.current, 'ws://localhost:6080', {
        credentials: { password: '' }
      });

      rfbRef.current = rfb;
      
      rfb.addEventListener('connect', () => {
        setStatus('connected');
      });

      rfb.addEventListener('disconnect', (e: any) => {
        console.error("VNC disconnected", e);
        setStatus('disconnected');
      });

      // Allow the screen to resize to fit the layout flawlessly
      rfb.scaleViewport = true;
      rfb.resizeSession = true;

    } catch (err) {
      console.error(err);
      setStatus('disconnected');
    }

    return () => {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative">
      <div className="flex items-center justify-between px-6 py-4 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md border-b border-neutral-200 dark:border-border shrink-0 z-10">
        <h1 className="text-xl font-semibold flex items-center gap-3">
          <Monitor size={24} className="text-brand" /> Matrix Virtual Desktop
        </h1>
        <div className="flex items-center gap-2">
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
                             {status === 'connecting' ? 'Establishing VNC Handshake...' : 'Matrix Subsystem Offline'}
                         </h2>
                         
                         <p className="text-neutral-400 max-w-lg mb-8 leading-relaxed font-mono text-sm">
                             The Matrix Viewer is a real-time visual bridge that allows you to watch the AI autonomously control a sandboxed Linux GUI desktop (Xvfb) without escaping into your host Windows machine.
                         </p>
                         
                         {status !== 'connecting' && (
                             <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-mono text-xs text-neutral-300 text-left w-full max-w-md shadow-inner">
                                 <div className="text-amber-500 font-bold mb-2 flex items-center gap-2"><Monitor size={14} /> DIAGNOSTIC SHUTDOWN</div>
                                 <div className="flex gap-4">
                                     <span className="text-neutral-500">HOST:</span>
                                     <span className="text-emerald-400">Windows Native Detected</span>
                                 </div>
                                 <div className="flex gap-4 mt-1">
                                     <span className="text-neutral-500">DISPLAY:</span>
                                     <span className="text-red-400">Xvfb Disabled</span>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-white/10 text-brand font-bold">
                                     {"->"} To enable, reboot Openzess via WSL (start_wsl.sh).
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
             )}

             {/* The raw canvas injector */}
             <div ref={containerRef} className="w-full h-full" style={{ outline: 'none' }} />
        </div>
      </div>
    </div>
  );
}
