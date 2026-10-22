import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Extra top border accent color (CSS color string) */
  accentColor?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, accentColor, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          ...(accentColor ? { borderTop: `3px solid ${accentColor}` } : {}),
          ...style,
        }}
        className={cn(
          "bg-card border border-border rounded-xl shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-4 border-b border-border", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold text-foreground", className)} {...props} />
  );
}
