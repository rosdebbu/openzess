import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { Upload, X } from 'lucide-react';
import VRMAvatar from '../components/VRMAvatar';

export default function Companion() {
  const [vrmUrl, setVrmUrl] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a blob URL for the local file
      const url = URL.createObjectURL(file);
      setVrmUrl(url);
    }
  };

  const handleClear = () => {
     if (vrmUrl) {
        URL.revokeObjectURL(vrmUrl);
        setVrmUrl(null);
     }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden relative border-l border-neutral-200 dark:border-border">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white drop-shadow-md">Desktop Companion</h1>
          <p className="text-neutral-500 dark:text-neutral-400 drop-shadow-sm text-sm mt-1">Upload a .vrm model (Phase 1 Preview)</p>
        </div>
        <div className="pointer-events-auto">
           {!vrmUrl ? (
              <label className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-brand/20 transition-all font-medium active:scale-95">
                <Upload size={18} />
                <span>Load .vrm Model</span>
                <input type="file" accept=".vrm" className="hidden" onChange={handleFileUpload} />
              </label>
           ) : (
              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => window.electronAPI?.spawnCompanion(vrmUrl)} 
                   className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-lg shadow-indigo-500/20 font-medium active:scale-95"
                 >
                    🚀 Spawn on Desktop
                 </button>

                 <button onClick={handleClear} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl border border-red-500/20 cursor-pointer transition-colors backdrop-blur-md font-medium active:scale-95">
                   <X size={18} />
                   <span>Unload Model</span>
                 </button>
              </div>
           )}
        </div>
      </div>

      {vrmUrl && (
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-white/80 dark:bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-full border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-white/70 text-xs shadow-sm font-medium tracking-wide">
            Left Click: Rotate • Right Click: Pan • Scroll: Zoom
         </div>
      )}

      {/* 3D Canvas wrapper */}
      <div className="flex-1 w-full h-full relative">
        {vrmUrl ? (
           <Canvas shadows camera={{ position: [0, 1.4, 3], fov: 40 }}>
             <PerspectiveCamera makeDefault position={[0, 1.4, 2.5]} fov={35} />
             
             {/* Studio Lighting Setup */}
             <ambientLight intensity={0.6} />
             <directionalLight 
                position={[2, 2, 2]} 
                intensity={1.2} 
                castShadow 
                shadow-mapSize={[1024, 1024]}
             />
             <directionalLight position={[-2, 1, -1]} intensity={0.5} color="#a1e0ff" />
             <directionalLight position={[0, 2, -2]} intensity={0.3} color="#ffe0a1" />
             
             <VRMAvatar url={vrmUrl} />
             
             {/* Dynamic soft shadow on the floor */}
             <ContactShadows opacity={0.6} scale={10} blur={2.5} far={4} resolution={512} color="#000000" position={[0, 0, 0]} />
             
             {/* Camera Controls */}
             <OrbitControls 
               target={[0, 1.2, 0]}
               enablePan={true}
               enableZoom={true}
               enableDamping={true}
               dampingFactor={0.05}
               minDistance={0.5}
               maxDistance={4}
               maxPolarAngle={Math.PI / 2 + 0.1} // Prevent going below floor
             />
           </Canvas>
        ) : (
           <div className="absolute inset-8 flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-[2rem] bg-neutral-50/50 dark:bg-neutral-900/30">
              <div className="flex flex-col items-center text-neutral-400 space-y-4">
                 <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Upload size={32} className="text-neutral-400 dark:text-neutral-500" />
                 </div>
                 <div className="text-center">
                    <p className="font-medium text-neutral-600 dark:text-neutral-300">No companion loaded</p>
                    <p className="text-sm mt-1">Upload a .vrm file to preview your avatar in 3D</p>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
