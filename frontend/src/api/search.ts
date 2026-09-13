import { apiRequest } from "@/api/client";
import { searchResultsSchema } from "@/schemas/common";
import type { SearchResults } from "@/types/domain";

export function search(query: string, signal?: AbortSignal): Promise<SearchResults> {
  return apiRequest(`/search?q=${encodeURIComponent(query)}`, { schema: searchResultsSchema, signal });
}
