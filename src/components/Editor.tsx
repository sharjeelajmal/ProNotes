"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  List,
  Table as TableIcon,
  Heading1,
  Heading2,
  RotateCcw,
  Rows3,
  Columns3,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import * as React from "react";

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function Editor({ content, onChange }: EditorProps) {
  const [tablePickerOpen, setTablePickerOpen] = React.useState(false);
  const [tableRows, setTableRows] = React.useState(3);
  const [tableCols, setTableCols] = React.useState(3);
  const [isInTable, setIsInTable] = React.useState(false);
  const tablePickerRef = React.useRef<HTMLDivElement>(null);

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
        handleWidth: 5,
        cellMinWidth: 50,
        lastColumnResizable: true,
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
        class: "focus:outline-none w-full text-slate-800 dark:text-slate-200 text-base leading-relaxed p-4 prose dark:prose-invert max-w-none ProseMirror editor-scroll-body",
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
    if (!tablePickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setTablePickerOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [tablePickerOpen]);

  React.useEffect(() => {
    if (!editor) return;
    const isSameContent = editor.getHTML() === content;
    const isFocused = editor.isFocused;

    if (!isSameContent && !isFocused) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const keepEditorFocus = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (!editor) {
    return (
      <div className="w-full min-h-[350px] rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 animate-pulse" />
    );
  }

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true })
      .run();
    setTablePickerOpen(false);
  };

  const toolbarBtn = (active: boolean) =>
    active
      ? "bg-[#3B82F6] text-white shadow-sm shadow-blue-500/10"
      : "hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400";

  return (
    <div className="flex flex-col gap-3 w-full border border-slate-250/60 dark:border-white/5 rounded-2xl bg-slate-50/30 dark:bg-neutral-950/20">
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/80 dark:bg-neutral-900/60 border-b border-slate-200/50 dark:border-white/5 backdrop-blur-md relative z-20">
        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${toolbarBtn(editor.isActive("bold"))}`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${toolbarBtn(editor.isActive("italic"))}`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${toolbarBtn(editor.isActive("heading", { level: 1 }))}`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${toolbarBtn(editor.isActive("heading", { level: 2 }))}`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${toolbarBtn(editor.isActive("bulletList"))}`}
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        <div className="relative" ref={tablePickerRef}>
          <button
            type="button"
            onMouseDown={keepEditorFocus}
            onClick={() => setTablePickerOpen((open) => !open)}
            className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${toolbarBtn(tablePickerOpen)}`}
            style={{ minHeight: "40px", minWidth: "40px" }}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4 stroke-[2]" />
          </button>

          {tablePickerOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-50 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-3 min-w-[180px]"
              onMouseDown={keepEditorFocus}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Table Size</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 w-12">Rows</label>
                <button
                  type="button"
                  onMouseDown={keepEditorFocus}
                  onClick={() => setTableRows((r) => Math.max(1, r - 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-mono w-6 text-center">{tableRows}</span>
                <button
                  type="button"
                  onMouseDown={keepEditorFocus}
                  onClick={() => setTableRows((r) => Math.min(20, r + 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 w-12">Cols</label>
                <button
                  type="button"
                  onMouseDown={keepEditorFocus}
                  onClick={() => setTableCols((c) => Math.max(1, c - 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-mono w-6 text-center">{tableCols}</span>
                <button
                  type="button"
                  onMouseDown={keepEditorFocus}
                  onClick={() => setTableCols((c) => Math.min(10, c + 1))}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onMouseDown={keepEditorFocus}
                onClick={insertTable}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Insert {tableRows}×{tableCols} Table
              </button>
            </div>
          )}
        </div>

        {isInTable && (
          <>
            <div className="w-[1px] h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />
            <button
              type="button"
              onMouseDown={keepEditorFocus}
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              style={{ minHeight: "40px", minWidth: "40px" }}
              title="Add row above"
            >
              <Rows3 className="w-4 h-4" />
              <Plus className="w-2.5 h-2.5 -ml-1" />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorFocus}
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              style={{ minHeight: "40px", minWidth: "40px" }}
              title="Add row below"
            >
              <Plus className="w-2.5 h-2.5" />
              <Rows3 className="w-4 h-4 -ml-1" />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorFocus}
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
              className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-500 transition-colors cursor-pointer flex items-center justify-center"
              style={{ minHeight: "40px", minWidth: "40px" }}
              title="Delete row"
            >
              <Minus className="w-3.5 h-3.5" />
              <Rows3 className="w-4 h-4 -ml-1" />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorFocus}
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              style={{ minHeight: "40px", minWidth: "40px" }}
              title="Add column left"
            >
              <Columns3 className="w-4 h-4" />
              <Plus className="w-2.5 h-2.5 -ml-1" />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorFocus}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              style={{ minHeight: "40px", minWidth: "40px" }}
              title="Add column right"
            >
              <Plus className="w-2.5 h-2.5" />
              <Columns3 className="w-4 h-4 -ml-1" />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorFocus}
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
              className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-500 transition-colors cursor-pointer flex items-center justify-center"
              style={{ minHeight: "40px", minWidth: "40px" }}
              title="Delete column"
            >
              <Minus className="w-3.5 h-3.5" />
              <Columns3 className="w-4 h-4 -ml-1" />
            </button>
            <button
              type="button"
              onMouseDown={keepEditorFocus}
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-500 transition-colors cursor-pointer flex items-center justify-center"
              style={{ minHeight: "40px", minWidth: "40px" }}
              title="Delete table"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 dark:text-slate-450 transition-colors cursor-pointer flex items-center justify-center ml-auto"
          style={{ minHeight: "40px", minWidth: "40px" }}
          title="Clear Formatting"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed }) => ed.isActive("table")}
          className="flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-lg"
        >
          <button
            type="button"
            onMouseDown={keepEditorFocus}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="px-2 py-1 text-[10px] font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            + Row
          </button>
          <button
            type="button"
            onMouseDown={keepEditorFocus}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="px-2 py-1 text-[10px] font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            + Col
          </button>
          <button
            type="button"
            onMouseDown={keepEditorFocus}
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="px-2 py-1 text-[10px] font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 cursor-pointer"
          >
            − Row
          </button>
          <button
            type="button"
            onMouseDown={keepEditorFocus}
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="px-2 py-1 text-[10px] font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 cursor-pointer"
          >
            − Col
          </button>
        </BubbleMenu>
      )}

      <div className="w-full bg-white dark:bg-black/45 overflow-x-auto overflow-y-auto max-h-[calc(1.625*1rem*20+2rem)] rounded-b-2xl">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
