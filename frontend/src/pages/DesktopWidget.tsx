import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import VRMAvatar from '../components/VRMAvatar';

declare global {
  interface Window {
    electronAPI?: {
      onLoadVrm: (callback: (url: string) => void) => void;
      onAgentSpeak: (callback: (text: string) => void) => void;
      onGlobalMouseMove: (callback: (coords: {x: number, y: number, width: number, height: number}) => void) => void;
      closeCompanion: () => void;
    };
  }
}

export default function DesktopWidget() {
  const [vrmUrl, setVrmUrl] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [mouseNorm, setMouseNorm] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.classList.add('bg-transparent');
    
    // Web Audio API Setup
    if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        
        const audioEl = new Audio();
        audioEl.crossOrigin = "anonymous";
        audioRef.current = audioEl;
        
        sourceRef.current = ctx.createMediaElementSource(audioEl);
        sourceRef.current.connect(analyser);
        analyser.connect(ctx.destination);
    }

    if (window.electronAPI) {
      window.electronAPI.onLoadVrm((url) => {
        setVrmUrl(url);
      });

      // Global Mouse Polling from OS
      window.electronAPI.onGlobalMouseMove((coords) => {
          // Normalize mathematically across total screen domain (-1.0 to 1.0)
          const nX = (coords.x / coords.width) * 2 - 1;
          const nY = -(coords.y / coords.height) * 2 + 1;
          setMouseNorm({ x: nX, y: nY });
      });
      
      window.electronAPI.onAgentSpeak(async (text) => {
         // Determine Emotion before playing
         if (text.includes(':)') || text.toLowerCase().includes('happy') || text.includes('!') || text.toLowerCase().includes('excellent')) {
             setCurrentEmotion('happy');
         } else if (text.includes(':(') || text.toLowerCase().includes('sad') || text.toLowerCase().includes('error')) {
             setCurrentEmotion('sad');
         } else if (text.includes('>:(') || text.toLowerCase().includes('angry')) {
             setCurrentEmotion('angry');
         } else {
             setCurrentEmotion('neutral');
         }

         try {
             const res = await fetch('http://localhost:8000/api/tts', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ text })
             });
             
             if (res.ok) {
                 const blob = await res.blob();
                 const objectUrl = URL.createObjectURL(blob);
                 
                 if (audioRef.current && audioContextRef.current) {
                     if (audioContextRef.current.state === 'suspended') {
                         await audioContextRef.current.resume();
                     }
                     audioRef.current.src = objectUrl;
                     await audioRef.current.play();
                     
                     // Start analysing frequency loop
                     const updateVolume = () => {
                         if (!analyserRef.current || audioRef.current?.paused) {
                             setAudioVolume(0);
                             return;
                         }
                         
                         const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                         analyserRef.current.getByteFrequencyData(dataArray);
                         
                         let sum = 0;
                         for(let i = 0; i < dataArray.length; i++) {
                             sum += dataArray[i];
                         }
                         const average = sum / dataArray.length;
                         const normalized = average / 255.0; // 0.0 to 1.0 (Rough volume)
                         
                         setAudioVolume(normalized);
                         animationRef.current = requestAnimationFrame(updateVolume);
                     };
                     
                     updateVolume();
                     
                     audioRef.current.onended = () => {
                         setAudioVolume(0);
                         setCurrentEmotion('neutral');
                         URL.revokeObjectURL(objectUrl);
                         if (animationRef.current) cancelAnimationFrame(animationRef.current);
                     };
                 }
             }
         } catch (error) {
             console.error("Failed to fetch TTS", error);
         }
      });
    }

    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.classList.remove('bg-transparent');
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }} className="relative group drag-region">
       <div className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity no-drag flex gap-2">
          <button 
             onClick={() => window.electronAPI?.closeCompanion()}
             className="w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg transition-colors border border-white/20 backdrop-blur-sm text-xs font-bold"
          >
             ✕
          </button>
       </div>
       
       <div className="absolute top-4 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-mono tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur border border-white/10 no-drag pointer-events-none">
          openzess companion
       </div>

      {vrmUrl && (
        <div className="w-full h-full no-drag">
           <Canvas camera={{ position: [0, 1.4, 3], fov: 40 }} gl={{ alpha: true }}>
             <PerspectiveCamera makeDefault position={[0, 1.4, 2.5]} fov={35} />
             <ambientLight intensity={0.6} />
             <directionalLight position={[2, 2, 2]} intensity={1.2} />
             <directionalLight position={[-2, 1, -1]} intensity={0.5} color="#a1e0ff" />
             
             {/* Pass volume, emotion, and global OS mouse vector */}
             <VRMAvatar url={vrmUrl} audioVolume={audioVolume} currentEmotion={currentEmotion} mouseTarget={mouseNorm} />
             
             <OrbitControls 
               target={[0, 1.2, 0]}
               enablePan={false}
               enableZoom={true}
               enableDamping={true}
             />
           </Canvas>
        </div>
      )}
    </div>
  );
}
