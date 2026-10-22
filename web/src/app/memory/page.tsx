"use client";
import { useState, useMemo } from "react";
import { MemoryBlock } from "@/lib/types";
import {
  createMemory, allocateFirstFit, allocateBestFit, allocateWorstFit,
  deallocate, compact, externalFragmentation, totalFree,
  createFragmentedDemo, previewAllocation, AllocResult,
} from "@/lib/memory";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemoryStick, Layers, Trash2, RotateCcw, GitCompareArrows } from "lucide-react";

// ── Visual-only constants ─────────────────────────────────────
const COLORS = ["#6366f1","#3b6ef8","#16a34a","#ea580c","#d97706","#0284c7","#dc2626","#f97316","#a855f7","#84cc16"];
const TOTAL  = 1024;

const ALGO_LABELS: Record<string, string>    = { first: "First Fit", best: "Best Fit", worst: "Worst Fit" };
const ALGO_DESC: Record<string, string>      = {
  first: "Scans from address 0 and picks the FIRST hole that fits.",
  best:  "Picks the SMALLEST hole that fits (minimizes leftover).",
  worst: "Picks the LARGEST hole that fits (maximizes leftover).",
};
const HIGHLIGHT: Record<string, string> = { first: "#6366f1", best: "#16a34a", worst: "#dc2626" };

function MemoryMap({ blocks, total, highlightIdx, highlightColor }: {
  blocks: MemoryBlock[]; total: number; highlightIdx?: number; highlightColor?: string;
}) {
  return (
    <div className="memory-map-row">
      {blocks.map((b, i) => {
        const w  = (b.size / total) * 100;
        const isHighlighted = highlightIdx === i;
        const bg = b.pid >= 0
          ? COLORS[b.pid % COLORS.length]
          : isHighlighted ? (highlightColor || "#6366f1") : "#334155";
        return (
          <div
            key={i}
            className="relative flex items-center justify-center text-xs font-mono text-white transition-all duration-300 shrink-0"
            style={{
              width: `${w}%`,
              backgroundColor: bg,
              minWidth: 1,
              outline: isHighlighted ? `3px solid ${highlightColor || "#fff"}` : undefined,
              outlineOffset: isHighlighted ? "-3px" : undefined,
              zIndex: isHighlighted ? 10 : undefined,
            }}
            title={b.pid < 0 ? `Free: ${b.size}B @ ${b.start}` : `P${b.pid}: ${b.size}B @ ${b.start}`}
          >
            {w > 4 && (
              <span className="truncate px-0.5 drop-shadow">
                {b.pid < 0 ? `${b.size}` : `P${b.pid}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompareView({ blocks, size, total }: { blocks: MemoryBlock[]; size: number; total: number }) {
  const preview = useMemo(() => previewAllocation(blocks, size), [blocks, size]);
  const freeHoles = blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.pid === -1 && b.size >= size);

  if (!preview || freeHoles.length === 0) {
    return (
      <EmptyState
        icon={<Layers size={24} />}
        title={`No hole fits size ${size}`}
        description="Try a smaller size or deallocate some processes to create free holes."
      />
    );
  }

  const allSame = preview.first === preview.best && preview.best === preview.worst;

  return (
    <div className="space-y-5">
      {/* Free holes summary */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border text-sm">
        <p className="font-semibold mb-2">Free holes that fit {size}B:</p>
        <div className="flex flex-wrap gap-2">
          {freeHoles.map(({ b, i }) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-card border border-border font-mono text-xs">
              Hole #{i}: {b.size}B @ {b.start}
            </span>
          ))}
        </div>
        {allSame && freeHoles.length === 1 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Only one suitable hole — all algorithms will choose the same block. Deallocate processes to create multiple holes.
          </p>
        )}
      </div>

      {/* Per-algorithm comparison */}
      {(["first", "best", "worst"] as const).map(algo => {
        const idx   = preview[algo];
        const block = blocks[idx];
        return (
          <div key={algo} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: HIGHLIGHT[algo] }} />
              <span className="text-sm font-semibold">{ALGO_LABELS[algo]}</span>
              <span className="text-xs text-muted-foreground">— {ALGO_DESC[algo]}</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              → Hole #{idx} ({block.size}B @ {block.start}), leftover: {block.size - size}B
            </div>
            <MemoryMap blocks={blocks} total={total} highlightIdx={idx} highlightColor={HIGHLIGHT[algo]} />
          </div>
        );
      })}
    </div>
  );
}

// ── LOGIC — DO NOT MODIFY ────────────────────────────────────
export default function MemoryPage() {
  const [blocks, setBlocks]         = useState<MemoryBlock[]>(createMemory(TOTAL));
  const [algo, setAlgo]             = useState<"first" | "best" | "worst">("first");
  const [size, setSize]             = useState(100);
  const [pid, setPid]               = useState(1);
  const [log, setLog]               = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 80));

  const alloc = () => {
    const fn = algo === "first" ? allocateFirstFit : algo === "best" ? allocateBestFit : allocateWorstFit;
    const result: AllocResult | null = fn(blocks, pid, size);
    if (result) {
      setBlocks(result.blocks);
      addLog(`P${pid} (${size}B) → ${result.reason}`);
      setPid(pid + 1);
    } else {
      addLog(`Failed P${pid} (${size}B) — no hole >= ${size}`);
    }
  };

  const dealloc = (p: number) => {
    setBlocks(deallocate(blocks, p));
    addLog(`Freed P${p}`);
  };

  const doCompact = () => {
    setBlocks(compact(blocks));
    addLog("Compacted — all free space merged at end");
  };

  const loadDemo = () => {
    const demo = createFragmentedDemo(TOTAL);
    setBlocks(demo.blocks);
    setPid(demo.nextPid);
    setLog(["Demo loaded: P1(100), P2(200), P3(80), P4(60) allocated; 4 free holes of sizes 50, 150, 300, 84"]);
    setShowCompare(true);
  };

  const freeHoles = blocks.filter(b => b.pid === -1);
  // ── END LOGIC ────────────────────────────────────────────

  const allocated = blocks.filter(b => b.pid >= 0);

  return (
    <div className="module-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MemoryStick size={20} className="text-primary" />
          <h1 className="text-2xl font-bold">Memory Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Allocate memory with First Fit, Best Fit, or Worst Fit. Visualize fragmentation and compare strategies.
        </p>
      </div>

      {/* Controls */}
      <div className="section-card">
        <h2 className="text-sm font-semibold mb-4">Allocate Memory</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Size (bytes)</span>
            <input
              type="number" min={1} max={TOTAL} value={size}
              onChange={e => setSize(+e.target.value)}
              className="w-28 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Algorithm</span>
            <select
              value={algo}
              onChange={e => setAlgo(e.target.value as typeof algo)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="first">First Fit</option>
              <option value="best">Best Fit</option>
              <option value="worst">Worst Fit</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2 items-end pb-0">
            <Button onClick={alloc} variant="primary" size="md">
              <MemoryStick size={14} />
              Allocate P{pid}
            </Button>
            <Button onClick={doCompact} variant="secondary" size="md">
              <Layers size={14} />
              Compact
            </Button>
            <Button onClick={loadDemo} variant="secondary" size="md">
              Load Fragmented Demo
            </Button>
            <Button
              onClick={() => setShowCompare(!showCompare)}
              variant={showCompare ? "primary" : "outline"}
              size="md"
            >
              <GitCompareArrows size={14} />
              Compare All
            </Button>
            <Button
              onClick={() => { setBlocks(createMemory(TOTAL)); setPid(1); setLog([]); setShowCompare(false); }}
              variant="destructive"
              size="md"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Memory map */}
      <div className="section-card">
        <h2 className="text-sm font-semibold mb-3">Memory Map — {TOTAL}B total</h2>
        <MemoryMap blocks={blocks} total={TOTAL} />
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs mt-3">
          {allocated.map(b => (
            <span key={b.pid} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[b.pid % COLORS.length] }} />
              P{b.pid} ({b.size}B)
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#334155]" />
            Free
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Free"       value={`${totalFree(blocks)}B`}            accentColor="var(--success)" />
        <MetricCard label="Ext. Frag."       value={`${externalFragmentation(blocks)}B`} accentColor="var(--warning)" warn={externalFragmentation(blocks) > 0} />
        <MetricCard label="Free Holes"       value={freeHoles.length}                   accentColor="#6366f1" />
        <MetricCard label="Total Blocks"     value={blocks.length}                      accentColor="#0284c7" />
      </div>

      {/* Compare All */}
      {showCompare && (
        <div className="section-card border-primary/30 bg-primary/5">
          <h3 className="text-sm font-semibold mb-4">
            Algorithm Comparison — allocating {size}B
          </h3>
          <CompareView blocks={blocks} size={size} total={TOTAL} />
        </div>
      )}

      {/* Bottom: allocated list + log */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="section-card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Allocated Processes</h3>
          </div>
          <div className="divide-y divide-border max-h-52 overflow-y-auto">
            {allocated.map(b => (
              <div key={b.pid} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[b.pid % COLORS.length] }} />
                  <span className="font-mono text-sm">P{b.pid}</span>
                  <span className="text-xs text-muted-foreground">{b.size}B @ {b.start}</span>
                </div>
                <button
                  onClick={() => dealloc(b.pid)}
                  className="inline-flex items-center gap-1 text-destructive text-xs hover:underline"
                  aria-label={`Free process P${b.pid}`}
                >
                  <Trash2 size={12} />
                  Free
                </button>
              </div>
            ))}
            {allocated.length === 0 && (
              <p className="px-4 py-4 text-sm text-muted-foreground">No allocations</p>
            )}
          </div>
        </div>

        <div className="section-card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Log</h3>
          </div>
          <div className="terminal-panel h-52 p-3 space-y-0.5">
            {log.map((l, i) => <div key={i} className="text-slate-300 text-xs">{l}</div>)}
            {log.length === 0 && (
              <div className="text-slate-500 text-xs py-1">
                No events yet. Try &quot;Load Fragmented Demo&quot; to see algorithm differences.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How-to hint */}
      <div className="section-card bg-muted/20">
        <h3 className="text-sm font-semibold mb-2">How to compare algorithms</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Click <span className="font-medium text-foreground">Load Fragmented Demo</span> to create memory with multiple free holes.</li>
          <li>Click <span className="font-medium text-foreground">Compare All</span> to see which hole each algorithm picks.</li>
          <li>Change <span className="font-medium text-foreground">Size</span> and watch the algorithm choices change.</li>
          <li>Select an algorithm, allocate, then free processes to create new holes and compare again.</li>
        </ol>
      </div>
    </div>
  );
}
