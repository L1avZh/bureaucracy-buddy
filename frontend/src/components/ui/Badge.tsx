import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface-raised text-fg-muted border border-border",
  brand: "bg-badge-brand-bg text-badge-brand-fg",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
