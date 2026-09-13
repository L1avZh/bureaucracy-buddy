import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const TooltipProvider = RadixTooltip.Provider;

export function Tooltip({ content, children, className }: { content: string; children: ReactNode; className?: string }) {
  return (
    <RadixTooltip.Root delayDuration={300}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          sideOffset={6}
          className={cn(
            "z-50 rounded-md bg-fg px-2.5 py-1.5 text-xs font-medium text-bg shadow-lg animate-fade-in",
            className,
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-fg" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
