"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MiniFS, FsEntry } from "@/lib/filesystem";
import { analyzeIO, resolvePosition, OPERATIONS, IOResult, Operation, AnalysisConfig, DEFAULT_CONFIG } from "@/lib/fs-io-cost";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { File, Folder, FolderOpen, Terminal, BarChart2, ChevronDown, ChevronRight } from "lucide-react";

// ── File tree (presentation only) ───────────────────────────
function FileTree({ entry, depth = 0 }: { entry: FsEntry; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);

  if (!entry.isDir) {
    return (
      <div
        className="flex items-center gap-1.5 py-0.5 text-xs rounded px-1 hover:bg-white/5 transition-colors"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <File size={12} className="text-blue-400 shrink-0" />
        <span className="text-slate-300">{entry.name}</span>
        <span className="text-slate-500 ml-auto">{entry.size}B</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-white/5 transition-colors text-left"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        {open
          ? <FolderOpen size={12} className="text-yellow-400 shrink-0" />
          : <Folder     size={12} className="text-yellow-400 shrink-0" />}
        <span className="text-slate-200 text-xs font-medium">{entry.name}/</span>
        <span className="ml-auto">{open ? <ChevronDown size={10} className="text-slate-500" /> : <ChevronRight size={10} className="text-slate-500" />}</span>
      </button>
      {open && Array.from(entry.children.values()).map(c => (
        <FileTree key={c.name} entry={c} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Strategy colors ──────────────────────────────────────────
const STRATEGY_COLORS: Record<string, string> = {
  contiguous: "var(--strategy-contiguous)",
  linked:     "var(--strategy-linked)",
  indexed:    "var(--strategy-indexed)",
};
const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  contiguous: "Blocks are stored in consecutive disk locations. Fast sequential access but expensive insertions/removals due to block shifting.",
  linked:     "Each block contains a pointer to the next block. No shifting needed, but traversal is required to reach a position.",
  indexed:    "An index block holds pointers to all data blocks. Constant-time access to any position via the index.",
};

// ── IO Analyzer Tab ──────────────────────────────────────────
function IOAnalyzerTab() {
  // ── LOGIC — DO NOT MODIFY ────────────────────────────────
  const [n, setN]           = useState(100);
  const [pos, setPos]       = useState(50);
  const [cfg, setCfg]       = useState<AnalysisConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<IOResult[] | null>(null);
  const [activeOp, setActiveOp] = useState<Operation | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const run = (op: Operation) => {
    const resolved = resolvePosition(n, op, pos);
    setResults(analyzeIO(n, resolved, op, cfg));
    setActiveOp(op);
    setExpanded({});
  };

  const chartData = results
    ? results.map(r => ({ name: r.strategyLabel, Reads: r.reads, Writes: r.writes, Total: r.total }))
    : [];

  const opLabel = activeOp ? OPERATIONS.find(o => o.id === activeOp)?.label : null;
  // ── END LOGIC ────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Config card */}
      <div className="section-card space-y-4">
        <h3 className="text-sm font-semibold">Configuration</h3>
        <div className="flex flex-wrap gap-5 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">File size (blocks)</span>
            <input
              type="number" min={1} max={1000} value={n}
              onChange={e => setN(Math.max(1, +e.target.value))}
              className="w-28 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Position (0-based, for middle ops)</span>
            <input
              type="number" min={0} max={n - 1} value={pos}
              onChange={e => setPos(Math.max(0, +e.target.value))}
              className="w-28 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={cfg.linkedHasTailPointer}
            onChange={e => setCfg(prev => ({ ...prev, linkedHasTailPointer: e.target.checked }))}
            className="accent-primary w-4 h-4 rounded"
          />
          <span className="text-sm">
            Linked list has tail pointer
            <span className="text-xs text-muted-foreground ml-1.5">(affects Insert at End cost)</span>
          </span>
        </label>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Operations</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OPERATIONS.map(op => (
              <button
                key={op.id}
                onClick={() => run(op.id)}
                className={`text-sm px-3 py-2.5 rounded-xl border font-medium transition-all duration-150 text-left
                  ${activeOp === op.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground text-[13px] mb-1">Assumptions</p>
        <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
          <li>The FCB (File Control Block) is already in memory — FCB reads/writes cost 0 disk I/O</li>
          <li>For indexed allocation the index block is already in memory — 0 extra disk I/O</li>
          <li>Only actual disk block reads and writes are counted</li>
          <li>Contiguous: required free space exists; blocks must shift for begin/middle operations</li>
          <li>Linked: traversal requires reading each block; pointer updates require writing the block</li>
        </ul>
      </div>

      {/* Empty state */}
      {!results && (
        <EmptyState
          icon={<BarChart2 size={32} />}
          title="Select an operation"
          description="Choose one of the operations above to compare I/O costs across Contiguous, Linked, and Indexed allocation strategies."
          variant="dashed"
        />
      )}

      {/* Results */}
      {results && activeOp && (
        <>
          {/* Results table */}
          <div className="section-card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-semibold text-sm">
                Results: {opLabel}
                <span className="font-normal text-muted-foreground ml-2 text-xs">
                  (n={n}, pos={resolvePosition(n, activeOp, pos)})
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Strategy", "Reads", "Writes", "Total I/O"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map(r => (
                    <tr key={r.strategy} className="hover:bg-muted/40 transition-colors border-l-4"
                      style={{ borderLeftColor: STRATEGY_COLORS[r.strategy] }}>
                      <td className="px-4 py-3 flex items-center gap-2 font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STRATEGY_COLORS[r.strategy] }} />
                        {r.strategyLabel}
                      </td>
                      <td className="px-4 py-3 font-mono">{r.reads}</td>
                      <td className="px-4 py-3 font-mono">{r.writes}</td>
                      <td className="px-4 py-3 font-mono font-bold">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar chart */}
          <div className="section-card">
            <h3 className="font-semibold text-sm mb-4">I/O Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Reads"  stackId="a" fill={STRATEGY_COLORS.linked}     radius={[0, 0, 0, 0]} />
                <Bar dataKey="Writes" stackId="a" fill={STRATEGY_COLORS.contiguous} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Step-by-step accordion */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Step-by-Step Explanations</h3>
            {results.map(r => {
              const isOpen = expanded[r.strategy] ?? false; // default closed
              return (
                <div key={r.strategy} className="rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [r.strategy]: !isOpen }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STRATEGY_COLORS[r.strategy] }} />
                      <span className="font-medium">{r.strategyLabel}</span>
                      <span className="text-muted-foreground">— {r.total} total I/O</span>
                    </div>
                    {isOpen
                      ? <ChevronDown  size={14} className="text-muted-foreground" />
                      : <ChevronRight size={14} className="text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 py-3 bg-muted/20 border-t border-border space-y-2 animate-fade-in">
                      <p className="text-xs text-muted-foreground italic">{STRATEGY_DESCRIPTIONS[r.strategy]}</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {r.steps.map((s, i) => (
                          <li key={i} className="text-xs text-slate-300 leading-relaxed">{s}</li>
                        ))}
                      </ol>
                      <div className="text-xs font-mono text-right text-muted-foreground pt-1">
                        Reads: {r.reads} | Writes: {r.writes} | Total: {r.total}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function FilesystemPage() {
  // ── LOGIC — DO NOT MODIFY ────────────────────────────────
  const [tab, setTab]       = useState<"terminal" | "analyzer">("terminal");
  const [fs]                = useState(() => new MiniFS());
  const [input, setInput]   = useState("");
  const [history, setHistory] = useState<{ cmd: string; output: string }[]>([
    { cmd: "", output: "Mini File System v1.0 — Type 'help' for commands." }
  ]);
  const [, setTick]         = useState(0);
  const endRef              = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const output = fs.exec(input.trim());
    setHistory(prev => [...prev, { cmd: input, output }]);
    setInput("");
    forceUpdate();
  };
  // ── END LOGIC ────────────────────────────────────────────

  return (
    <div className="module-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen size={20} className="text-primary" />
          <h1 className="text-2xl font-bold">Mini File System</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          FAT-based virtual disk with a shell interface. Analyze Block I/O costs across allocation strategies.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "terminal", label: (
            <span className="flex items-center gap-1.5">
              <Terminal size={13} />
              Terminal
            </span>
          )},
          { id: "analyzer", label: (
            <span className="flex items-center gap-1.5">
              <BarChart2 size={13} />
              Block I/O Analyzer
            </span>
          )},
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {/* Terminal view */}
      {tab === "terminal" && (
        <div className="grid md:grid-cols-[1fr_240px] gap-4">
          {/* Terminal */}
          <div className="rounded-xl bg-log-bg border border-log-border flex flex-col h-[500px] overflow-hidden">
            {/* Terminal chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-log-border">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs text-slate-500 font-mono">minifs — {fs.getPath()}</span>
            </div>
            {/* Output */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
              {history.map((h, i) => (
                <div key={i}>
                  {h.cmd && (
                    <div>
                      <span className="text-green-400">minifs:{fs.getPath()}$</span>{" "}
                      <span className="text-white">{h.cmd}</span>
                    </div>
                  )}
                  {h.output.split("\n").map((line, j) => (
                    <div key={j} className="text-slate-300 whitespace-pre">{line}</div>
                  ))}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-log-border px-3 py-2 flex gap-2 items-center">
              <span className="text-green-400 text-xs font-mono shrink-0">$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-white text-xs font-mono outline-none placeholder:text-slate-600"
                placeholder="Type a command…"
                aria-label="Shell command input"
              />
            </form>
          </div>

          {/* File browser */}
          <div className="rounded-xl bg-log-bg border border-log-border flex flex-col h-[500px] overflow-hidden">
            <div className="px-3 py-2.5 border-b border-log-border">
              <p className="text-xs font-semibold text-slate-400">File Browser</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <FileTree entry={fs.root} />
            </div>
          </div>
        </div>
      )}

      {/* Commands hint */}
      {tab === "terminal" && (
        <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground">
          <span className="font-semibold">Commands:</span>{" "}
          ls, mkdir &lt;name&gt;, cd &lt;dir&gt;, create &lt;name&gt;, write &lt;file&gt; &lt;content&gt;, cat &lt;file&gt;, rm &lt;name&gt;, rename &lt;old&gt; &lt;new&gt;, pwd, format, help
        </div>
      )}

      {/* IO Analyzer */}
      {tab === "analyzer" && <IOAnalyzerTab />}
    </div>
  );
}
