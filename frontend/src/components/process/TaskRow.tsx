import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Task } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { useUiStore } from "@/stores/ui-store";
import { CheckIcon, ChevronDownIcon, ClockIcon, EditIcon, TrashIcon } from "@/components/ui/icons";
import { useUpdateTask, useDeleteTask } from "@/features/tasks/hooks";
import { toast } from "@/stores/toast-store";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function TaskRow({ task, processId, onEdit }: { task: Task; processId: string; onEdit: () => void }) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const updateTask = useUpdateTask(processId);
  const deleteTask = useDeleteTask(processId);
  const isDone = task.status === "done";

  function toggleComplete() {
    const nextStatus = isDone ? "todo" : "done";
    updateTask.mutate(
      { id: task.id, values: { status: nextStatus } },
      {
        onSuccess: () => {
          if (nextStatus === "done") {
            setJustCompleted(true);
            window.setTimeout(() => setJustCompleted(false), 400);
          }
        },
        onError: () => toast({ title: t("tasks.updateError"), variant: "danger" }),
      },
    );
  }

  async function handleDelete() {
    try {
      await deleteTask.mutateAsync(task.id);
      toast({ title: t("tasks.deleteSuccess"), variant: "success" });
    } catch {
      toast({ title: t("tasks.deleteError"), variant: "danger" });
    } finally {
      setConfirmDelete(false);
    }
  }

  const hasDetails = task.explanation || task.external_links.length > 0 || task.notes;

  return (
    <li className="rounded-lg border border-border bg-surface">
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={isDone ? t("tasks.markIncomplete") : t("tasks.markComplete")}
          onClick={toggleComplete}
          className={cn(
            "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isDone ? "border-success bg-success text-white" : "border-border text-transparent hover:border-primary",
            justCompleted && "animate-check-pop",
          )}
        >
          <CheckIcon className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-medium text-fg", isDone && "text-fg-muted line-through")}>{task.title}</span>
            {task.status === "skipped" && <Badge variant="warning">{t("tasks.status.skipped")}</Badge>}
            {task.deadline && (
              <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
                <ClockIcon className="h-3 w-3" /> {formatDate(task.deadline, locale)}
              </span>
            )}
          </div>

          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              aria-expanded={expanded}
            >
              <ChevronDownIcon className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
              {expanded ? t("tasks.hideDetails") : t("tasks.whatThisMeans")}
            </button>
          )}

          {expanded && (
            <div className="mt-2 flex flex-col gap-2 rounded-md bg-bg p-3 text-sm text-fg-muted">
              {task.explanation && <p>{task.explanation}</p>}
              {task.external_links.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {task.external_links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary underline"
                      >
                        {link.label || link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {task.notes && (
                <p>
                  <span className="font-medium text-fg">{t("tasks.form.notes")}: </span>
                  {task.notes}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={onEdit}>
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => setConfirmDelete(true)}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("tasks.deleteConfirmTitle")}
        description={t("tasks.deleteConfirmDescription", { title: task.title })}
        isLoading={deleteTask.isPending}
        onConfirm={handleDelete}
      />
    </li>
  );
}
