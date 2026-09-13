import { z } from "zod";
import type { Task, TaskStatus } from "@/types/domain";
import { externalLinkSchema } from "@/schemas/common";

export const taskStatusSchema: z.ZodType<TaskStatus> = z.enum(["todo", "done", "skipped"]);

export const taskSchema: z.ZodType<Task> = z.object({
  id: z.string(),
  process_id: z.string(),
  title: z.string(),
  explanation: z.string().nullable(),
  status: taskStatusSchema,
  order_index: z.number(),
  deadline: z.string().nullable(),
  estimated_minutes: z.number().nullable(),
  external_links: z.array(externalLinkSchema),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
});

// react-hook-form's `valueAsNumber: true` reports an empty <input type="number">
// as NaN, not undefined/null — and Zod's z.number() rejects NaN. Without this
// preprocessing step, leaving the (optional) field blank would fail validation
// silently, since no error is bound to it in the form UI.
const optionalPositiveInt = z.preprocess(
  (val) => (typeof val === "number" && Number.isNaN(val) ? undefined : val),
  z.number().int().positive().optional().nullable(),
);

export const createTaskSchema = z.object({
  title: z.string().min(1, "tasks.errors.titleRequired").max(200),
  explanation: z.string().max(4000).optional().nullable(),
  deadline: z.string().optional().nullable(),
  estimated_minutes: optionalPositiveInt,
  external_links: z.array(externalLinkSchema).optional(),
  notes: z.string().max(4000).optional().nullable(),
});
export type CreateTaskValues = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  explanation: z.string().max(4000).optional().nullable(),
  status: taskStatusSchema.optional(),
  order_index: z.number().optional(),
  deadline: z.string().optional().nullable(),
  estimated_minutes: optionalPositiveInt,
  external_links: z.array(externalLinkSchema).optional(),
  notes: z.string().max(4000).optional().nullable(),
});
export type UpdateTaskValues = z.infer<typeof updateTaskSchema>;
