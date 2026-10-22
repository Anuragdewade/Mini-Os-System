import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface Tab {
  id: string | number;
  label: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string | number;
  onChange: (id: string | number) => void;
  className?: string;
  disabled?: boolean;
}

export function Tabs({ tabs, active, onChange, className, disabled }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-0.5 border-b border-border overflow-x-auto scrollbar-none",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap",
              "transition-colors duration-150 -mb-px",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
