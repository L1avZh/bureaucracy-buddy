import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "bg-surface-raised text-fg border border-border hover:bg-bg",
  outline: "bg-transparent text-fg border border-border hover:bg-surface-raised",
  ghost: "bg-transparent text-fg hover:bg-surface-raised",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0 justify-center",
};

/**
 * Shared class builder so non-<button> elements (e.g. a <Link> styled as a
 * button) can match exactly without needing a Slot/asChild indirection.
 */
export function buttonVariants(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150",
    "disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
