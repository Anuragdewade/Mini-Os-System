import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost" | "outline";
type Size    = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:     "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
  secondary:   "bg-secondary text-secondary-foreground hover:bg-accent border border-border",
  destructive: "bg-destructive text-white hover:opacity-90",
  ghost:       "text-foreground hover:bg-accent hover:text-accent-foreground",
  outline:     "border border-border text-foreground hover:bg-accent bg-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm:   "h-7 px-3 text-xs rounded-md gap-1.5",
  md:   "h-9 px-4 text-sm rounded-lg gap-2",
  lg:   "h-11 px-5 text-base rounded-lg gap-2",
  icon: "h-8 w-8 rounded-lg flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-150 active:scale-[0.97]",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
