import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useProcesses } from "@/features/processes/hooks";
import { useReminders } from "@/features/reminders/hooks";
import { TaskAggregator } from "@/components/dashboard/TaskAggregator";
import { ProcessCard } from "@/components/process/ProcessCard";
import { ProcessFormDialog } from "@/components/process/ProcessFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { PlusIcon, ClockIcon, CheckIcon } from "@/components/ui/icons";
import { formatDate, formatDateTime, deadlineUrgency } from "@/lib/format";
import { useUiStore } from "@/stores/ui-store";
import type { Task } from "@/types/domain";
import { ApiError } from "@/api/client";

export function DashboardPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const [searchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const deadlinesRef = useRef<HTMLDivElement>(null);

  const { data: processesPage, isLoading, isError, error, refetch } = useProcesses({ page_size: 100 });
  const { data: reminders } = useReminders({ upcoming: true });

  const allProcesses = processesPage?.items ?? [];
  const activeProcesses = allProcesses.filter((p) => p.status !== "completed" && p.status !== "cancelled");
  const completedProcesses = allProcesses
    .filter((p) => p.status === "completed")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
    .slice(0, 5);

  const [tasksByProcess, setTasksByProcess] = useState<Record<string, Task[]>>({});
  const handleTasks = useCallback((processId: string, tasks: Task[]) => {
    setTasksByProcess((prev) => ({ ...prev, [processId]: tasks }));
  }, []);

  const allTasks = useMemo(() => Object.values(tasksByProcess).flat(), [tasksByProcess]);

  const tasksNeedingAttention = useMemo(
    () =>
      allTasks
        .filter((task) => task.status === "todo" && task.deadline && deadlineUrgency(task.deadline) !== "normal")
        .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
        .slice(0, 5),
    [allTasks],
  );

  const recentlyCompletedTasks = useMemo(
    () =>
      allTasks
        .filter((task) => task.status === "done" && task.completed_at)
        .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
        .slice(0, 5),
    [allTasks],
  );

  useEffect(() => {
    if (searchParams.get("focus") === "deadlines") {
      deadlinesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-6">
      {activeProcesses.map((process) => (
        <TaskAggregator key={process.id} processId={process.id} onTasks={handleTasks} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">{t("dashboard.title")}</h1>
          <p className="text-sm text-fg-muted">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/processes" className={buttonVariants("secondary")}>
            {t("dashboard.viewAll")}
          </Link>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" /> {t("processes.newProcess")}
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="danger" title={t("errors.loadFailed")}>
          {error instanceof ApiError ? error.message : t("errors.genericMessage")}
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        </Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <section aria-labelledby="active-processes-heading">
          <h2 id="active-processes-heading" className="mb-3 text-lg font-semibold text-fg">
            {t("dashboard.activeProcesses")}
          </h2>
          {activeProcesses.length === 0 ? (
            <EmptyState
              icon={<span aria-hidden="true">🗂️</span>}
              title={t("dashboard.noActiveProcessesTitle")}
              description={t("dashboard.noActiveProcessesDescription")}
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <PlusIcon className="h-4 w-4" /> {t("processes.newProcess")}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeProcesses.map((process) => (
                <ProcessCard key={process.id} process={process} />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2" ref={deadlinesRef}>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.upcomingDeadlines")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!reminders || reminders.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("dashboard.noUpcomingDeadlines")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {reminders.map((reminder) => (
                  <li key={reminder.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-fg">
                      <ClockIcon className="h-4 w-4 text-fg-subtle" /> {reminder.title}
                    </span>
                    <Badge variant="info">{formatDateTime(reminder.remind_at, locale)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.needsAttention")}</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksNeedingAttention.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("dashboard.nothingNeedsAttention")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tasksNeedingAttention.map((task) => (
                  <li key={task.id}>
                    <Link to={`/processes/${task.process_id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                      <span className="text-fg">{task.title}</span>
                      <Badge variant={deadlineUrgency(task.deadline) === "overdue" ? "danger" : "warning"}>
                        {formatDate(task.deadline, locale)}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentlyCompleted")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyCompletedTasks.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("dashboard.nothingCompletedYet")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentlyCompletedTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm text-fg-muted">
                    <CheckIcon className="h-4 w-4 text-success" />
                    <span className="text-fg line-through">{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.completedProcesses")}</CardTitle>
          </CardHeader>
          <CardContent>
            {completedProcesses.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("dashboard.noCompletedProcesses")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {completedProcesses.map((process) => (
                  <li key={process.id}>
                    <Link to={`/processes/${process.id}`} className="text-sm text-fg hover:underline">
                      {process.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ProcessFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
