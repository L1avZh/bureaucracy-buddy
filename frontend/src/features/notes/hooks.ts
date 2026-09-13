import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "@/api/notes";
import type { CreateNoteValues, UpdateNoteValues } from "@/schemas/note";

export const notesKeys = {
  list: (query: { process_id?: string; task_id?: string }) => ["notes", query] as const,
};

export function useNotes(query: { process_id?: string; task_id?: string } = {}) {
  return useQuery({
    queryKey: notesKeys.list(query),
    queryFn: () => notesApi.listNotes(query),
    enabled: Boolean(query.process_id || query.task_id),
  });
}

export function useCreateNote(invalidateQuery: { process_id?: string; task_id?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateNoteValues) => notesApi.createNote(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.list(invalidateQuery) });
    },
  });
}

export function useUpdateNote(invalidateQuery: { process_id?: string; task_id?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateNoteValues }) => notesApi.updateNote(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.list(invalidateQuery) });
    },
  });
}

export function useDeleteNote(invalidateQuery: { process_id?: string; task_id?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.list(invalidateQuery) });
    },
  });
}
