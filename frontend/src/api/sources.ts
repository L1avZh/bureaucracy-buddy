import { apiRequest } from "@/api/client";
import { sourceSchema } from "@/schemas/source";
import type { CreateSourceValues, SourceListQuery } from "@/schemas/source";
import type { Source } from "@/types/domain";
import { z } from "zod";

export function listSources(query: SourceListQuery = {}): Promise<Source[]> {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.country) params.set("country", query.country);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  return apiRequest(`/sources${qs ? `?${qs}` : ""}`, { schema: z.array(sourceSchema) });
}

export function createSource(values: CreateSourceValues): Promise<Source> {
  return apiRequest("/sources", { method: "POST", body: values, schema: sourceSchema });
}
