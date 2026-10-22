import Link from "next/link";
import {
  Cpu, BarChart2, Lock, AlertTriangle, MemoryStick, FileText, FolderOpen,
} from "lucide-react";

const modules = [
  {
    href: "/process",
    num: 1,
    title: "Process & Thread Simulator",
    desc: "PCB/TCB, state transitions, context switch, live table",
    icon: Cpu,
    color: "#6366f1",
    tags: ["PCB", "TCB", "States"],
  },
  {
    href: "/scheduler",
    num: 2,
    title: "CPU Scheduling Laboratory",
    desc: "FCFS, SJF, RR, Priority, MLFQ with Gantt charts and comparison",
    icon: BarChart2,
    color: "#3b6ef8",
    tags: ["FCFS", "SJF", "MLFQ", "Gantt"],
  },
  {
    href: "/sync",
    num: 3,
    title: "Synchronization Playground",
    desc: "Producer-Consumer, Readers-Writers, Dining Philosophers, Sleeping Barber",
    icon: Lock,
    color: "#16a34a",
    tags: ["Mutex", "Semaphore"],
  },
  {
    href: "/deadlock",
    num: 4,
    title: "Deadlock Analyzer",
    desc: "Resource Allocation Graph, Banker's Algorithm, safe sequence",
    icon: AlertTriangle,
    color: "#dc2626",
    tags: ["RAG", "Banker's", "Safe Seq"],
  },
  {
    href: "/memory",
    num: 5,
    title: "Memory Management",
    desc: "First/Best/Worst Fit, fragmentation, compaction, memory map",
    icon: MemoryStick,
    color: "#ea580c",
    tags: ["First Fit", "Best Fit", "Compaction"],
  },
  {
    href: "/vmem",
    num: 6,
    title: "Virtual Memory",
    desc: "Page table, FIFO/LRU/Optimal/Clock replacement, comparison",
    icon: FileText,
    color: "#d97706",
    tags: ["FIFO", "LRU", "Optimal", "Clock"],
  },
  {
    href: "/filesystem",
    num: 7,
    title: "Mini File System",
    desc: "FAT-based virtual disk, shell commands, directory tree, Block I/O Analyzer",
    icon: FolderOpen,
    color: "#0284c7",
    tags: ["FAT", "Shell", "Block I/O"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-border bg-card">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-8 py-14">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
              Interactive Lab
            </span>
            <span className="text-muted-foreground text-xs">7 modules · C++17 + TypeScript</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4 leading-tight">
            Mini OS Simulator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            A visual, hands-on laboratory for learning operating system concepts.
            Explore scheduling, synchronization, memory, and more — step by step.
          </p>
        </div>
      </div>

      {/* ── Module Grid ── */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Choose a module
          </h2>
          <span className="text-xs text-muted-foreground">{modules.length} modules available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group relative flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border
                           hover:border-transparent hover:shadow-lg
                           transition-all duration-200 overflow-hidden"
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ backgroundColor: m.color }}
                />

                {/* Header row */}
                <div className="flex items-start gap-3 pl-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: m.color + "1a", color: m.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: m.color + "22", color: m.color }}
                      >
                        {String(m.num).padStart(2, "0")}
                      </span>
                    </div>
                    <h2
                      className="text-sm font-semibold text-foreground mt-1 leading-snug group-hover:transition-colors"
                      style={{ "--hover-color": m.color } as React.CSSProperties}
                    >
                      {m.title}
                    </h2>
                  </div>
                </div>

                {/* Description */}
                <p className="pl-2 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>

                {/* Tags */}
                <div className="pl-2 flex flex-wrap gap-1 mt-auto">
                  {m.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ backgroundColor: m.color + "15", color: m.color }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${m.color}0d 0%, transparent 70%)`,
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
