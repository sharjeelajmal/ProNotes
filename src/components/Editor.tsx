"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Bold, Italic, List, Table as TableIcon, Heading1, Heading2, RotateCcw } from "lucide-react";
import * as React from "react";

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function Editor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none w-full min-h-[350px] text-slate-800 dark:text-slate-200 text-base leading-relaxed p-4 prose dark:prose-invert max-w-none ProseMirror",
      },
    },
  });

  // Sync content with parent changes, but only if the editor isn't currently focused
  // (This avoids cursor jumping while typing)
  React.useEffect(() => {
    if (!editor) return;
    const isSameContent = editor.getHTML() === content;
    const isFocused = editor.isFocused;

    if (!isSameContent && !isFocused) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full min-h-[350px] rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 animate-pulse" />
    );
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-col gap-3 w-full border border-slate-250/60 dark:border-white/5 rounded-2xl bg-slate-50/30 dark:bg-neutral-950/20 overflow-hidden">
      {/* Sleek, clinical custom toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/80 dark:bg-neutral-900/60 border-b border-slate-200/50 dark:border-white/5 backdrop-blur-md">
        
        {/* Bold */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
            editor.isActive("bold")
              ? "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/10"
              : "hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
          }`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
            editor.isActive("italic")
              ? "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/10"
              : "hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
          }`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        {/* Heading 1 */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
            editor.isActive("heading", { level: 1 })
              ? "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/10"
              : "hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
          }`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        {/* Heading 2 */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
            editor.isActive("heading", { level: 2 })
              ? "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/10"
              : "hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
          }`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        {/* Bullet List */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
            editor.isActive("bulletList")
              ? "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/10"
              : "hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
          }`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        {/* Insert Table */}
        <button
          onClick={addTable}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Insert Table (3x3)"
        >
          <TableIcon className="w-4 h-4 stroke-[2]" />
        </button>

        {/* Reset / Clear Formatting */}
        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 dark:text-slate-450 transition-colors cursor-pointer flex items-center justify-center ml-auto"
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Clear Formatting"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="w-full bg-white dark:bg-black/45 overflow-x-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
