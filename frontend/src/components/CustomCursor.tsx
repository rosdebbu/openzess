import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // We look for clickable things to trigger the "hover" state expansion
      if (
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      {/* Outer soft trailing aura */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 bg-brand/10 dark:bg-brand/20 border border-brand/20 dark:border-brand/30 rounded-full pointer-events-none z-[9999] backdrop-blur-[2px]"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
          opacity: mousePosition.x === -100 ? 0 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 25,
          mass: 0.8,
        }}
      />
      
      {/* Inner precise dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-brand dark:bg-brand-hover shadow-[0_0_10px_rgba(99,102,241,0.8)] rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isHovering ? 0 : 1,
          opacity: mousePosition.x === -100 ? 0 : 1
        }}
        transition={{
          type: 'tween',
          duration: 0.02,
          ease: 'linear'
        }}
      />
    </>
  );
}
