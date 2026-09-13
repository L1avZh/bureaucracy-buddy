import { useTranslation } from "react-i18next";
import { useTasks } from "@/features/tasks/hooks";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";

/** Computes and renders task completion progress for a process. */
export function ProcessProgress({ processId }: { processId: string }) {
  const { t } = useTranslation();
  const { data: tasks, isLoading } = useTasks(processId);

  if (isLoading) return <Skeleton className="h-2 w-full" />;
  if (!tasks || tasks.length === 0) {
    return <p className="text-xs text-fg-subtle">{t("processes.noTasksYet")}</p>;
  }

  const done = tasks.filter((task) => task.status === "done").length;
  return <ProgressBar value={done} max={tasks.length} showValue label={t("processes.tasksComplete", { done, total: tasks.length })} />;
}
