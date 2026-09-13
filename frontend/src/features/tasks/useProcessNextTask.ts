import { useTasks } from "@/features/tasks/hooks";

/** The first incomplete task for a process, in checklist order — used to surface "next step" on cards. */
export function useProcessNextTask(processId: string) {
  const { data: tasks } = useTasks(processId);
  return tasks?.find((task) => task.status === "todo");
}
