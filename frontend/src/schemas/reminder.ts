import { z } from "zod";
import type { Reminder, ReminderRelatedType, ReminderStatus } from "@/types/domain";

export const reminderRelatedTypeSchema: z.ZodType<ReminderRelatedType> = z.enum([
  "process",
  "task",
  "document",
  "custom",
]);
export const reminderStatusSchema: z.ZodType<ReminderStatus> = z.enum(["pending", "dismissed", "done"]);

export const reminderSchema: z.ZodType<Reminder> = z.object({
  id: z.string(),
  user_id: z.string(),
  related_type: reminderRelatedTypeSchema,
  related_id: z.string().nullable(),
  title: z.string(),
  remind_at: z.string(),
  status: reminderStatusSchema,
  created_at: z.string(),
});

export const createReminderSchema = z.object({
  related_type: reminderRelatedTypeSchema,
  related_id: z.string().optional().nullable(),
  title: z.string().min(1, "reminders.errors.titleRequired").max(200),
  remind_at: z.string(),
});
export type CreateReminderValues = z.infer<typeof createReminderSchema>;

export const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  remind_at: z.string().optional(),
  status: reminderStatusSchema.optional(),
});
export type UpdateReminderValues = z.infer<typeof updateReminderSchema>;
