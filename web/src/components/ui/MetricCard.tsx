import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accentColor?: string;
  className?: string;
  /** If true, show value in a muted/warning style */
  warn?: boolean;
}

export function MetricCard({ label, value, icon, accentColor, className, warn }: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 p-4 rounded-xl bg-card border border-border shadow-sm",
        "transition-shadow duration-150 hover:shadow-md",
        className
      )}
      style={accentColor ? { borderTopColor: accentColor, borderTopWidth: 3 } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span
            className="text-muted-foreground opacity-70"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {icon}
          </span>
        )}
      </div>
      <span
        className={cn(
          "text-2xl font-bold font-mono tracking-tight",
          warn ? "text-warning" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
