import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
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

  const allCategories = [{ id: "general", name: "General" }, ...categories];
  const filteredCategories = allCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const selectedCategory = allCategories.find(c => c.id === value) || allCategories[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[10px] font-bold text-slate-700 dark:text-blue-400 transition-colors shadow-sm cursor-pointer"
      >
        <span className="truncate max-w-[80px]">{selectedCategory.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xl shadow-slate-200/40 dark:shadow-black/40 z-50 overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0F172A]/50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 text-[11px] rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto py-1 editor-scroll-body">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onChange(cat.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors ${
                      value === cat.id 
                        ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {value === cat.id && <Check className="w-3 h-3" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No categories found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
