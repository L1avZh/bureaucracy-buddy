import { z } from "zod";
import type { ApiErrorBody, ExternalLink, Paginated, SearchResultItem, SearchResults } from "@/types/domain";

export const apiErrorSchema: z.ZodType<ApiErrorBody> = z.object({
  error: z.object({
    code: z.enum([
      "VALIDATION_ERROR",
      "NOT_FOUND",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "CONFLICT",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
    ]),
    message: z.string(),
    details: z.array(z.unknown()),
  }),
});

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
  }) satisfies z.ZodType<Paginated<z.infer<T>>>;
}

export const externalLinkSchema: z.ZodType<ExternalLink> = z.object({
  label: z.string(),
  url: z.string(),
});

export const searchResultItemSchema: z.ZodType<SearchResultItem> = z.object({
  id: z.string(),
  type: z.enum(["process", "task", "document", "note", "source"]),
  title: z.string(),
  snippet: z.string().nullable(),
  url: z.string().nullable(),
});

export const searchResultsSchema: z.ZodType<SearchResults> = z.object({
  processes: z.array(searchResultItemSchema),
  tasks: z.array(searchResultItemSchema),
  documents: z.array(searchResultItemSchema),
  notes: z.array(searchResultItemSchema),
  sources: z.array(searchResultItemSchema),
});
