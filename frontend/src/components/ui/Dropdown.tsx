import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

export const Dropdown = RadixDropdown.Root;
export const DropdownTrigger = RadixDropdown.Trigger;

export function DropdownContent({ className, ...props }: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={6}
        className={cn(
          "z-50 min-w-40 rounded-lg border border-border bg-surface p-1 shadow-lg animate-scale-in",
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownItem({ className, ...props }: RadixDropdown.DropdownMenuItemProps) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg outline-none",
        "data-[highlighted]:bg-surface-raised data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export const DropdownSeparator = ({ className, ...props }: RadixDropdown.DropdownMenuSeparatorProps) => (
  <RadixDropdown.Separator className={cn("my-1 h-px bg-border", className)} {...props} />
);

export const DropdownLabel = ({ className, ...props }: RadixDropdown.DropdownMenuLabelProps) => (
  <RadixDropdown.Label className={cn("px-2.5 py-1.5 text-xs font-medium text-fg-subtle", className)} {...props} />
);
