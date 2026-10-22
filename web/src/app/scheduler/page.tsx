"use client";
import { useState, useMemo } from "react";
import { ProcessControlBlock, ScheduleResult, createPCB } from "@/lib/types";
import { runFCFS, runSJF, runRoundRobin, runPriority, runMLFQ, sampleWorkload } from "@/lib/scheduler";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import {
  BarChart2, Plus, Trash2, RefreshCw,
  Clock, Timer, Activity, Cpu, Zap,
} from "lucide-react";

// ── Visual-only constants ────────────────────────────────────
const ALGO_NAMES = ["FCFS", "SJF", "Round Robin", "Priority", "MLFQ"];
const COLORS = ["#6366f1","#3b6ef8","#16a34a","#ea580c","#d97706","#0284c7","#dc2626","#f97316"];

const METRIC_ICONS = [
  <Clock key="w" size={14} />,
  <Timer key="t" size={14} />,
  <Activity key="r" size={14} />,
  <Cpu key="u" size={14} />,
  <Zap key="p" size={14} />,
];
const METRIC_COLORS = ["#6366f1", "#3b6ef8", "#16a34a", "#ea580c", "#d97706"];

function GanttChart({ gantt }: { gantt: { pid: number; duration: number }[] }) {
  const total = gantt.reduce((s, g) => s + g.duration, 0);
  if (total === 0) return null;
  let t = 0;
  return (
    <div>
      {/* Bars */}
      <div className="flex h-14 rounded-xl overflow-hidden border border-border">
        {gantt.map((g, i) => {
          const w = (g.duration / total) * 100;
          const s = t; t += g.duration;
          const isIdle = g.pid < 0;
          return (
            <div
              key={i}
              className="relative flex items-center justify-center text-xs font-mono text-white shrink-0"
              style={{
                width: `${w}%`,
                backgroundColor: isIdle ? "#475569" : COLORS[g.pid % COLORS.length],
                minWidth: g.duration > 0 ? 2 : 0,
              }}
              title={`${isIdle ? "Idle" : `P${g.pid}`}: t=${s}–${s + g.duration}`}
            >
              {w > 4 && (
                <span className="truncate px-1 drop-shadow">
                  {isIdle ? "—" : `P${g.pid}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Time ticks */}
      <div className="flex text-[10px] text-muted-foreground font-mono mt-1">
        {(() => {
          let acc = 0;
          return gantt.map((g, i) => {
            const left = acc; acc += g.duration;
            return (
              <span key={i} style={{ width: `${(g.duration / total) * 100}%` }} className="truncate">
                {left}
              </span>
            );
          });
        })()}
        <span>{total}</span>
      </div>
    </div>
  );
}

// ── LOGIC — DO NOT MODIFY ────────────────────────────────────
export default function SchedulerPage() {
  const [procs, setProcs]   = useState<ProcessControlBlock[]>(sampleWorkload);
  const [quantum, setQuantum] = useState(3);
  const [tab, setTab]       = useState<number | string>(0);
  const [form, setForm]     = useState({ burst: 5, priority: 1, arrival: 0 });

  const results = useMemo<ScheduleResult[]>(() => [
    runFCFS(procs), runSJF(procs), runRoundRobin(procs, quantum), runPriority(procs), runMLFQ(procs)
  ], [procs, quantum]);

  const addProcess = () => {
    const pid = procs.length > 0 ? Math.max(...procs.map(p => p.pid)) + 1 : 1;
    setProcs([...procs, createPCB(pid, form.burst, form.priority, form.arrival, 0)]);
  };

  const compareData = results.map(r => ({
    name: r.algorithmName.length > 10 ? r.algorithmName.slice(0, 10) + "…" : r.algorithmName,
    "Avg Wait": +r.avgWaitingTime.toFixed(2),
    "Avg TAT":  +r.avgTurnaroundTime.toFixed(2),
    "Avg Resp": +r.avgResponseTime.toFixed(2),
  }));
  // ── END LOGIC ────────────────────────────────────────────

  const allTabs = [...ALGO_NAMES.map((n, i) => ({ id: i, label: n })), { id: 5, label: "Compare All" }];
  const tabIdx = typeof tab === "number" ? tab : 0;
  const currentResult = tabIdx < 5 ? results[tabIdx] : null;

  return (
    <div className="module-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={20} className="text-primary" />
          <h1 className="text-2xl font-bold">CPU Scheduling Laboratory</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare FCFS, SJF, Round Robin, Priority, and MLFQ side-by-side with Gantt charts and metrics.
        </p>
      </div>

      {/* Controls */}
      <div className="section-card">
        <h2 className="text-sm font-semibold mb-4">Add Process</h2>
        <div className="flex flex-wrap gap-3 items-end">
          {(
            [
              ["Burst (ms)", "burst", 1],
              ["Priority",   "priority", 0],
              ["Arrival (ms)","arrival",  0],
            ] as const
          ).map(([label, key, min]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <input
                type="number"
                min={min}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: +e.target.value })}
                className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">RR Quantum (ms)</span>
            <input
              type="number"
              min={1}
              value={quantum}
              onChange={e => setQuantum(+e.target.value)}
              className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="flex gap-2 items-end pb-0">
            <Button onClick={addProcess} variant="primary" size="md">
              <Plus size={14} />
              Add Process
            </Button>
            <Button onClick={() => setProcs(sampleWorkload())} variant="secondary" size="md">
              <RefreshCw size={14} />
              Load Sample
            </Button>
            <Button onClick={() => setProcs([])} variant="destructive" size="md">
              <Trash2 size={14} />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Process table */}
      {procs.length > 0 && (
        <div className="section-card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Process Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {["PID", "Burst (ms)", "Priority", "Arrival (ms)", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {procs.map(p => (
                  <tr key={p.pid} className="hover:bg-muted/40 transition-colors">
                    <td className="px-3 py-2 font-mono font-bold">P{p.pid}</td>
                    <td className="px-3 py-2 font-mono">{p.burstTime}</td>
                    <td className="px-3 py-2 font-mono">{p.priority}</td>
                    <td className="px-3 py-2 font-mono">{p.arrivalTime}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setProcs(procs.filter(x => x.pid !== p.pid))}
                        className="inline-flex items-center gap-1 text-destructive text-xs hover:underline"
                        aria-label={`Remove process P${p.pid}`}
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {procs.length === 0 && (
        <EmptyState
          icon={<BarChart2 size={32} />}
          title="No processes"
          description="Add processes above or click Load Sample to use a pre-built workload."
        />
      )}

      {/* Algorithm tabs */}
      {procs.length > 0 && (
        <div className="section-card p-0 overflow-hidden">
          <Tabs tabs={allTabs} active={tab} onChange={setTab} className="px-2 pt-2" />

          <div className="p-5 space-y-5">
            {/* Per-algorithm view */}
            {currentResult && (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    ["Avg Wait",     currentResult.avgWaitingTime.toFixed(2) + " ms"],
                    ["Avg TAT",      currentResult.avgTurnaroundTime.toFixed(2) + " ms"],
                    ["Avg Response", currentResult.avgResponseTime.toFixed(2) + " ms"],
                    ["CPU Util.",    currentResult.cpuUtilization.toFixed(1) + "%"],
                    ["Throughput",   currentResult.throughput.toFixed(3)],
                  ].map(([l, v], i) => (
                    <MetricCard
                      key={l}
                      label={l}
                      value={v}
                      icon={METRIC_ICONS[i]}
                      accentColor={METRIC_COLORS[i]}
                    />
                  ))}
                </div>

                {/* Gantt chart */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Gantt Chart</h3>
                  <GanttChart gantt={currentResult.gantt} />
                </div>

                {/* Per-process results table */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Per-Process Results</h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {["PID", "Burst", "Arrival", "Start", "Completion", "Wait", "TAT", "Response"].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {currentResult.processes.map(p => (
                          <tr key={p.pid} className="hover:bg-muted/40 transition-colors">
                            <td className="px-3 py-2 font-mono font-bold">P{p.pid}</td>
                            <td className="px-3 py-2 font-mono">{p.burstTime}</td>
                            <td className="px-3 py-2 font-mono">{p.arrivalTime}</td>
                            <td className="px-3 py-2 font-mono">{p.startTime >= 0 ? p.startTime : "—"}</td>
                            <td className="px-3 py-2 font-mono">{p.completionTime}</td>
                            <td className="px-3 py-2 font-mono">{p.waitingTime}</td>
                            <td className="px-3 py-2 font-mono">{p.turnaroundTime}</td>
                            <td className="px-3 py-2 font-mono">{p.responseTime >= 0 ? p.responseTime : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Compare All */}
            {tab === 5 && (
              <div>
                <h3 className="text-sm font-semibold mb-4">Algorithm Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
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
                    <Bar dataKey="Avg Wait" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Avg TAT"  fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Avg Resp" fill="#d97706" radius={[4, 4, 0, 0]} />
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
