import { z } from "zod";
import type { Note } from "@/types/domain";

export const noteSchema: z.ZodType<Note> = z.object({
  id: z.string(),
  user_id: z.string(),
  process_id: z.string().nullable(),
  task_id: z.string().nullable(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createNoteSchema = z.object({
  process_id: z.string().optional().nullable(),
  task_id: z.string().optional().nullable(),
  body: z.string().min(1, "notes.errors.bodyRequired").max(8000),
});
export type CreateNoteValues = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  body: z.string().min(1).max(8000),
});
export type UpdateNoteValues = z.infer<typeof updateNoteSchema>;
