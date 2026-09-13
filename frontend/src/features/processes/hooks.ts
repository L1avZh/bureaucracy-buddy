import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as processesApi from "@/api/processes";
import type { CreateProcessValues, ProcessListQuery, UpdateProcessValues } from "@/schemas/process";

export const processesKeys = {
  all: ["processes"] as const,
  list: (query: ProcessListQuery) => ["processes", "list", query] as const,
  detail: (id: string) => ["processes", "detail", id] as const,
};

export function useProcesses(query: ProcessListQuery = {}) {
  return useQuery({
    queryKey: processesKeys.list(query),
    queryFn: () => processesApi.listProcesses(query),
  });
}

export function useProcess(id: string | undefined) {
  return useQuery({
    queryKey: processesKeys.detail(id ?? ""),
    queryFn: () => processesApi.getProcess(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateProcessValues) => processesApi.createProcess(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: processesKeys.all });
    },
  });
}

export function useUpdateProcess(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateProcessValues) => processesApi.updateProcess(id, values),
    onSuccess: (process) => {
      queryClient.setQueryData(processesKeys.detail(id), process);
      void queryClient.invalidateQueries({ queryKey: processesKeys.all });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processesApi.deleteProcess(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: processesKeys.all });
    },
  });
}
