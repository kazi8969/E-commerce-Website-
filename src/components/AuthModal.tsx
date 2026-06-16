import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, User as UserIcon } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        id: userCredential.user.uid,
        displayName: userCredential.user.displayName || 'Google User',
        email: userCredential.user.email,
        creditBalance: 0,
      }, { merge: true });
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      console.error(err);
    }
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (mode === 'register') {
        if (!name || !email || !password) {
           throw new Error("Please fill out all fields.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          id: userCredential.user.uid,
          displayName: name,
          email: userCredential.user.email,
          creditBalance: 0,
          orders: [],
          addresses: [],
        }, { merge: true });
      } else {
        if (!email || !password) {
           throw new Error("Please enter email and password.");
        }
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${mode === 'login' ? 'sign in' : 'register'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-white italic mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-400 font-sans text-sm">
                {mode === 'login' ? 'Sign in to access your curated collection.' : 'Join the elite fashion club.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleManualAuth}>
              {mode === 'register' && (
                <div className="relative">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 pl-11 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors focus:bg-white/5"
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 pl-11 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors focus:bg-white/5"
                />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 pl-11 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors focus:bg-white/5"
                />
              </div>

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-gray-400 hover:text-white uppercase tracking-widest font-bold">
                    Forgot Password?
                  </button>
                </div>
              )}

              <button disabled={loading} className="w-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-colors mt-4 disabled:opacity-50">
                {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Register')}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6">
              <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full bg-transparent border border-white/20 text-white py-4 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="mt-6 text-center border-t border-white/10 pt-6">
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs text-gray-400 hover:text-white uppercase tracking-widest font-bold"
              >
                {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign In'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
