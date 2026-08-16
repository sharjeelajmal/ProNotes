import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface StatusSelectProps {
  value: string;
  onChange: (status: string) => void;
}

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statuses = ["Pending", "In Review", "Done"];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[10px] font-bold text-slate-700 dark:text-blue-400 transition-colors shadow-sm cursor-pointer"
      >
        <span className="truncate max-w-[80px]">{value || "Pending"}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-32 max-w-[calc(100vw-32px)] bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xl shadow-slate-200/40 dark:shadow-black/40 z-50 overflow-hidden flex flex-col py-1"
          >
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => {
                  onChange(status);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors ${
                  value === status 
                    ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <span className="truncate">{status}</span>
                {value === status && <Check className="w-3 h-3" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
