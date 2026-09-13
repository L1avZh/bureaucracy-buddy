import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "@/api/tasks";
import { processesKeys } from "@/features/processes/hooks";
import type { CreateTaskValues, UpdateTaskValues } from "@/schemas/task";

export const tasksKeys = {
  byProcess: (processId: string) => ["tasks", "process", processId] as const,
};

export function useTasks(processId: string | undefined) {
  return useQuery({
    queryKey: tasksKeys.byProcess(processId ?? ""),
    queryFn: () => tasksApi.listTasks(processId as string),
    enabled: Boolean(processId),
  });
}

export function useCreateTask(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateTaskValues) => tasksApi.createTask(processId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.byProcess(processId) });
      void queryClient.invalidateQueries({ queryKey: processesKeys.all });
    },
  });
}

export function useUpdateTask(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateTaskValues }) => tasksApi.updateTask(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.byProcess(processId) });
      void queryClient.invalidateQueries({ queryKey: processesKeys.all });
    },
  });
}

export function useDeleteTask(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.byProcess(processId) });
      void queryClient.invalidateQueries({ queryKey: processesKeys.all });
    },
  });
}
