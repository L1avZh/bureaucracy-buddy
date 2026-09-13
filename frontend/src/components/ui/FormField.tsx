import { useId } from "react";
import type { ReactElement, ReactNode } from "react";
import { cloneElement } from "react";
import { cn } from "@/lib/cn";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean; invalid?: boolean }>;
}

/**
 * Wires a label, hint text, and validation error to a single form control
 * via matching id / aria-describedby / aria-invalid — the accessibility
 * glue react-hook-form doesn't provide for you.
 */
export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        // Only set when true: some wrapped children (e.g. react-hook-form's
        // <Controller>) ignore unknown props entirely, but always injecting
        // `invalid`/`aria-invalid={false}` is needless noise either way.
        ...(error ? { "aria-invalid": true, invalid: true } : {}),
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}
