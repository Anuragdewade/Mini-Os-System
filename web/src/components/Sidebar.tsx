"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Cpu, BarChart2, Lock, AlertTriangle, MemoryStick, FileText, FolderOpen,
  Sun, Moon, Monitor, ChevronRight, Home,
} from "lucide-react";

const modules = [
  {
    href: "/process",
    label: "Process & Thread",
    desc: "PCB/TCB, state transitions, context switch",
    num: 1,
    icon: Cpu,
    color: "#6366f1",
  },
  {
    href: "/scheduler",
    label: "CPU Scheduling",
    desc: "FCFS, SJF, RR, Priority, MLFQ + Gantt",
    num: 2,
    icon: BarChart2,
    color: "#3b6ef8",
  },
  {
    href: "/sync",
    label: "Synchronization",
    desc: "Producer-Consumer, Dining Philosophers…",
    num: 3,
    icon: Lock,
    color: "#16a34a",
  },
  {
    href: "/deadlock",
    label: "Deadlock Analyzer",
    desc: "RAG cycle detection + Banker's algorithm",
    num: 4,
    icon: AlertTriangle,
    color: "#dc2626",
  },
  {
    href: "/memory",
    label: "Memory Management",
    desc: "First/Best/Worst Fit, fragmentation, compaction",
    num: 5,
    icon: MemoryStick,
    color: "#ea580c",
  },
  {
    href: "/vmem",
    label: "Virtual Memory",
    desc: "FIFO/LRU/Optimal/Clock page replacement",
    num: 6,
    icon: FileText,
    color: "#d97706",
  },
  {
    href: "/filesystem",
    label: "File System",
    desc: "FAT shell + Block I/O Analyzer",
    num: 7,
    icon: FolderOpen,
    color: "#0284c7",
  },
];

type Theme = "system" | "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("os-theme") as Theme | null;
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {}
  }, []);

  const apply = (t: Theme) => {
    setTheme(t);
    try { localStorage.setItem("os-theme", t); } catch {}
    const dark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };

  return { theme, apply };
}

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, apply } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const ThemeIcon = themeIcon;
  const nextTheme: Theme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
  const themeLabel = `Theme: ${theme}. Click to switch to ${nextTheme}.`;

  const navContent = (
    <>
      {/* Logo */}
      <Link
        href="/"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-accent/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Monitor size={16} className="text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">Mini OS Simulator</p>
          <p className="text-[11px] text-muted-foreground leading-tight">Interactive Learning Lab</p>
        </div>
      </Link>

      {/* Home link */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === "/"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Home size={14} />
          <span>Overview</span>
        </Link>
      </div>

      {/* Divider label */}
      <div className="px-5 pt-2 pb-1">
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Modules
        </span>
      </div>

      {/* Module links */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5" role="navigation" aria-label="Modules">
        {modules.map((m) => {
          const active = pathname === m.href || pathname.startsWith(m.href + "/");
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              title={m.desc}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-accent"
              )}
            >
              {/* Color dot / icon */}
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors",
                  active ? "bg-white/20" : "bg-muted"
                )}
                style={!active ? { color: m.color } : undefined}
              >
                <Icon size={14} />
              </span>

              <span className="flex-1 min-w-0">
                <span className="block font-medium leading-tight">{m.label}</span>
                <span
                  className={cn(
                    "block text-[11px] leading-tight truncate mt-0.5",
                    active ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {m.desc}
                </span>
              </span>

              {/* Number badge */}
              <span
                className={cn(
                  "text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded-md shrink-0",
                  active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {m.num}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-border space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => apply(nextTheme)}
          title={themeLabel}
          aria-label={themeLabel}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
            "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          )}
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted">
            <ThemeIcon size={14} />
          </span>
          <span className="flex-1 text-left capitalize">Theme: {theme}</span>
        </button>
        <p className="px-3 text-[10px] text-muted-foreground">C++17 · TypeScript · Next.js</p>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="w-64 shrink-0 border-r border-border bg-card h-screen sticky top-0 flex flex-col hidden md:flex"
        aria-label="Main navigation"
      >
        {navContent}
      </aside>

      {/* ── Mobile: hamburger + slide drawer ── */}
      <div className="md:hidden">
        {/* Top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-12 bg-card border-b border-border">
          <Link href="/" className="text-sm font-bold text-foreground">Mini OS Simulator</Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronRight
              size={18}
              className={cn("text-muted-foreground transition-transform duration-200", mobileOpen && "rotate-180")}
            />
          </button>
        </div>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col",
            "transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-label="Mobile navigation"
          aria-hidden={!mobileOpen}
        >
          {navContent}
        </aside>

        {/* Push main content down on mobile */}
        <div className="h-12" />
      </div>
    </>
  );
}
