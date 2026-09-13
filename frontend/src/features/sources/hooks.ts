import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as sourcesApi from "@/api/sources";
import type { CreateSourceValues, SourceListQuery } from "@/schemas/source";

export const sourcesKeys = {
  list: (query: SourceListQuery) => ["sources", query] as const,
};

export function useSources(query: SourceListQuery = {}) {
  return useQuery({
    queryKey: sourcesKeys.list(query),
    queryFn: () => sourcesApi.listSources(query),
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateSourceValues) => sourcesApi.createSource(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });
}
