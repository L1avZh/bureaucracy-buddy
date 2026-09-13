import { z } from "zod";
import type { Source } from "@/types/domain";

export const sourceSchema: z.ZodType<Source> = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  organization: z.string(),
  country: z.string().nullable(),
  category: z.string(),
  last_verified_at: z.string(),
  added_by: z.enum(["system", "user"]),
  user_id: z.string().nullable(),
});

export const createSourceSchema = z.object({
  title: z.string().min(1, "sources.errors.titleRequired").max(200),
  url: z.string().url("sources.errors.invalidUrl"),
  organization: z.string().min(1, "sources.errors.organizationRequired"),
  country: z.string().optional().nullable(),
  category: z.string().min(1, "sources.errors.categoryRequired"),
});
export type CreateSourceValues = z.infer<typeof createSourceSchema>;

export const sourceListQuerySchema = z.object({
  category: z.string().optional(),
  country: z.string().optional(),
  q: z.string().optional(),
});
export type SourceListQuery = z.infer<typeof sourceListQuerySchema>;
