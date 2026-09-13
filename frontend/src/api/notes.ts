import { apiRequest } from "@/api/client";
import { noteSchema } from "@/schemas/note";
import type { CreateNoteValues, UpdateNoteValues } from "@/schemas/note";
import type { Note } from "@/types/domain";
import { z } from "zod";

export function listNotes(query: { process_id?: string; task_id?: string } = {}): Promise<Note[]> {
  const params = new URLSearchParams();
  if (query.process_id) params.set("process_id", query.process_id);
  if (query.task_id) params.set("task_id", query.task_id);
  const qs = params.toString();
  return apiRequest(`/notes${qs ? `?${qs}` : ""}`, { schema: z.array(noteSchema) });
}

export function createNote(values: CreateNoteValues): Promise<Note> {
  return apiRequest("/notes", { method: "POST", body: values, schema: noteSchema });
}

export function updateNote(id: string, values: UpdateNoteValues): Promise<Note> {
  return apiRequest(`/notes/${id}`, { method: "PATCH", body: values, schema: noteSchema });
}

export function deleteNote(id: string): Promise<void> {
  return apiRequest(`/notes/${id}`, { method: "DELETE" });
}
