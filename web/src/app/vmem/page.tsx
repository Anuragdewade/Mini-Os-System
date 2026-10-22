"use client";
import { useState, useMemo } from "react";
import { runFIFO, runLRU, runOptimal, runClock, sampleRefs } from "@/lib/vmem";
import { ReplacementResult } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { FileText, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

// ── Visual-only constants ─────────────────────────────────────
const PAGE_COLORS = [
  "#6366f1","#3b6ef8","#16a34a","#ea580c","#d97706","#0284c7","#dc2626",
  "#f97316","#a855f7","#84cc16","#ec4899","#14b8a6",
];

function RefStringViz({ refs }: { refs: number[] }) {
  return (
    <div className="flex flex-wrap gap-1 py-2">
      {refs.map((r, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold text-white shadow-sm"
          style={{ backgroundColor: PAGE_COLORS[r % PAGE_COLORS.length] }}
          title={`Step ${i + 1}: page ${r}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

function PageTable({ result }: { result: ReplacementResult }) {
  const first     = result.frameSnapshots[0];
  const numFrames = first?.frames.length || 0;
  const label     = first?.structureLabel || "";

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="text-xs w-full">
        <thead className="bg-muted sticky top-0">
          <tr>
            <th className="px-2 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wide">Step</th>
            <th className="px-2 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wide">Ref</th>
            {Array.from({ length: numFrames }, (_, i) => (
              <th key={i} className="px-2 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wide">F{i}</th>
            ))}
            <th className="px-2 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wide">Fault?</th>
            <th className="px-2 py-2.5 text-center text-muted-foreground font-semibold uppercase tracking-wide">Victim</th>
            <th className="px-2 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wide">{label}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {result.frameSnapshots.map((snap, i) => (
            <tr
              key={i}
              className={snap.fault
                ? "bg-vm-fault-subtle border-l-2 border-l-vm-fault"
                : "hover:bg-muted/40 transition-colors"}
            >
              <td className="px-2 py-2 font-mono text-muted-foreground">{i + 1}</td>
              <td className="px-2 py-2 font-mono font-bold">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md text-white text-[10px] font-bold"
                  style={{ backgroundColor: PAGE_COLORS[snap.ref % PAGE_COLORS.length] }}
                >
                  {snap.ref}
                </span>
              </td>
              {snap.frames.map((f, j) => (
                <td
                  key={j}
                  className={`px-2 py-2 text-center font-mono
                    ${snap.victim !== undefined && f === snap.ref && snap.fault ? "text-primary font-bold" : ""}`}
                >
                  {f < 0 ? <span className="text-muted-foreground">—</span> : f}
                </td>
              ))}
              <td className="px-2 py-2 text-center">
                {snap.fault
                  ? <Badge variant="fault">FAULT</Badge>
                  : <Badge variant="hit">HIT</Badge>}
              </td>
              <td className="px-2 py-2 text-center font-mono">
                {snap.victim !== undefined
                  ? <span className="text-vm-fault">{snap.victim}</span>
                  : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-2 py-2 font-mono text-muted-foreground whitespace-nowrap">{snap.structure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── LOGIC — DO NOT MODIFY ────────────────────────────────────
export default function VmemPage() {
  const [refStr, setRefStr]     = useState(sampleRefs.join(","));
  const [numFrames, setNumFrames] = useState(3);
  const [tab, setTab]           = useState<number | string>(0);

  const refs = useMemo(
    () => refStr.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
    [refStr]
  );

  const results = useMemo<ReplacementResult[]>(() => {
    if (refs.length === 0 || numFrames < 1) return [];
    return [runFIFO(refs, numFrames), runLRU(refs, numFrames), runOptimal(refs, numFrames), runClock(refs, numFrames)];
  }, [refs, numFrames]);

  const algoNames = ["FIFO", "LRU", "Optimal", "Clock"];
  const chartData = results.map((r, i) => ({ name: algoNames[i], "Page Faults": r.pageFaults, Hits: r.hits }));
  // ── END LOGIC ────────────────────────────────────────────

  const allTabs = [
    ...algoNames.map((n, i) => ({ id: i, label: n })),
    { id: 4, label: "Compare" },
  ];
  const tabIdx = typeof tab === "number" ? tab : 0;
  const currentResult = tabIdx < 4 ? results[tabIdx] : null;

  return (
    <div className="module-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={20} className="text-primary" />
          <h1 className="text-2xl font-bold">Virtual Memory Simulator</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Simulate FIFO, LRU, Optimal, and Clock page replacement algorithms with step-by-step frame tables.
        </p>
      </div>

      {/* Controls */}
      <div className="section-card">
        <h2 className="text-sm font-semibold mb-4">Configuration</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="text-xs font-medium text-muted-foreground">Reference string (comma-separated)</span>
            <input
              value={refStr}
              onChange={e => setRefStr(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 1,2,3,4,1,2,5,1,2,3"
              aria-label="Page reference string"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Frames</span>
            <input
              type="number" min={1} max={10} value={numFrames}
              onChange={e => setNumFrames(+e.target.value)}
              className="w-20 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <Button onClick={() => setRefStr(sampleRefs.join(","))} variant="secondary" size="md">
            <RefreshCw size={14} />
            Sample
          </Button>
        </div>

        {/* Reference string visualization */}
        {refs.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Reference sequence ({refs.length} pages):</p>
            <div className="overflow-x-auto pb-1">
              <RefStringViz refs={refs} />
            </div>
          </div>
        )}
      </div>

      {refs.length === 0 && (
        <EmptyState
          icon={<FileText size={32} />}
          title="Enter a reference string"
          description="Type comma-separated page numbers above, or click Sample for a pre-loaded example."
          variant="dashed"
        />
      )}

      {results.length > 0 && (
        <div className="section-card p-0 overflow-hidden">
          <Tabs tabs={allTabs} active={tab} onChange={setTab} className="px-2 pt-2" />

          <div className="p-5 space-y-5">
            {/* Per-algorithm view */}
            {currentResult && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Page Faults"
                    value={currentResult.pageFaults}
                    icon={<AlertCircle size={14} />}
                    accentColor="var(--vm-fault)"
                  />
                  <MetricCard
                    label="Hits"
                    value={currentResult.hits}
                    icon={<CheckCircle size={14} />}
                    accentColor="var(--vm-hit)"
                  />
                  <MetricCard
                    label="Fault Rate"
                    value={((currentResult.pageFaults / currentResult.totalRefs) * 100).toFixed(1) + "%"}
                    accentColor="#6366f1"
                    warn={currentResult.pageFaults / currentResult.totalRefs > 0.5}
                  />
                </div>
                <PageTable result={currentResult} />
              </>
            )}

            {/* Compare tab */}
            {tab === 4 && (
              <div className="space-y-5">
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {["Algorithm", "Page Faults", "Hits", "Fault Rate"].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.map((r, i) => (
                        <tr key={i} className="hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-2.5 font-semibold">{r.algorithm}</td>
                          <td className="px-3 py-2.5 font-mono text-vm-fault">{r.pageFaults}</td>
                          <td className="px-3 py-2.5 font-mono text-vm-hit">{r.hits}</td>
                          <td className="px-3 py-2.5 font-mono">
                            {((r.pageFaults / r.totalRefs) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} allowDecimals={false} />
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
                    <Bar dataKey="Page Faults" fill="var(--vm-fault)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Hits"        fill="var(--vm-hit)"   radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
