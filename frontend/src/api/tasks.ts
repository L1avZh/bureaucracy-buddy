import { apiRequest } from "@/api/client";
import { taskSchema } from "@/schemas/task";
import type { CreateTaskValues, UpdateTaskValues } from "@/schemas/task";
import type { Task } from "@/types/domain";
import { z } from "zod";

export function listTasks(processId: string): Promise<Task[]> {
  return apiRequest(`/processes/${processId}/tasks`, { schema: z.array(taskSchema) });
}

export function createTask(processId: string, values: CreateTaskValues): Promise<Task> {
  return apiRequest(`/processes/${processId}/tasks`, { method: "POST", body: values, schema: taskSchema });
}

export function updateTask(id: string, values: UpdateTaskValues): Promise<Task> {
  return apiRequest(`/tasks/${id}`, { method: "PATCH", body: values, schema: taskSchema });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest(`/tasks/${id}`, { method: "DELETE" });
}
