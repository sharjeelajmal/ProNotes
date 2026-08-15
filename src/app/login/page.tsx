"use client";

import { useState, useTransition } from "react";
import { login } from "@/actions/auth";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Lock, User, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        window.location.href = "/";
      }
    });
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-[#0B1120] px-4 pt-24 pb-4 sm:p-4 selection:bg-blue-500/30 overflow-hidden relative font-sans transition-colors duration-500">
      
      {/* Top Navigation / Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Modern Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xNSkiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        
        {/* Floating animated shapes */}
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[15%] md:right-[25%] w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-500/20 backdrop-blur-3xl border border-white/20 dark:border-white/10 rotate-12"
        />
        
        <motion.div
          animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[15%] left-[15%] md:left-[25%] w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500/20 to-sky-400/20 backdrop-blur-3xl border border-white/20 dark:border-white/10"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Premium Glassmorphic Card */}
        <div className="bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] p-8 sm:p-10">
          
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 dark:opacity-40 rounded-full" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-600/20 dark:to-indigo-600/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner border border-white/50 dark:border-white/10">
                <Lock className="w-8 h-8 stroke-[1.5]" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm font-medium">
              Securely access your workspace
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1 uppercase tracking-wider">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-[#0B1120]/50 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all duration-300 font-medium"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="block w-full pl-11 pr-12 py-3.5 bg-white/50 dark:bg-[#0B1120]/50 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all duration-300 font-medium"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="text-rose-500 dark:text-rose-400 text-sm font-semibold bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 rounded-xl p-3.5 text-center flex items-center justify-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="group relative w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(37,99,235,0.6)] active:scale-[0.98] overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Authenticate"
                )}
              </button>
            </motion.div>
          </form>
        </div>
        
        {/* Decorative elements below the card */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Protected by secure authentication • Developed by <span className="text-blue-500 dark:text-blue-400 font-semibold">Sharry</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
