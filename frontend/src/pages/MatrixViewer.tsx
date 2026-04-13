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
        
        <div className="w-full h-full max-w-6xl max-h-[800px] border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl premium-shadow bg-black relative flex items-center justify-center">
             
             {status !== 'connected' && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 font-mono text-sm z-20 bg-black/80">
                     {status === 'connecting' ? 'Establishing VNC handshake on ws://localhost:6080...' : 'Matrix subsystem offline. Ensure start_wsl.sh is running.'}
                 </div>
             )}

             {/* The raw canvas injector */}
             <div ref={containerRef} className="w-full h-full" style={{ outline: 'none' }} />
        </div>
      </div>
    </div>
  );
}
