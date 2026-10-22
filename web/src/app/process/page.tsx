"use client";
import { useState, Fragment } from "react";
import { ProcessControlBlock, ProcessState, LogEntry } from "@/lib/types";
import { createProcess, makeThread, transitionProcess, nextPid, nextTid } from "@/lib/process";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cpu, Plus, Trash2, ChevronDown, ChevronRight, Clock } from "lucide-react";

// ── Visual-only constants (safe to edit) ──────────────────────
const STATE_BADGE: Record<ProcessState, "new" | "ready" | "running" | "waiting" | "terminated"> = {
  [ProcessState.NEW]:        "new",
  [ProcessState.READY]:      "ready",
  [ProcessState.RUNNING]:    "running",
  [ProcessState.WAITING]:    "waiting",
  [ProcessState.TERMINATED]: "terminated",
};

// ── LOGIC — DO NOT MODIFY BELOW THIS LINE ─────────────────────
const VALID_TRANSITIONS: Record<ProcessState, ProcessState[]> = {
  [ProcessState.NEW]:        [ProcessState.READY],
  [ProcessState.READY]:      [ProcessState.RUNNING],
  [ProcessState.RUNNING]:    [ProcessState.READY, ProcessState.WAITING, ProcessState.TERMINATED],
  [ProcessState.WAITING]:    [ProcessState.READY],
  [ProcessState.TERMINATED]: [],
};

export default function ProcessPage() {
  const [procs, setProcs]         = useState<ProcessControlBlock[]>([]);
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [form, setForm]           = useState({ burst: 10, priority: 1, arrival: 0, memory: 256 });
  const [threadBurst, setThreadBurst] = useState(5);
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());

  const log = (tag: string, message: string) => {
    setLogs(prev => [{ time: Date.now(), tag, message }, ...prev].slice(0, 100));
  };

  const handleCreate = () => {
    const pid = nextPid(procs);
    const p = createProcess(pid, form.burst, form.priority, form.arrival, form.memory);
    setProcs(prev => [...prev, p]);
    log(`P${pid}`, `Created (burst=${form.burst}, pri=${form.priority}, arr=${form.arrival}, mem=${form.memory})`);
  };

  const handleTransition = (pid: number, target: ProcessState) => {
    setProcs(prev => {
      const next = prev.map(p => p.pid === pid ? { ...p, threads: p.threads.map(t => ({ ...t })) } : p);
      const proc = next.find(p => p.pid === pid);
      if (!proc) return prev;
      const msg = transitionProcess(proc, target);
      if (!msg) return prev;
      return next;
    });
    log(`P${pid}`, `${procs.find(p => p.pid === pid)?.state} → ${target}`);
  };

  const handleAddThread = (pid: number) => {
    const proc = procs.find(p => p.pid === pid);
    if (!proc) return;
    const used = proc.threads.reduce((s, t) => s + t.remainingBurst, 0);
    const remaining = proc.burstTime - used;
    if (remaining <= 0) {
      log(`P${pid}`, `Cannot add thread: process burst budget exhausted (${proc.burstTime} total, ${used} already in threads).`);
      return;
    }
    const burst = Math.min(threadBurst, remaining);
    if (burst < threadBurst) {
      log(`P${pid}`, `Thread burst capped to ${burst} (remaining process budget).`);
    }
    const tid = nextTid(procs);
    setProcs(prev => prev.map(p => {
      if (p.pid !== pid) return p;
      return { ...p, threads: [...p.threads, makeThread(tid, burst)] };
    }));
    log(`P${pid}`, `Thread T${tid} added (burst=${burst}, remaining budget: ${remaining - burst})`);
  };

  const handleClear = () => { setProcs([]); setLogs([]); };

  const toggleExpand = (pid: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };
  // ── END LOGIC ──────────────────────────────────────────────

  const running  = procs.filter(p => p.state === ProcessState.RUNNING).length;
  const waiting  = procs.filter(p => p.state === ProcessState.WAITING).length;
  const ready    = procs.filter(p => p.state === ProcessState.READY).length;

  return (
    <div className="module-page">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Cpu size={20} className="text-primary" />
          <h1 className="text-2xl font-bold">Process &amp; Thread Simulator</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Create processes, manage state transitions, and add threads with burst-budget tracking.
        </p>
      </div>

      {/* Controls card */}
      <div className="section-card">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold">Create Process</h2>
          <span className="text-xs text-muted-foreground">Fill parameters, then click Create</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {(
            [
              ["Burst (ms)", "burst", 1, "CPU burst time"],
              ["Priority",   "priority", 0, "Lower = higher priority"],
              ["Arrival (ms)","arrival",  0, "Arrival time at ready queue"],
              ["Memory (KB)", "memory",   1, "Memory requirement in KB"],
            ] as const
          ).map(([label, key, min, hint]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <input
                type="number"
                min={min}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: +e.target.value })}
                title={hint}
                className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </label>
          ))}
          <div className="flex gap-2 items-end pb-0">
            <Button onClick={handleCreate} variant="primary" size="md">
              <Plus size={14} />
              Create Process
            </Button>
            <Button onClick={handleClear} variant="destructive" size="md" title="Remove all processes and clear log">
              <Trash2 size={14} />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics row (only when processes exist) */}
      {procs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Processes" value={procs.length} accentColor="#6366f1" />
          <MetricCard label="Running"  value={running}  accentColor="var(--state-running)"  />
          <MetricCard label="Ready"    value={ready}    accentColor="var(--state-ready)"    />
          <MetricCard label="Waiting"  value={waiting}  accentColor="var(--state-waiting)"  />
        </div>
      )}

      {/* Process Table */}
      <div className="section-card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Process Table</h2>
          <span className="text-xs text-muted-foreground">{procs.length} process{procs.length !== 1 ? "es" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["", "PID", "State", "Burst", "Priority", "Arrival", "Memory (KB)", "Threads", "Transitions"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {procs.map(p => (
                <Fragment key={p.pid}>
                  <tr className="hover:bg-muted/40 transition-colors">
                    {/* Expand toggle */}
                    <td className="px-3 py-2.5 w-8">
                      {p.threads.length > 0 && (
                        <button
                          onClick={() => toggleExpand(p.pid)}
                          aria-label={expanded.has(p.pid) ? "Collapse threads" : "Expand threads"}
                          aria-expanded={expanded.has(p.pid)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expanded.has(p.pid)
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />
                          }
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-foreground">P{p.pid}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={STATE_BADGE[p.state]}>{p.state}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono">{p.burstTime}</td>
                    <td className="px-3 py-2.5 font-mono">{p.priority}</td>
                    <td className="px-3 py-2.5 font-mono">{p.arrivalTime}</td>
                    <td className="px-3 py-2.5 font-mono">{p.memoryRequirement}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono">{p.threads.length}</span>
                      <span className="text-muted-foreground text-xs ml-1">
                        ({p.burstTime - p.threads.reduce((s, t) => s + t.remainingBurst, 0)} left)
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {VALID_TRANSITIONS[p.state].map(t => {
                          const stateColor =
                            t === ProcessState.READY
                              ? "hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10"
                              : t === ProcessState.RUNNING
                              ? "hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10"
                              : t === ProcessState.WAITING
                              ? "hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10"
                              : "hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10";
                          return (
                            <button
                              key={t}
                              onClick={() => handleTransition(p.pid, t)}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-border",
                                "transition-all duration-150 active:scale-95 cursor-pointer",
                                stateColor
                              )}
                              title={`Transition to ${t}`}
                            >
                              →{t}
                            </button>
                          );
                        })}
                        {/* Add thread inline */}
                        <span className="inline-flex items-center gap-1.5 border-l border-border pl-2 ml-0.5">
                          <input
                            type="number"
                            min={1}
                            value={threadBurst}
                            onChange={e => setThreadBurst(+e.target.value)}
                            title="Thread burst time (ms)"
                            className="w-12 px-1.5 py-0.5 rounded border border-border bg-background text-xs text-center
                                       focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                          <span className="text-[10px] text-muted-foreground font-mono">ms</span>
                          <button
                            onClick={() => handleAddThread(p.pid)}
                            className="px-2 py-0.5 rounded text-xs font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                            title="Add thread to this process"
                          >
                            +Thread
                          </button>
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Thread sub-rows */}
                  {expanded.has(p.pid) && p.threads.map(t => (
                    <tr key={`${p.pid}-${t.tid}`} className="bg-muted/30 border-l-2 border-l-primary/30">
                      <td className="px-3 py-1.5 w-8" />
                      <td className="px-3 py-1.5 pl-6 font-mono text-xs text-muted-foreground">
                        └ T{t.tid}
                      </td>
                      <td className="px-3 py-1.5">
                        <Badge variant={STATE_BADGE[t.state]} className="text-[10px]">{t.state}</Badge>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground" colSpan={6}>
                        burst: {t.remainingBurst} ms
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}

              {procs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-2">
                    <EmptyState
                      icon={<Cpu size={32} />}
                      title="No processes yet"
                      description="Fill in the burst, priority, arrival, and memory fields above, then click Create Process."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Log */}
      <div className="section-card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Event Log</h2>
          <span className="text-xs text-muted-foreground ml-auto">{logs.length} events</span>
        </div>
        <div className="terminal-panel h-48 p-3 space-y-0.5">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-muted-foreground shrink-0 tabular-nums">
                [{new Date(l.time).toLocaleTimeString()}]
              </span>
              <span className="text-primary font-semibold shrink-0">[{l.tag}]</span>
              <span className="text-slate-300">{l.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-muted-foreground text-xs py-2">No events yet. Create a process to begin.</div>
          )}
        </div>
      </div>
    </div>
  );
}
