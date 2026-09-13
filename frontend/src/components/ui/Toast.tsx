import * as RadixToast from "@radix-ui/react-toast";
import { useToastStore } from "@/stores/toast-store";
import type { ToastVariant } from "@/stores/toast-store";
import { useUiStore } from "@/stores/ui-store";
import { RTL_LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { XIcon } from "@/components/ui/icons";

const variantClasses: Record<ToastVariant, string> = {
  default: "border-border bg-surface text-fg",
  success: "border-success/30 bg-success-bg text-success",
  danger: "border-danger/30 bg-danger-bg text-danger",
  warning: "border-warning/30 bg-warning-bg text-warning",
};

/** Mount once near the root. Renders every toast currently in the store. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const locale = useUiStore((s) => s.locale);
  const swipeDirection = RTL_LOCALES.includes(locale) ? "left" : "right";

  return (
    <RadixToast.Provider swipeDirection={swipeDirection} duration={5000}>
      {toasts.map((t) => (
        <RadixToast.Root
          key={t.id}
          className={cn(
            "rounded-lg border p-4 shadow-lg animate-scale-in data-[state=closed]:animate-fade-in",
            "grid grid-cols-[1fr_auto] items-start gap-2",
            variantClasses[t.variant],
          )}
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
        >
          <div>
            <RadixToast.Title className="text-sm font-semibold">{t.title}</RadixToast.Title>
            {t.description && <RadixToast.Description className="mt-1 text-sm opacity-90">{t.description}</RadixToast.Description>}
          </div>
          <RadixToast.Close aria-label="Dismiss" className="rounded p-1 hover:bg-black/5">
            <XIcon />
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed bottom-4 end-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
    </RadixToast.Provider>
  );
}
