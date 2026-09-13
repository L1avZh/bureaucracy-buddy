import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Process } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_EMOJI, PRIORITY_BADGE_VARIANT, STATUS_BADGE_VARIANT } from "@/lib/constants";
import { ProcessProgress } from "@/components/process/ProcessProgress";
import { useProcessNextTask } from "@/features/tasks/useProcessNextTask";
import { formatDate, deadlineUrgency } from "@/lib/format";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/cn";

const urgencyTextClass: Record<string, string> = {
  overdue: "text-danger font-medium",
  urgent: "text-warning font-medium",
  soon: "text-fg",
  normal: "text-fg-muted",
  none: "text-fg-muted",
};

export function ProcessCard({ process }: { process: Process }) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const nextTask = useProcessNextTask(process.id);
  const urgency = deadlineUrgency(process.deadline);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {CATEGORY_EMOJI[process.category]}
            </span>
            <Link to={`/processes/${process.id}`} className="font-semibold text-fg hover:underline">
              {process.title}
            </Link>
          </div>
          <Badge variant={PRIORITY_BADGE_VARIANT[process.priority]}>{t(`processes.priority.${process.priority}`)}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_BADGE_VARIANT[process.status]}>{t(`processes.status.${process.status}`)}</Badge>
          <Badge variant="neutral">{t(`processes.category.${process.category}`)}</Badge>
        </div>

        <ProcessProgress processId={process.id} />

        {nextTask && (
          <p className="text-sm text-fg-muted">
            <span className="font-medium text-fg">{t("dashboard.nextStep")}: </span>
            {nextTask.title}
          </p>
        )}

        {process.deadline && (
          <p className={cn("text-xs", urgencyTextClass[urgency])}>
            {t("processes.deadline")}: {formatDate(process.deadline, locale)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
