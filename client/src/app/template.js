'use client';

import React from 'react';
import { motion } from 'motion/react';

/**
 * Next.js App Router Template
 * Re-mounts on every route change with Framer Motion for buttery-smooth page entry
 */
export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.18,
        ease: [0.25, 1, 0.5, 1]
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
