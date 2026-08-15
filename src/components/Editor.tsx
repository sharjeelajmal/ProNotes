"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  RotateCcw,
  Rows3,
  Columns3,
  Trash2,
  Plus,
  Palette,
  Loader2,
  Mic,
  Square,
} from "lucide-react";
import * as React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { motion, AnimatePresence } from "framer-motion";

export const AudioExtension = Node.create({
  name: "audio",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "audio[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "audio-wrapper my-4 flex items-center justify-center p-4 bg-slate-50 dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10" },
      ["audio", mergeAttributes(HTMLAttributes, { controls: true, class: "w-full max-w-md" }), ["source", { src: HTMLAttributes.src }]],
    ];
  },
});

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
}

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Gray", value: "#64748b" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
];

function ToolbarBtn({
  active,
  disabled,
  onClick,
  title,
  children,
  className = "",
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-white/8"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-slate-200/80 dark:bg-white/10 shrink-0 mx-0.5" />;
}

export function Editor({ content, onChange }: EditorProps) {
  const [tablePickerOpen, setTablePickerOpen] = React.useState(false);
  const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = React.useState(false);
  const [tableRows, setTableRows] = React.useState(3);
  const [tableCols, setTableCols] = React.useState(3);
  const [isInTable, setIsInTable] = React.useState(false);
  const tablePickerRef = React.useRef<HTMLDivElement>(null);
  const colorPickerRef = React.useRef<HTMLDivElement>(null);
  const highlightPickerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadText, setUploadText] = React.useState("Uploading...");

  // Recording State
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) return;
    try {
      setIsUploading(true);
      setUploadText(file.type.startsWith("audio/") ? "Uploading Voice Message..." : "Uploading Image...");
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      if (data.url && editor) {
        if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
          editor.chain().focus().insertContent(`<audio controls src="${data.url}"></audio>`).run();
        } else {
          editor.chain().focus().setImage({ src: data.url }).run();
        }
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file. Make sure Cloudinary credentials are set.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        await handleFileUpload(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "code-block" } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link", rel: "noopener noreferrer", target: "_blank" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ HTMLAttributes: { class: "editor-image" } }),
      Placeholder.configure({ placeholder: "Start writing your note…" }),
      Typography,
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 50,
        lastColumnResizable: true,
      }),
      AudioExtension,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "focus:outline-none w-full text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed px-5 py-4 prose dark:prose-invert max-w-none ProseMirror editor-scroll-body",
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")) {
            handleFileUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")) {
            handleFileUpload(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const syncTableState = () => {
      const active = editor.isActive("table");
      setIsInTable((prev) => (prev === active ? prev : active));
    };
    syncTableState();
    editor.on("selectionUpdate", syncTableState);
    return () => {
      editor.off("selectionUpdate", syncTableState);
    };
  }, [editor]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as globalThis.Node;
      if (tablePickerRef.current && !tablePickerRef.current.contains(target)) setTablePickerOpen(false);
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) setColorPickerOpen(false);
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(target)) setHighlightPickerOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!editor) return;
    const isSameContent = editor.getHTML() === content;
    if (!isSameContent && !editor.isFocused) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex-1 min-h-0 w-full rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 animate-pulse" />
    );
  }

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setTablePickerOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full rounded-2xl border border-slate-200/70 dark:border-white/8 bg-white/80 dark:bg-neutral-950/40 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all duration-300 relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }} 
        accept="image/*, audio/*, video/*" 
        className="hidden" 
      />
      {/* Uploading Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-2xl"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-neutral-900 shadow-xl border border-slate-200 dark:border-white/10">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{uploadText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Recording Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 rounded-full bg-slate-900 text-white shadow-2xl shadow-blue-500/20 border border-white/10"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
              <span className="font-mono font-bold text-sm tracking-wider">{formatTime(recordingTime)}</span>
            </div>
            <div className="w-px h-5 bg-white/20" />
            <button 
              onClick={stopRecording} 
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-rose-500 hover:border-rose-500 border border-white/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop & Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Toolbar */}
      <div className="shrink-0 rounded-t-2xl border-b border-slate-200/60 dark:border-white/6 bg-slate-50/90 dark:bg-neutral-900/70 backdrop-blur-md relative z-30">
        <div className="flex items-center flex-wrap gap-1 p-2">
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <ToolbarSep />

          <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
            <Code className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscript">
            <SubIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript">
            <SuperIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <ToolbarSep />

          <div className="relative shrink-0" ref={colorPickerRef}>
            <ToolbarBtn active={colorPickerOpen} onClick={() => { setColorPickerOpen((o) => !o); setHighlightPickerOpen(false); setTablePickerOpen(false); }} title="Text color">
              <Palette className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <AnimatePresence>
              {colorPickerOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 z-[60] p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl grid grid-cols-5 gap-2 min-w-[160px]"
                >
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      title={c.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (c.value) editor.chain().focus().setColor(c.value).run();
                        else editor.chain().focus().unsetColor().run();
                        setColorPickerOpen(false);
                      }}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                      style={{ background: c.value || "linear-gradient(135deg,#fff 50%,#000 50%)" }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative shrink-0" ref={highlightPickerRef}>
            <ToolbarBtn active={editor.isActive("highlight") || highlightPickerOpen} onClick={() => { setHighlightPickerOpen((o) => !o); setColorPickerOpen(false); setTablePickerOpen(false); }} title="Highlight">
              <Highlighter className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <AnimatePresence>
              {highlightPickerOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 z-[60] p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl grid grid-cols-4 gap-2 min-w-[140px]"
                >
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      title={c.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (c.value) editor.chain().focus().toggleHighlight({ color: c.value }).run();
                        else editor.chain().focus().unsetHighlight().run();
                        setHighlightPickerOpen(false);
                      }}
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                      style={{ background: c.value || "transparent" }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ToolbarSep />

          <ToolbarBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
            <Heading1 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
            <Heading2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
            <Heading3 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("paragraph") && !editor.isActive("heading")} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph">
            <Pilcrow className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <ToolbarSep />

          <ToolbarBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <List className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task list">
            <ListChecks className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <ToolbarSep />

          <ToolbarBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
            <Quote className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
            <SquareCode className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <ToolbarSep />

          <ToolbarBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
            <AlignRight className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">
            <AlignJustify className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <ToolbarSep />

          <ToolbarBtn active={editor.isActive("link")} onClick={setLink} title="Add link">
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          {editor.isActive("link") && (
            <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
              <Unlink className="w-3.5 h-3.5" />
            </ToolbarBtn>
          )}
          <ToolbarBtn onClick={addImage} title="Insert image or media">
            <ImageIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn active={isRecording} onClick={isRecording ? stopRecording : startRecording} title={isRecording ? "Stop recording" : "Record voice message"} className={isRecording ? "!bg-rose-500 text-white animate-pulse" : ""}>
            <Mic className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <div className="relative shrink-0" ref={tablePickerRef}>
            <ToolbarBtn active={tablePickerOpen} onClick={() => { setTablePickerOpen((o) => !o); setColorPickerOpen(false); setHighlightPickerOpen(false); }} title="Insert table">
              <TableIcon className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <AnimatePresence>
              {tablePickerOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 md:left-0 md:right-auto mt-2 z-[60] p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col gap-3 min-w-[200px]"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Table size</p>
                  {(["Rows", "Cols"] as const).map((label, i) => {
                    const val = i === 0 ? tableRows : tableCols;
                    const set = i === 0 ? setTableRows : setTableCols;
                    const max = i === 0 ? 20 : 10;
                    return (
                      <div key={label} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5 p-1.5 rounded-xl">
                        <span className="text-xs font-semibold text-slate-500 pl-2">{label}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => set((v) => Math.max(1, v - 1))} className="p-1.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 cursor-pointer shadow-sm border border-slate-200 dark:border-transparent transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-sm font-bold font-mono w-6 text-center">{val}</span>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => set((v) => Math.min(max, v + 1))} className="p-1.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 cursor-pointer shadow-sm border border-slate-200 dark:border-transparent transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertTable} className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-blue-500/20">
                    Insert {tableRows} × {tableCols}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isInTable && (
            <>
              <ToolbarSep />
              <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row"><Plus className="w-3 h-3" /><Rows3 className="w-3 h-3 -ml-0.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column"><Plus className="w-3 h-3" /><Columns3 className="w-3 h-3 -ml-0.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row" className="!text-rose-500"><Minus className="w-3 h-3" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column" className="!text-rose-500"><Columns3 className="w-3 h-3" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table" className="!text-rose-500"><Trash2 className="w-3 h-3" /></ToolbarBtn>
            </>
          )}

          <ToolbarBtn
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear formatting"
            className="ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </div>
      </div>

      {/* Selection bubble menu */}
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: ed }) => !ed.isActive("table") && !ed.state.selection.empty}
        className="flex items-center gap-0.5 p-1 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-xl"
      >
        <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="w-3 h-3" /></ToolbarBtn>
        <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="w-3 h-3" /></ToolbarBtn>
        <ToolbarBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="w-3 h-3" /></ToolbarBtn>
        <ToolbarBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike"><Strikethrough className="w-3 h-3" /></ToolbarBtn>
        <ToolbarBtn active={editor.isActive("link")} onClick={setLink} title="Link"><LinkIcon className="w-3 h-3" /></ToolbarBtn>
        <ToolbarBtn active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} title="Highlight"><Highlighter className="w-3 h-3" /></ToolbarBtn>
      </BubbleMenu>

      {/* Table bubble menu */}
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: ed }) => ed.isActive("table")}
        className="flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-lg"
      >
        {["+ Row", "+ Col", "− Row", "− Col"].map((label, i) => {
          const actions = [
            () => editor.chain().focus().addRowAfter().run(),
            () => editor.chain().focus().addColumnAfter().run(),
            () => editor.chain().focus().deleteRow().run(),
            () => editor.chain().focus().deleteColumn().run(),
          ];
          return (
            <button key={label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={actions[i]}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${i >= 2 ? "hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500" : "hover:bg-slate-100 dark:hover:bg-white/10"}`}>
              {label}
            </button>
          );
        })}
      </BubbleMenu>

      {/* Writing area */}
      <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
