import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as remindersApi from "@/api/reminders";
import type { CreateReminderValues, UpdateReminderValues } from "@/schemas/reminder";

export const remindersKeys = {
  all: ["reminders"] as const,
  list: (upcoming: boolean) => ["reminders", { upcoming }] as const,
};

export function useReminders(opts: { upcoming?: boolean } = {}) {
  return useQuery({
    queryKey: remindersKeys.list(Boolean(opts.upcoming)),
    queryFn: () => remindersApi.listReminders(opts),
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateReminderValues) => remindersApi.createReminder(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: remindersKeys.all });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateReminderValues }) =>
      remindersApi.updateReminder(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: remindersKeys.all });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.deleteReminder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: remindersKeys.all });
    },
  });
}
