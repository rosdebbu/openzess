import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.99 }}
      transition={{ 
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for buttery smooth entry
      }}
      className={`w-full h-full flex overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
