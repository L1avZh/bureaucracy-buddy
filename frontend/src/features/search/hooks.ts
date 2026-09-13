import { useQuery } from "@tanstack/react-query";
import * as searchApi from "@/api/search";

export function useSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: ({ signal }) => searchApi.search(trimmed, signal),
    enabled: trimmed.length >= 2,
    staleTime: 10_000,
  });
}
