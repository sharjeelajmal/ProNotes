"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-8 rounded-full bg-slate-200 dark:bg-navy-900 border border-slate-300 dark:border-navy-800 animate-pulse" />
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-8 rounded-full bg-slate-200 dark:bg-navy-950 border border-slate-350 dark:border-tealAccent/20 p-1 flex items-center cursor-pointer transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 overflow-hidden"
      aria-label="Toggle Theme"
    >
      {/* Visual background guide icons */}
      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none text-slate-400 dark:text-navy-600">
        <Sun className="w-3 h-3" />
        <Moon className="w-3 h-3" />
      </div>

      {/* Animated toggle handle (pill knob) */}
      <motion.div
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-6 h-6 rounded-full bg-white dark:bg-tealAccent shadow-md flex items-center justify-center z-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <Moon className="w-3.5 h-3.5 fill-navy-950 text-navy-950" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <Sun className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
