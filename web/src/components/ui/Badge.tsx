import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "new"
  | "ready"
  | "running"
  | "waiting"
  | "terminated"
  | "fault"
  | "hit"
  | "safe"
  | "unsafe"
  | "deadlock";

const variantClasses: Record<BadgeVariant, string> = {
  default:     "bg-muted text-muted-foreground",
  primary:     "bg-primary-subtle text-primary",
  success:     "bg-success-subtle text-success",
  warning:     "bg-warning-subtle text-warning",
  destructive: "bg-destructive-subtle text-destructive",
  info:        "bg-info-subtle text-info",
  // Process states
  new:         "text-white",
  ready:       "text-white",
  running:     "text-white",
  waiting:     "text-white",
  terminated:  "text-white",
  // VM
  fault:       "bg-vm-fault-subtle text-vm-fault",
  hit:         "bg-vm-hit-subtle text-vm-hit",
  // Deadlock
  safe:        "bg-safe-subtle text-safe",
  unsafe:      "bg-unsafe-subtle text-unsafe",
  deadlock:    "bg-deadlock-subtle text-deadlock",
};

// Inline bg for state badges (uses CSS vars directly to avoid Tailwind purge issues)
const stateInlineBg: Partial<Record<BadgeVariant, string>> = {
  new:        "var(--state-new)",
  ready:      "var(--state-ready)",
  running:    "var(--state-running)",
  waiting:    "var(--state-waiting)",
  terminated: "var(--state-terminated)",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", style, ...props }: BadgeProps) {
  const inlineBg = stateInlineBg[variant];
  return (
    <span
      style={inlineBg ? { backgroundColor: inlineBg, ...style } : style}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
        "whitespace-nowrap tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
