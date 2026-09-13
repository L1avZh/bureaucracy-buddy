import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { XIcon } from "@/components/ui/icons";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

interface DialogContentProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Hide the title visually while keeping it for screen readers. */
  visuallyHiddenTitle?: boolean;
}

export function DialogContent({ title, description, children, className, visuallyHiddenTitle }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40 animate-fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed start-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-surface p-6 shadow-lg animate-scale-in",
          "focus:outline-none max-h-[85vh] overflow-y-auto",
          className,
        )}
      >
        <RadixDialog.Title className={cn("text-lg font-semibold text-fg", visuallyHiddenTitle && "sr-only")}>
          {title}
        </RadixDialog.Title>
        {description && (
          <RadixDialog.Description className="mt-1 text-sm text-fg-muted">{description}</RadixDialog.Description>
        )}
        <div className="mt-4">{children}</div>
        <RadixDialog.Close
          className="absolute end-4 top-4 rounded-md p-1 text-fg-muted hover:bg-surface-raised hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]"
          aria-label="Close"
        >
          <XIcon />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogClose = RadixDialog.Close;
