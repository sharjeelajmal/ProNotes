const fs = require('fs');

const path = 'src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state
content = content.replace(
  'const [sidebarFilter, setSidebarFilter] = React.useState<string>("all");',
  'const [sidebarFilter, setSidebarFilter] = React.useState<string>("all");\n  const [statusFilter, setStatusFilter] = React.useState<string>("All");'
);

// 2. Add filter logic
content = content.replace(
  '      } else if (sidebarFilter !== "all") {\n        baseNotes = baseNotes.filter(n => n.categoryId === sidebarFilter);\n      }\n    }',
  '      } else if (sidebarFilter !== "all") {\n        baseNotes = baseNotes.filter(n => n.categoryId === sidebarFilter);\n      }\n    }\n\n    if (syncInfo?.portal === "business" && statusFilter !== "All") {\n      baseNotes = baseNotes.filter(n => (n.status || "Pending") === statusFilter);\n    }'
);

// 3. Add header UI
content = content.replace(
  '          <div className="flex items-center gap-3 shrink-0">\n            {/* Search Bar matching image */}',
  `          <div className="flex items-center gap-3 shrink-0">\n            {syncInfo?.portal === 'business' && (\n              <div className="hidden md:flex bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl items-center text-xs font-semibold shadow-inner border border-slate-200/50 dark:border-white/5">\n                {['All', 'Pending', 'In Review', 'Done'].map(s => (\n                  <button\n                    key={s}\n                    onClick={() => setStatusFilter(s)}\n                    className={\`px-3 py-1.5 rounded-lg transition-all \${statusFilter === s ? 'bg-white dark:bg-[#334155] shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}\n                  >\n                    {s}\n                  </button>\n                ))}\n              </div>\n            )}\n            {/* Search Bar matching image */}`
);

// 4. Extract Note Card mapping block
const mapStartIdx = content.indexOf('                sortedNotes.map((note) => (\n                  <motion.div\n                    key={note.id}');
const mapEndIdx = content.indexOf('                  </motion.div>\n                ))\n              )}', mapStartIdx) + '                  </motion.div>\n                ))'.length;

const originalMapBlock = content.substring(mapStartIdx, mapEndIdx);

// Convert to renderNoteCard function
const renderNoteCardFn = `  const renderNoteCard = (note: Note) => (\n` + originalMapBlock.replace('                sortedNotes.map((note) => (\n', '').replace(/\n                \)\)$/, '') + `\n  );\n\n`;

// Insert renderNoteCard before `return (` which is around line 1200
const returnIdx = content.indexOf('  return (\n    <div className="h-screen bg-[#F8FAFC]');
content = content.substring(0, returnIdx) + renderNoteCardFn + content.substring(returnIdx);

// Now replace the old map block with grouped logic (since mapStartIdx shifted, we find it again)
const newMapStartIdx = content.indexOf('                sortedNotes.map((note) => (\n                  <motion.div\n                    key={note.id}');
const newMapEndIdx = content.indexOf('                  </motion.div>\n                ))', newMapStartIdx) + '                  </motion.div>\n                ))'.length;

const newRenderingLogic = `              ) : syncInfo?.portal === 'business' && statusFilter === 'All' ? (
                ['Pending', 'In Review', 'Done'].map(statusGroup => {
                  const groupNotes = sortedNotes.filter(n => (n.status || 'Pending') === statusGroup);
                  if (groupNotes.length === 0) return null;
                  return (
                    <motion.div layout key={statusGroup} className="col-span-full mb-2">
                      <div className="flex items-center gap-2 mb-3 mt-1 ml-1">
                        <div className={\`h-2 w-2 rounded-full \${statusGroup === 'Done' ? 'bg-emerald-500' : statusGroup === 'In Review' ? 'bg-amber-500' : 'bg-slate-400'}\`}></div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{statusGroup} ({groupNotes.length})</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        {groupNotes.map(renderNoteCard)}
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                sortedNotes.map(renderNoteCard)
              )`;

content = content.substring(0, newMapStartIdx) + newRenderingLogic + content.substring(newMapEndIdx);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refactored page.tsx');
