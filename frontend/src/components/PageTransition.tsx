import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.1, // Ultra-fast 100ms micro-transition: no lag, no delay
        ease: 'easeOut'
      }}
      className={`w-full h-full flex overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
