import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  /** Show the "N%" text next to the bar. */
  showValue?: boolean;
}

export function ProgressBar({ value, max = 100, label, className, showValue }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-fg-muted">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
