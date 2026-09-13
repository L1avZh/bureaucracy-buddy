import { z } from "zod";
import type { ExportData, HealthResponse } from "@/types/domain";
import { userSchema } from "@/schemas/auth";
import { processSchema } from "@/schemas/process";
import { taskSchema } from "@/schemas/task";
import { documentSchema } from "@/schemas/document";
import { reminderSchema } from "@/schemas/reminder";
import { noteSchema } from "@/schemas/note";
import { sourceSchema } from "@/schemas/source";

export const exportDataSchema: z.ZodType<ExportData> = z.object({
  user: userSchema,
  processes: z.array(processSchema),
  tasks: z.array(taskSchema),
  documents: z.array(documentSchema),
  reminders: z.array(reminderSchema),
  notes: z.array(noteSchema),
  sources: z.array(sourceSchema),
  documents_note: z.string(),
});

export const healthResponseSchema: z.ZodType<HealthResponse> = z.object({
  status: z.literal("ok"),
  version: z.string(),
});
