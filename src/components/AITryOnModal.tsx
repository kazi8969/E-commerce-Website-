import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Camera, X, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface AITryOnModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AITryOnModal({ product, isOpen, onClose }: AITryOnModalProps) {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [userImageURL, setUserImageURL] = useState<string | null>(null);

  // Reset status on close
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStatus('idle');
        setUserImageURL(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setUserImageURL(objectUrl);
      
      setStatus('analyzing');
      setTimeout(() => {
        setStatus('complete');
      }, 4000); // 4 seconds loading
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[110] w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Image Preview Area */}
            <div className="flex-1 bg-[#111] flex flex-col relative border-r border-white/5 overflow-hidden">
               <div className="absolute top-4 right-4 md:hidden z-30">
                 <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur border border-white/10 rounded-full text-white">
                    <X size={20} />
                 </button>
               </div>
               
               {/* Base backdrop image */}
               <img src={userImageURL || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=600"} alt="Base Model Placeholder" className={`w-full h-[40vh] md:h-full object-cover transition-opacity duration-1000 ${status === 'complete' ? 'opacity-100' : 'opacity-40 mix-blend-luminosity grayscale'}`} />
               
               {/* Product Overlay */}
               {status === 'complete' && userImageURL && (
                 <motion.img 
                   initial={{ opacity: 0, scale: 1.1 }}
                   animate={{ opacity: 0.85, scale: 1 }}
                   transition={{ duration: 1 }}
                   src={product.imageUrl} 
                   alt="Overlay" 
                   className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none" 
                 />
               )}
               
               {status === 'idle' && (
                 <div className="absolute inset-0 flex items-center justify-center flex-col p-6 text-center z-10 bg-black/40 backdrop-blur-[2px]">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 text-[#D4AF37] rounded-xl flex items-center justify-center mb-6 shadow-xl backdrop-blur-md">
                      <Camera size={32} />
                    </div>
                    <h3 className="font-serif text-2xl text-white mb-2">Upload your photo</h3>
                    <p className="text-sm text-gray-400 max-w-xs font-sans">Our AI will detect your body shape and overlay the <span className="font-medium text-[#D4AF37]">"{product.name}"</span> for a realistic preview.</p>
                    
                    <label className="mt-8 bg-white text-black px-6 py-3 font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#D4AF37] transition-all shadow-sm w-full max-w-xs cursor-pointer rounded-none inline-block text-center">
                      Choose Photo
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                 </div>
               )}

               {status === 'analyzing' && (
                 <div className="absolute inset-0 flex items-center justify-center flex-col p-6 text-center z-10 bg-black/60 backdrop-blur-[4px]">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-transparent border-2 border-white/10 rounded-full"></div>
                      <div className="w-20 h-20 border-2 border-[#D4AF37] rounded-full absolute inset-0 border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={24} className="text-[#D4AF37] animate-pulse" />
                      </div>
                    </div>
                    <h3 className="font-sans text-xs uppercase tracking-widest font-bold text-[#D4AF37] mb-2 animate-pulse">Running Vision Model</h3>
                    <p className="text-sm text-gray-400 font-sans">Analyzing body segmented dimensions...</p>
                 </div>
               )}

               {status === 'complete' && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 1 }}
                   className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent flex items-end justify-center pb-6 z-20 pointer-events-none"
                 >
                    <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md flex items-center gap-2">
                      <CheckCircle size={14} /> Perfect Match: Size M
                    </div>
                 </motion.div>
               )}
               
               {/* Scanning Overlay Effect - Only run when analyzing */}
               {status === 'analyzing' && (
                 <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_15px_rgba(212,175,55,0.8)] animate-[scan_2s_ease-in-out_infinite_alternate] z-20" style={{ top: '50%' }}></div>
               )}
            </div>

            {/* Sidebar Controls */}
            <div className="w-full md:w-96 bg-[#050505] p-6 md:p-8 flex flex-col">
              <div className="hidden md:flex justify-end mb-4">
                 <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit mb-6">
                <Sparkles size={12} className="text-[#D4AF37]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Vision Model v2</span>
              </div>
              
              <h2 className="font-serif text-3xl text-white mb-2 italic">Virtual Try-On</h2>
              <p className="text-sm text-gray-400 mb-8 font-sans leading-relaxed">See how it fits before you buy. Powered by advanced segmentation models.</p>
              
              <div className="space-y-4 flex-1">
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-[#D4AF37] shrink-0 animate-pulse"></div>
                  <div>
                    <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-white mb-1">Lighting Analyzed</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">AI adjusts the garment lighting to match your photo environment.</p>
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-[#D4AF37] shrink-0 animate-pulse"></div>
                  <div>
                    <h4 className="font-sans text-xs uppercase tracking-widest font-bold text-white mb-1">Size Prediction</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Estimates the best fit (S, M, L) based on uploaded proportions.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                 <p className="text-[10px] uppercase tracking-widest text-center text-gray-600">Photos are processed instantly and never stored on our servers.</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
