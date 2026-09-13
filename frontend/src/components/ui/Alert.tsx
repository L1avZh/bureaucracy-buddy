import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { AlertIcon, InfoIcon, CheckIcon } from "@/components/ui/icons";

export type AlertVariant = "info" | "warning" | "danger" | "success";

const variantClasses: Record<AlertVariant, string> = {
  info: "bg-info-bg text-info border-info/20",
  warning: "bg-warning-bg text-warning border-warning/20",
  danger: "bg-danger-bg text-danger border-danger/20",
  success: "bg-success-bg text-success border-success/20",
};

const variantIcons: Record<AlertVariant, typeof AlertIcon> = {
  info: InfoIcon,
  warning: AlertIcon,
  danger: AlertIcon,
  success: CheckIcon,
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  const IconComponent = variantIcons[variant];
  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border p-4 text-sm", variantClasses[variant], className)}
      {...props}
    >
      <IconComponent className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}
