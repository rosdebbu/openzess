import React from 'react';
import { motion } from 'framer-motion';

interface LizardLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showText?: boolean;
}

export const LIZARD_ASCII = `      /\\_/\\
    >( o.o )<
     /  \\~/  \\
    / /|   |\\ \\
   ( ( | ~ | ) )
    \\ \\|   |/ /
     \\ \\_-_/ /
      \`--\\ \\-
          \\ \\_
           \`--)`;

export default function LizardLogo({ size = 'md', className = '', showText = false }: LizardLogoProps) {
  const sizeMap = {
    sm: { container: 'w-8 h-8', text: 'text-[9px] leading-[10px]', glyphSize: 24, font: 'text-xs' },
    md: { container: 'w-12 h-12', text: 'text-[11px] leading-[12px]', glyphSize: 36, font: 'text-base' },
    lg: { container: 'w-20 h-20', text: 'text-[13px] leading-[14px]', glyphSize: 64, font: 'text-xl' },
    xl: { container: 'w-28 h-28', text: 'text-[15px] leading-[16px]', glyphSize: 88, font: 'text-2xl' },
    hero: { container: 'w-44 h-44', text: 'text-[18px] leading-[20px]', glyphSize: 130, font: 'text-4xl' }
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative group">
        {/* Ambient Neon Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600 via-green-500 to-lime-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-75 transition duration-700 animate-pulse" />
        
        {/* Outer Shield Box */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative ${current.container} bg-[#0A0D0A] border border-emerald-500/40 rounded-2xl flex items-center justify-center p-2 shadow-[0_0_25px_rgba(22,163,74,0.35)] overflow-hidden`}
        >
          {/* Subtle Matrix scanline background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(22,163,74,0.08)_51%)] bg-[length:100%_4px] pointer-events-none" />

          {/* Render Vector ASCII Lizard */}
          <pre 
            className={`font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] ${current.text} text-center whitespace-pre z-10`}
            style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace" }}
          >
            {LIZARD_ASCII}
          </pre>

          {/* Pulsing Eye Accents */}
          <motion.div 
            animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute top-1/4 w-1.5 h-1.5 rounded-full bg-lime-300 blur-[1px] pointer-events-none"
          />
        </motion.div>
      </div>

      {showText && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center"
        >
          <span className={`font-bold tracking-tight text-white ${current.font}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            open<span className="text-emerald-400">zess</span>
          </span>
          <div className="text-[10px] text-emerald-500/80 font-mono tracking-widest uppercase">Lizard Core v2.5</div>
        </motion.div>
      )}
    </div>
  );
}
