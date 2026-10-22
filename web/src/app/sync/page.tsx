"use client";
import { useState, useRef, useCallback } from "react";
import { LogEntry } from "@/lib/types";
import { runProducerConsumer, runReadersWriters, runDiningPhilosophers, runSleepingBarber } from "@/lib/sync";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Lock, Play, Square } from "lucide-react";

// ── Visual-only constants ────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  System:   "text-blue-400",
  Producer: "text-emerald-400",
  Consumer: "text-yellow-400",
  Barber:   "text-purple-400",
};

function getTagColor(tag: string) {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  if (tag.startsWith("R")) return "text-cyan-400";
  if (tag.startsWith("W")) return "text-red-400";
  if (tag.startsWith("P")) return "text-orange-400";
  if (tag.startsWith("C")) return "text-pink-400";
  return "text-slate-400";
}

function msgClass(msg: string) {
  if (msg.includes("BLOCKED"))                         return "text-red-300";
  if (msg.includes("ACQUIRED"))                        return "text-emerald-300";
  if (msg.includes("RELEASED"))                        return "text-yellow-200";
  if (msg.includes("sem_signal"))                      return "text-sky-300";
  if (msg.includes("PASSED") || msg.includes("WOKE UP")) return "text-teal-300";
  return "text-slate-300";
}

const PRIMITIVES: Record<string, { primitives: string; desc: string }> = {
  pc: {
    primitives: "mutex (buffer access) + semaphore empty (tracks empty slots) + semaphore full (tracks filled slots)",
    desc: "Producer waits on empty, locks mutex, adds item, unlocks, signals full. Consumer waits on full, locks mutex, removes item, unlocks, signals empty.",
  },
  rw: {
    primitives: "rw_mutex (exclusive write access) + rc_mutex (protects reader_count variable)",
    desc: "First reader locks rw_mutex to block writers; last reader unlocks it. Writers always lock rw_mutex exclusively.",
  },
  dp: {
    primitives: "One mutex per fork (N forks total) + ordered locking (lower-numbered fork first) to prevent deadlock",
    desc: "Each philosopher acquires two fork mutexes in order, eats, then releases both. Ordered locking breaks the circular-wait condition.",
  },
  sb: {
    primitives: "seat_mutex (protects chair count) + semaphore customer_ready + semaphore barber_ready",
    desc: "Customer locks seat_mutex, sits if chair free, signals customer_ready. Barber waits on customer_ready, picks a customer, signals barber_ready.",
  },
};

const PROBLEMS = [
  { id: "pc", name: "Producer-Consumer" },
  { id: "rw", name: "Readers-Writers" },
  { id: "dp", name: "Dining Philosophers" },
  { id: "sb", name: "Sleeping Barber" },
] as const;

// ── LOGIC — DO NOT MODIFY ────────────────────────────────────
export default function SyncPage() {
  const [problem, setProblem] = useState<string>("pc");
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed]     = useState(2);
  const signalRef             = useRef({ stop: false });
  const logRef                = useRef<HTMLDivElement>(null);

  const [pcBuf, setPcBuf]           = useState(5);
  const [pcItems, setPcItems]       = useState(10);
  const [rwR, setRwR]               = useState(3);
  const [rwW, setRwW]               = useState(2);
  const [dpN, setDpN]               = useState(5);
  const [sbChairs, setSbChairs]     = useState(3);
  const [sbCustomers, setSbCustomers] = useState(8);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [...prev, entry]);
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
  }, []);

  const start = async () => {
    setLogs([]);
    setRunning(true);
    signalRef.current = { stop: false };
    try {
      switch (problem) {
        case "pc": await runProducerConsumer(addLog, pcBuf, pcItems, speed, signalRef.current); break;
        case "rw": await runReadersWriters(addLog, rwR, rwW, speed, signalRef.current); break;
        case "dp": await runDiningPhilosophers(addLog, dpN, speed, signalRef.current); break;
        case "sb": await runSleepingBarber(addLog, sbChairs, sbCustomers, speed, signalRef.current); break;
      }
    } finally { setRunning(false); }
  };

  const stop = () => { signalRef.current.stop = true; };
  // ── END LOGIC ────────────────────────────────────────────

  return (
    <div className="module-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lock size={20} className="text-primary" />
          <h1 className="text-2xl font-bold">Synchronization Playground</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Simulate classic OS synchronization problems with locks, semaphores, and real-time event logs.
        </p>
      </div>

      {/* Problem tabs */}
      <div className="section-card p-0 overflow-hidden">
        <Tabs
          tabs={PROBLEMS.map(p => ({ id: p.id, label: p.name }))}
          active={problem}
          onChange={(id) => !running && setProblem(id as string)}
          disabled={running}
          className="px-2 pt-2"
        />

        {/* Primitives info */}
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">Synchronization primitives:</span>{" "}
            {PRIMITIVES[problem]?.primitives}
          </p>
          <p className="text-xs text-muted-foreground">{PRIMITIVES[problem]?.desc}</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
            {[
              ["bg-red-400",     "BLOCKED"],
              ["bg-emerald-400", "ACQUIRED / PASSED"],
              ["bg-yellow-300",  "RELEASED"],
              ["bg-sky-400",     "sem_signal"],
            ].map(([bg, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${bg}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            {problem === "pc" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Buffer size</span>
                  <input type="number" min={1} value={pcBuf} onChange={e => setPcBuf(+e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Items to produce</span>
                  <input type="number" min={1} value={pcItems} onChange={e => setPcItems(+e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
              </>
            )}
            {problem === "rw" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Readers</span>
                  <input type="number" min={1} value={rwR} onChange={e => setRwR(+e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Writers</span>
                  <input type="number" min={1} value={rwW} onChange={e => setRwW(+e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
              </>
            )}
            {problem === "dp" && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Philosophers</span>
                <input type="number" min={2} value={dpN} onChange={e => setDpN(+e.target.value)}
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
            )}
            {problem === "sb" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Waiting chairs</span>
                  <input type="number" min={1} value={sbChairs} onChange={e => setSbChairs(+e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Customers</span>
                  <input type="number" min={1} value={sbCustomers} onChange={e => setSbCustomers(+e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
              </>
            )}

            {/* Speed */}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Speed: <span className="text-foreground font-semibold">{speed}×</span>
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={speed}
                onChange={e => setSpeed(+e.target.value)}
                className="w-28 accent-primary"
              />
            </label>

            {/* Run / Stop */}
            {!running ? (
              <Button onClick={start} variant="primary" size="md">
                <Play size={14} />
                Run
              </Button>
            ) : (
              <Button onClick={stop} variant="destructive" size="md">
                <Square size={14} />
                <span className="animate-pulse-dot">Stop</span>
              </Button>
            )}
          </div>

          {/* Running indicator */}
          {running && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
              Simulation running… {logs.length} events
            </div>
          )}
        </div>
      </div>

      {/* Log terminal */}
      <div className="section-card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">sync-log</span>
          <span className="ml-auto text-xs text-muted-foreground">{logs.length} entries</span>
        </div>
        <div
          ref={logRef}
          className="terminal-panel h-96 p-3 space-y-0.5 overflow-y-auto"
        >
          {logs.map((l, i) => (
            <div key={i} className="flex gap-2 leading-5">
              <span className="text-slate-500 shrink-0 tabular-nums">[{String(l.time).padStart(4, "0")}]</span>
              <span className={`font-semibold shrink-0 ${getTagColor(l.tag)}`}>[{l.tag}]</span>
              <span className={msgClass(l.message)}>{l.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-500 py-2 text-xs">Click Run to start the simulation…</div>
          )}
        </div>
      </div>
    </div>
  );
}
