"use client";

import * as React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Editor } from "@/components/Editor";
import { 
  Plus, 
  Search, 
  FileText, 
  X, 
  Clock, 
  Trash2,
  Tag,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Pin,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchNotesApi, 
  saveNoteApi, 
  deleteNoteApi, 
  unlockNoteApi,
  togglePinApi
} from "@/lib/notesApi";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  tags: string[];
  patientId?: string;
  isLocked?: boolean;
  pin?: string;
  isPinned?: boolean;
}

// Quick helper to strip HTML tags for card grid summaries safely on both SSR and CSR
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatNoteDate(value: string) {
  if (!value || value === "Just now") return value || "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function Home() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = React.useState<string>("");
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [showSearch, setShowSearch] = React.useState<boolean>(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [isDraftDirty, setIsDraftDirty] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [syncError, setSyncError] = React.useState<string>("");
  const [syncInfo, setSyncInfo] = React.useState<{ database: string; noteCount: number } | null>(null);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  // Notepad PIN Lock Screen State
  const [pinModalOpen, setPinModalOpen] = React.useState<boolean>(false);
  const [pinTargetNoteId, setPinTargetNoteId] = React.useState<string>("");
  const [pinInputValue, setPinInputValue] = React.useState<string>("");
  const [pinError, setPinError] = React.useState<string>("");
  const [isVerifyingPin, setIsVerifyingPin] = React.useState<boolean>(false);

  // Notepad PIN Configuration Dialog Inside Editor
  const [lockSettingsOpen, setLockSettingsOpen] = React.useState<boolean>(false);
  const [newPinValue, setNewPinValue] = React.useState<string>("");
  const [lockSettingsError, setLockSettingsError] = React.useState<string>("");

  const isEditingRef = React.useRef(false);
  const isDraftDirtyRef = React.useRef(false);
  const activeNoteIdRef = React.useRef("");

  React.useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  React.useEffect(() => { isDraftDirtyRef.current = isDraftDirty; }, [isDraftDirty]);
  React.useEffect(() => { activeNoteIdRef.current = activeNoteId; }, [activeNoteId]);

  // Remove all old cached data on every app load
  React.useEffect(() => {
    try {
      localStorage.removeItem("pronotes_cache");
      localStorage.removeItem("pronotes_cache_at");
    } catch {
      // ignore
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }

    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
  }, []);

  // PWA install prompt only (no service worker caching)
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert("To install: tap Share in Safari, then 'Add to Home Screen'.");
      } else {
        alert("To install: open browser menu and choose 'Install app' or 'Add to Home screen'.");
      }
    }
  };

  const fetchIdRef = React.useRef(0);

  const reloadFromServer = React.useCallback(async () => {
    const result = await fetchNotesApi();
    if (!result.success) {
      setSyncError(result.error || "Could not load notes from database");
      console.error("Failed to load notes from DB:", result.error);
      return result;
    }

    setSyncError("");

    try {
      const infoRes = await fetch(`/api/sync-info?_=${Date.now()}`, { cache: "no-store" });
      const info = await infoRes.json();
      if (info.success) {
        setSyncInfo({ database: info.database, noteCount: info.noteCount });
      }
    } catch {
      setSyncInfo({ database: "connected", noteCount: result.notes.length });
    }

    setNotes((prev) => {
      if (isEditingRef.current && isDraftDirtyRef.current && activeNoteIdRef.current) {
        const editingId = activeNoteIdRef.current;
        const localDraft = prev.find((n) => n.id === editingId);
        if (!localDraft) return result.notes;

        return result.notes.map((serverNote) =>
          serverNote.id === editingId
            ? {
                ...serverNote,
                title: localDraft.title,
                content: localDraft.content,
                tags: localDraft.tags,
                patientId: localDraft.patientId,
                pin: localDraft.pin,
                isPinned: localDraft.isPinned,
                updatedAt: localDraft.updatedAt,
              }
            : serverNote
        );
      }

      return result.notes;
    });

    return result;
  }, []);

  // Always load fresh from MongoDB — no local cache
  React.useEffect(() => {
    const fetchId = ++fetchIdRef.current;

    async function loadNotes() {
      setIsLoading(true);
      try {
        if (fetchId !== fetchIdRef.current) return;
        const result = await reloadFromServer();
        if (result.success && result.notes.length > 0) {
          setActiveNoteId((prev) => prev || result.notes[0].id);
        }
      } finally {
        if (fetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadNotes();
  }, [reloadFromServer]);

  // Keep in sync: refresh every 10s + when tab becomes visible
  React.useEffect(() => {
    const refreshNotes = () => {
      if (document.visibilityState !== "visible") return;
      void reloadFromServer();
    };

    const interval = window.setInterval(refreshNotes, 10000);
    document.addEventListener("visibilitychange", refreshNotes);
    window.addEventListener("focus", refreshNotes);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshNotes);
      window.removeEventListener("focus", refreshNotes);
    };
  }, [reloadFromServer]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Debounced Autosave
  React.useEffect(() => {
    if (!isDraftDirty || !activeNote) return;

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const response = await saveNoteApi(activeNote.id, {
          title: activeNote.title,
          content: activeNote.content,
          tags: activeNote.tags,
          patientId: activeNote.patientId,
          pin: activeNote.pin || "",
          isPinned: activeNote.isPinned ?? false,
        });

        if (response.success && response.note) {
          setSaveStatus("saved");
          setIsDraftDirty(false);

          if (activeNoteId !== response.note.id) {
            setActiveNoteId(response.note.id);
          }

          await reloadFromServer();
          setTimeout(() => setSaveStatus("idle"), 1500);
        }
      } catch (error) {
        console.error("Autosave error:", error);
        setSaveStatus("idle");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeNote?.title, activeNote?.content, activeNote?.patientId, activeNote?.tags, activeNote?.pin, activeNote?.isPinned, isDraftDirty, activeNoteId, reloadFromServer]);

  // Handle Note Clicks & Lock Prompt Check
  const handleNoteCardClick = (note: Note) => {
    if (note.isLocked && !note.content) {
      setPinTargetNoteId(note.id);
      setPinInputValue("");
      setPinError("");
      setPinModalOpen(true);
    } else {
      setActiveNoteId(note.id);
      setIsEditing(true);
    }
  };

  // Lock Verification Digit Inputs (Screen / Keyboard)
  const handlePinDigitPress = async (digit: string) => {
    if (pinInputValue.length >= 4) return;
    const nextVal = pinInputValue + digit;
    setPinInputValue(nextVal);

    if (nextVal.length === 4) {
      setIsVerifyingPin(true);
      setPinError("");
      try {
        const response = await unlockNoteApi(pinTargetNoteId, nextVal);
        if (response.success && response.note) {
          const unlocked = response.note;
          setNotes(prev =>
            prev.map(note =>
              note.id === pinTargetNoteId
                ? {
                    ...note,
                    content: unlocked.content,
                    patientId: unlocked.patientId,
                    pin: unlocked.pin,
                    isLocked: true
                  }
                : note
            )
          );
          setActiveNoteId(pinTargetNoteId);
          setIsEditing(true);
          setPinModalOpen(false);
          await reloadFromServer();
        } else {
          setPinError(response.error || "Incorrect PIN");
          setPinInputValue("");
        }
      } catch (err) {
        console.error("PIN check failed:", err);
        setPinError("Connection Error");
        setPinInputValue("");
      } finally {
        setIsVerifyingPin(false);
      }
    }
  };

  // Keyboard PIN Inputs
  React.useEffect(() => {
    if (!pinModalOpen) return;
    const handlePhysicalKeys = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePinDigitPress(e.key);
      } else if (e.key === "Backspace") {
        setPinInputValue(prev => prev.slice(0, -1));
      } else if (e.key === "Escape") {
        setPinModalOpen(false);
      }
    };
    window.addEventListener("keydown", handlePhysicalKeys);
    return () => window.removeEventListener("keydown", handlePhysicalKeys);
  }, [pinModalOpen, pinInputValue, pinTargetNoteId]);

  // Handler for note content editing (TipTap update)
  const handleContentChange = (content: string) => {
    if (!activeNote) return;
    setNotes(prev =>
      prev.map(note =>
        note.id === activeNoteId
          ? { ...note, content, updatedAt: "Just now" }
          : note
      )
    );
    setIsDraftDirty(true);
  };

  // Handler for note title editing
  const handleTitleChange = (title: string) => {
    if (!activeNote) return;
    setNotes(prev =>
      prev.map(note =>
        note.id === activeNoteId
          ? { ...note, title, updatedAt: "Just now" }
          : note
      )
    );
    setIsDraftDirty(true);
  };

  // Handler for note patientId editing
  const handlePatientIdChange = (patientId: string) => {
    if (!activeNote) return;
    setNotes(prev =>
      prev.map(note =>
        note.id === activeNoteId
          ? { ...note, patientId, updatedAt: "Just now" }
          : note
      )
    );
    setIsDraftDirty(true);
  };

  // Save note immediately (manual save)
  const handleSave = async () => {
    if (!activeNote) return;
    setSaveStatus("saving");
    try {
      const response = await saveNoteApi(activeNote.id, {
        title: activeNote.title,
        content: activeNote.content,
        tags: activeNote.tags,
        patientId: activeNote.patientId,
        pin: activeNote.pin || "",
        isPinned: activeNote.isPinned ?? false,
      });

      if (response.success && response.note) {
        setSaveStatus("saved");
        setIsDraftDirty(false);

        if (activeNoteId !== response.note.id) {
          setActiveNoteId(response.note.id);
        }

        await reloadFromServer();
        setTimeout(() => setSaveStatus("idle"), 1500);
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("idle");
    }
  };

  // Create a new note
  const handleCreateNote = () => {
    const tempId = "temp-" + Date.now();
    const newNote: Note = {
      id: tempId,
      title: "New Note",
      content: "",
      updatedAt: "Just now",
      tags: ["General"],
      patientId: "",
      isLocked: false,
      pin: ""
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(tempId);
    setIsEditing(true);
    setIsDraftDirty(true);
  };

  // Delete current note
  const handleDeleteNote = async () => {
    if (!activeNote) return;
    
    const currentId = activeNote.id;
    const currentIndex = notes.findIndex(n => n.id === currentId);
    const updatedNotes = notes.filter(n => n.id !== currentId);
    
    if (updatedNotes.length === 0) {
      const fallbackNote: Note = {
        id: "temp-" + Date.now(),
        title: "Untitled Note",
        content: "",
        updatedAt: "Just now",
        tags: ["General"],
        patientId: "",
        isLocked: false,
        pin: ""
      };
      setNotes([fallbackNote]);
      setActiveNoteId(fallbackNote.id);
    } else {
      setNotes(updatedNotes);
      const nextIndex = Math.max(0, currentIndex - 1);
      setActiveNoteId(updatedNotes[nextIndex].id);
    }

    setIsEditing(false);
    setIsDraftDirty(false);

    try {
      await deleteNoteApi(currentId);
      await reloadFromServer();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  // Securely lock note / config PIN dialog
  const handleApplyLock = async () => {
    if (!/^\d{4}$/.test(newPinValue)) {
      setLockSettingsError("PIN must be exactly 4 digits");
      return;
    }
    setSaveStatus("saving");
    try {
      const response = await saveNoteApi(activeNoteId, {
        title: activeNote?.title || "",
        content: activeNote?.content || "",
        tags: activeNote?.tags || [],
        patientId: activeNote?.patientId || "",
        pin: newPinValue,
        isPinned: activeNote?.isPinned ?? false,
      });
      if (response.success && response.note) {
        const savedNote = response.note;
        if (activeNoteId !== savedNote.id) {
          setActiveNoteId(savedNote.id);
        }
        setSaveStatus("saved");
        setIsDraftDirty(false);
        await reloadFromServer();
        setTimeout(() => setSaveStatus("idle"), 1500);
      }
    } catch (err) {
      console.error("Failed to apply lock:", err);
    }
    setLockSettingsOpen(false);
    setNewPinValue("");
  };

  const handleRemoveLock = async () => {
    setSaveStatus("saving");
    try {
      const response = await saveNoteApi(activeNoteId, {
        title: activeNote?.title || "",
        content: activeNote?.content || "",
        tags: activeNote?.tags || [],
        patientId: activeNote?.patientId || "",
        pin: "",
        isPinned: activeNote?.isPinned ?? false,
      });
      if (response.success && response.note) {
        const savedNote = response.note;
        if (activeNoteId !== savedNote.id) {
          setActiveNoteId(savedNote.id);
        }
        setSaveStatus("saved");
        setIsDraftDirty(false);
        await reloadFromServer();
        setTimeout(() => setSaveStatus("idle"), 1500);
      }
    } catch (err) {
      console.error("Failed to remove lock:", err);
    }
    setLockSettingsOpen(false);
    setNewPinValue("");
  };

  // Filter notes based on query
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.patientId && note.patientId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Toggle Pinned Status immediately
  const handleTogglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();

    if (!/^[0-9a-fA-F]{24}$/.test(note.id)) {
      alert("Please save the note first, then pin it.");
      return;
    }

    const targetState = !note.isPinned;
    const result = await togglePinApi(note.id, targetState);

    if (!result.success) {
      console.error("Failed to toggle pin:", result.error);
      alert(result.error || "Could not update pin. Please try again.");
    }

    await reloadFromServer();
  };

  // Sort notes: pinned first, then preserve server order
  const sortedNotes = React.useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      const pinA = a.isPinned ? 1 : 0;
      const pinB = b.isPinned ? 1 : 0;
      return pinB - pinA;
    });
  }, [filteredNotes]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col relative pb-32 transition-colors duration-500 font-sans">
      
      {/* Dashboard Top Header */}
      <header className="w-full max-w-6xl mx-auto py-6 md:py-12 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 dark:bg-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <FileText className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-white truncate">
              ProNotes
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-450 font-medium">
            Personal Notes
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 overflow-hidden"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.span
              className="relative w-2 h-2 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="relative text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              {syncInfo ? `${syncInfo.noteCount} notes · ${syncInfo.database}` : "Live DB"}
            </span>
          </motion.div>
        </div>
      </header>

      {syncError && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 -mt-4 mb-2">
          <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs text-rose-700 dark:text-rose-300">
            <strong>Database sync failed:</strong> {syncError}
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <main className="w-full max-w-6xl mx-auto px-6 flex-1 flex flex-col gap-4">
        
        {/* Mobile-Only Search Bar Pinned at Top */}
        <div className="w-full md:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#0F172A]/70 border border-slate-200/60 dark:border-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
            />
          </div>
        </div>

        {/* Search header indicator if active */}
        <AnimatePresence>
          {searchQuery && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-slate-400 dark:text-slate-450 flex items-center gap-1.5 mb-2"
            >
              <span>Showing results for &ldquo;{searchQuery}&rdquo;</span>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-blue-600 dark:text-[#3B82F6] hover:underline cursor-pointer"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Spinner / Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-44 rounded-2xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 animate-pulse p-6 space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-2/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Responsive CSS Card Grid */
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredNotes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  No notes found matching your search.
                </motion.div>
              ) : (
                sortedNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    onClick={() => handleNoteCardClick(note)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNoteCardClick(note);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    whileHover={{ 
                      y: -4, 
                      boxShadow: "0 15px 30px -10px rgba(59, 130, 246, 0.15)",
                      borderColor: "rgba(59, 130, 246, 0.3)"
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="w-full text-left p-3 sm:p-6 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 border border-slate-200/50 dark:border-transparent backdrop-blur-sm flex flex-col gap-2 sm:gap-4 transition-colors duration-300 cursor-pointer shadow-sm dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {/* Decorative faint glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="flex flex-col gap-1.5 relative z-10 w-full">
                      <span className="font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-1 w-full flex items-center gap-1.5 min-w-0">
                        {note.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 stroke-[2.5]" />}
                        <span className="truncate">{note.title || "Untitled Note"}</span>
                      </span>
                      <div className="flex items-center justify-start gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleTogglePin(e, note)}
                          className={`p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-white/10 ${
                            note.isPinned 
                              ? "text-blue-600 dark:text-[#3B82F6]" 
                              : "text-slate-300 dark:text-slate-600 hover:text-slate-500"
                          }`}
                          title={note.isPinned ? "Unpin note from top" : "Pin note to top"}
                        >
                          <Pin className={`w-3.5 h-3.5 ${note.isPinned ? "fill-current" : ""}`} />
                        </button>
                        <span className="text-[10px] text-slate-400 dark:text-slate-450 whitespace-nowrap flex items-center gap-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatNoteDate(note.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {note.isLocked && !note.content ? (
                      <div className="flex items-center gap-2 text-amber-500/80 dark:text-amber-500/70 text-xs font-semibold py-1">
                        <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Notepad PIN Protected</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed relative z-10">
                        {stripHtml(note.content) || "Empty note content..."}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2 relative z-10">
                      {note.tags && note.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-200/40 dark:bg-white/5 text-slate-500 dark:text-slate-350 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {t}
                        </span>
                      ))}
                      {!note.isLocked && note.patientId && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-[#3B82F6]/10 text-blue-600 dark:text-[#3B82F6]">
                          {note.patientId}
                        </span>
                      )}
                      {note.isLocked && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500">
                          LOCKED
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating Action Bar Pill (Bottom Center) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/90 dark:bg-[#0B1120]/80 border border-slate-200/50 dark:border-white/10 shadow-xl shadow-slate-200/10 dark:shadow-[#030712]/50 backdrop-blur-md transition-colors duration-500">
          
          {/* New Note Button */}
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#3B82F6] dark:hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/10 cursor-pointer whitespace-nowrap"
            style={{ minHeight: "40px" }}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Note
          </button>

          {/* Install App — always visible */}
          <button
            onClick={handleInstallApp}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold text-blue-600 dark:text-[#3B82F6] bg-blue-50/80 dark:bg-[#3B82F6]/10 hover:bg-blue-100 dark:hover:bg-[#3B82F6]/20 border border-blue-200/50 dark:border-blue-500/20 transition-colors cursor-pointer"
            style={{ minHeight: "40px" }}
            title="Install App"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          {/* Search Trigger and Sliding Search Field (Desktop only) */}
          <div className="hidden md:flex items-center">
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative overflow-hidden flex items-center mr-1"
                >
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-2 pr-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-[#0F172A]/70 border border-transparent focus:outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer flex items-center justify-center ${showSearch ? 'text-blue-500' : 'text-slate-400 dark:text-neutral-500'}`}
              style={{ minHeight: "40px", minWidth: "40px" }}
              aria-label="Toggle Search"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="hidden md:block w-[1px] h-5 bg-slate-200 dark:bg-white/10" />

          {/* Theme Toggler Pill */}
          <ThemeToggle />
        </div>
      </div>

      {/* Note PIN Authentication Modal */}
      <AnimatePresence>
        {pinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/50 dark:border-white/5 p-6 shadow-2xl flex flex-col items-center gap-6"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <KeyRound className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Enter Notepad PIN</h3>
                <p className="text-xs text-slate-400 dark:text-slate-450 font-medium">This notepad contains confidential records.</p>
              </div>

              {/* Pin indicator circles */}
              <div className="flex items-center gap-4 my-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                      pinInputValue.length >= i
                        ? "bg-blue-600 border-blue-600 dark:bg-[#3B82F6] dark:border-[#3B82F6] scale-110"
                        : "border-slate-300 dark:border-slate-700 bg-transparent"
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <span className="text-xs text-rose-500 font-semibold animate-pulse text-center">
                  {pinError}
                </span>
              )}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] my-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinDigitPress(digit)}
                    disabled={isVerifyingPin}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all text-sm font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={() => setPinModalOpen(false)}
                  disabled={isVerifyingPin}
                  className="h-12 rounded-xl text-xs font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePinDigitPress("0")}
                  disabled={isVerifyingPin}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all text-sm font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={() => setPinInputValue((prev) => prev.slice(0, -1))}
                  disabled={isVerifyingPin}
                  className="h-12 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notepad Lock Settings Dialog */}
      <AnimatePresence>
        {lockSettingsOpen && activeNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/50 dark:border-white/5 p-6 shadow-2xl flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 text-sm">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Notepad Lock Settings
                </span>
                <button 
                  onClick={() => {
                    setLockSettingsOpen(false);
                    setNewPinValue("");
                    setLockSettingsError("");
                  }} 
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-400 dark:text-slate-450 leading-relaxed font-medium">
                  {activeNote.pin 
                    ? "Change the 4-digit lock passcode or click Remove to unlock the notepad." 
                    : "Lock this note with a 4-digit PIN. You will need the PIN to open it again."}
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider">
                    {activeNote.pin ? "New 4-Digit Passcode" : "Set 4-Digit Passcode"}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="e.g. 1234"
                    value={newPinValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 4) {
                        setNewPinValue(val);
                        setLockSettingsError("");
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-white font-mono text-center tracking-widest text-lg"
                  />
                  {lockSettingsError && (
                    <span className="text-[10px] text-rose-500 font-semibold">{lockSettingsError}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full">
                {activeNote.pin && (
                  <button
                    onClick={handleRemoveLock}
                    className="flex-1 h-11 text-xs font-bold text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent cursor-pointer"
                  >
                    Remove Lock
                  </button>
                )}
                <button
                  onClick={handleApplyLock}
                  className="flex-1 h-11 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#3B82F6] dark:hover:bg-blue-600 rounded-xl cursor-pointer"
                >
                  {activeNote.pin ? "Update PIN" : "Apply Lock"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Screen Overlay Editor Transition */}
      <AnimatePresence>
        {isEditing && activeNote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0B1120] p-4 sm:p-6 md:p-12 flex flex-col overflow-y-auto overflow-x-hidden"
          >
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
              
              {/* Overlay Editor Actions Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-white/5 mb-8 shrink-0">
                
                {/* Left Side: Close Button and Writing Status */}
                <div className="flex items-center gap-3">
                  {/* Close Overlay Button - UX Standard on Mobile Left */}
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setIsDraftDirty(false); // Reset dirty state
                      
                      // Client-side auto-masking: Remove decrypted content from state on close for security
                      if (activeNote.pin) {
                        setNotes(prev =>
                          prev.map(note =>
                            note.id === activeNoteId
                              ? { ...note, content: "", patientId: "" }
                              : note
                          )
                        );
                      }
                    }}
                    className="h-10 px-3 md:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-350 transition-colors cursor-pointer"
                    title="Close editor"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>

                {/* Right Side: Saving indicator and Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <AnimatePresence mode="wait">
                    {saveStatus === "saving" && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] sm:text-xs text-slate-450 dark:text-neutral-500 mr-1 sm:mr-2"
                      >
                        Saving...
                      </motion.span>
                    )}
                    {saveStatus === "saved" && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] sm:text-xs text-blue-600 dark:text-[#3B82F6] font-semibold mr-1 sm:mr-2"
                      >
                        Saved
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Pin to Top Toggle */}
                  <button
                    onClick={(e) => handleTogglePin(e, activeNote)}
                    className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeNote.isPinned 
                        ? "border-blue-200/50 bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                        : "border-slate-250 dark:border-white/5 text-slate-650 dark:text-neutral-450 hover:bg-slate-100 dark:hover:bg-neutral-900"
                    }`}
                    title={activeNote.isPinned ? "Unpin note from top" : "Pin note to top"}
                  >
                    <Pin className={`w-4 h-4 ${activeNote.isPinned ? "fill-current" : ""}`} />
                    <span className="hidden sm:inline">{activeNote.isPinned ? "Pinned" : "Pin Note"}</span>
                  </button>

                  {/* Note Locking Trigger */}
                  <button
                    onClick={() => setLockSettingsOpen(true)}
                    className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeNote.pin 
                        ? "border-amber-200/50 bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                        : "border-slate-250 dark:border-white/5 text-slate-650 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900"
                    }`}
                    title={activeNote.pin ? "Change or remove PIN" : "Lock note with 4-digit PIN"}
                  >
                    {activeNote.pin ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span className="hidden sm:inline">{activeNote.pin ? "Locked" : "Lock Note"}</span>
                  </button>

                  {/* Save Changes Button */}
                  <button
                    onClick={handleSave}
                    className="h-10 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900 border border-slate-250 dark:border-white/5 cursor-pointer flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300"
                    title="Save note"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={handleDeleteNote}
                    className="text-xs font-bold text-rose-600 h-10 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer flex items-center justify-center border border-transparent"
                    title="Delete note"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Massive Title */}
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Note"
                className="w-full text-4xl md:text-5xl font-extrabold bg-transparent text-slate-855 dark:text-slate-100 placeholder-slate-200 dark:placeholder-neutral-800 border-none outline-none focus:ring-0 mb-4 p-0"
              />

              {/* Details Tag list row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-450 mb-8 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Modified: {formatNoteDate(activeNote.updatedAt)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span>Reference:</span>
                  <input
                    type="text"
                    value={activeNote.patientId || ""}
                    onChange={(e) => handlePatientIdChange(e.target.value)}
                    placeholder="None"
                    className="font-mono text-slate-700 dark:text-[#3B82F6] bg-transparent outline-none border-none focus:ring-0 p-0 w-24"
                  />
                </div>
                <span>•</span>
                {activeNote.tags && activeNote.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-md bg-blue-50/50 dark:bg-[#3B82F6]/10 text-blue-600 dark:text-[#3B82F6] font-bold">
                    {t}
                  </span>
                ))}
              </div>

              {/* Premium TipTap Editor Component */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Editor
                  content={activeNote.content}
                  onChange={handleContentChange}
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
