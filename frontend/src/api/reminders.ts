import { apiRequest } from "@/api/client";
import { reminderSchema } from "@/schemas/reminder";
import type { CreateReminderValues, UpdateReminderValues } from "@/schemas/reminder";
import type { Reminder } from "@/types/domain";
import { z } from "zod";

export function listReminders(opts: { upcoming?: boolean } = {}): Promise<Reminder[]> {
  const params = new URLSearchParams();
  if (opts.upcoming) params.set("upcoming", "true");
  const qs = params.toString();
  return apiRequest(`/reminders${qs ? `?${qs}` : ""}`, { schema: z.array(reminderSchema) });
}

export function createReminder(values: CreateReminderValues): Promise<Reminder> {
  return apiRequest("/reminders", { method: "POST", body: values, schema: reminderSchema });
}

export function updateReminder(id: string, values: UpdateReminderValues): Promise<Reminder> {
  return apiRequest(`/reminders/${id}`, { method: "PATCH", body: values, schema: reminderSchema });
}

export function deleteReminder(id: string): Promise<void> {
  return apiRequest(`/reminders/${id}`, { method: "DELETE" });
}
