import { z } from "zod";
import type { Process, ProcessCategory, ProcessPriority, ProcessStatus } from "@/types/domain";

export const processCategorySchema: z.ZodType<ProcessCategory> = z.enum([
  "government",
  "tax",
  "healthcare",
  "employment",
  "education",
  "housing",
  "vehicles",
  "banking",
  "immigration",
  "other",
]);

export const processStatusSchema: z.ZodType<ProcessStatus> = z.enum([
  "not_started",
  "in_progress",
  "waiting",
  "action_required",
  "completed",
  "cancelled",
]);

export const processPrioritySchema: z.ZodType<ProcessPriority> = z.enum(["low", "medium", "high"]);

export const processSchema: z.ZodType<Process> = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  category: processCategorySchema,
  description: z.string().nullable(),
  status: processStatusSchema,
  priority: processPrioritySchema,
  deadline: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
});

export const createProcessSchema = z.object({
  title: z.string().min(1, "processes.errors.titleRequired").max(200),
  category: processCategorySchema,
  description: z.string().max(4000).optional().nullable(),
  priority: processPrioritySchema.default("medium"),
  deadline: z.string().optional().nullable(),
});
export type CreateProcessValues = z.infer<typeof createProcessSchema>;

export const updateProcessSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: processCategorySchema.optional(),
  description: z.string().max(4000).optional().nullable(),
  status: processStatusSchema.optional(),
  priority: processPrioritySchema.optional(),
  deadline: z.string().optional().nullable(),
});
export type UpdateProcessValues = z.infer<typeof updateProcessSchema>;

export const processListQuerySchema = z.object({
  status: processStatusSchema.optional(),
  category: processCategorySchema.optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});
export type ProcessListQuery = z.infer<typeof processListQuerySchema>;
