import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function FloatingChat() {
  return (
    <div className="fixed bottom-8 right-8 z-[90]">
      <motion.button 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-white text-black p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 cursor-pointer group shadow-[0_10px_40px_rgba(212,175,55,0.15)]"
      >
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[#D4AF37] relative overflow-hidden">
           <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-20 transition-opacity"></div>
           <Sparkles size={14} />
        </div>
        <div className="text-[11px] font-bold tracking-tight pr-2 uppercase">
          SHARIF, YOUR AI STYLIST IS READY
        </div>
      </motion.button>
    </div>
  );
}
