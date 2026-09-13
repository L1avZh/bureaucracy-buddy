import { useEffect } from "react";
import { useTasks } from "@/features/tasks/hooks";
import type { Task } from "@/types/domain";

/**
 * Invisible helper: subscribes to one process's tasks and reports them to
 * the dashboard's aggregate state. The contract has no "all my tasks"
 * endpoint, only `/processes/{id}/tasks`, so the dashboard's task-level
 * insights (deadlines, attention list, recently completed) are built by
 * fanning out one query per active process and merging client-side.
 */
export function TaskAggregator({ processId, onTasks }: { processId: string; onTasks: (processId: string, tasks: Task[]) => void }) {
  const { data } = useTasks(processId);

  useEffect(() => {
    if (data) onTasks(processId, data);
  }, [data, processId, onTasks]);

  return null;
}
