import { useTranslation } from "react-i18next";
import { PROCESS_CATEGORIES, CATEGORY_EMOJI } from "@/lib/constants";
import type { ProcessCategory } from "@/types/domain";
import { cn } from "@/lib/cn";

export function CategoryPicker({
  selected,
  onSelect,
}: {
  selected: ProcessCategory | null;
  onSelect: (category: ProcessCategory) => void;
}) {
  const { t } = useTranslation();
  return (
    <div role="radiogroup" aria-label={t("onboarding.categoryPrompt")} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {PROCESS_CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          role="radio"
          aria-checked={selected === category}
          onClick={() => onSelect(category)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 bg-surface p-4 text-center transition-colors",
            "hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]",
            selected === category ? "border-primary bg-badge-brand-bg" : "border-border",
          )}
        >
          <span className="text-3xl" aria-hidden="true">
            {CATEGORY_EMOJI[category]}
          </span>
          <span className="text-sm font-medium text-fg">{t(`processes.category.${category}`)}</span>
        </button>
      ))}
    </div>
  );
}
