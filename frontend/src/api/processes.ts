import { apiRequest } from "@/api/client";
import { paginatedSchema } from "@/schemas/common";
import { processSchema } from "@/schemas/process";
import type { CreateProcessValues, ProcessListQuery, UpdateProcessValues } from "@/schemas/process";
import type { Paginated, Process } from "@/types/domain";

const listSchema = paginatedSchema(processSchema);

function toQueryString(query: ProcessListQuery): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function listProcesses(query: ProcessListQuery = {}): Promise<Paginated<Process>> {
  return apiRequest(`/processes${toQueryString(query)}`, { schema: listSchema });
}

export function getProcess(id: string): Promise<Process> {
  return apiRequest(`/processes/${id}`, { schema: processSchema });
}

export function createProcess(values: CreateProcessValues): Promise<Process> {
  return apiRequest("/processes", { method: "POST", body: values, schema: processSchema });
}

export function updateProcess(id: string, values: UpdateProcessValues): Promise<Process> {
  return apiRequest(`/processes/${id}`, { method: "PATCH", body: values, schema: processSchema });
}

export function deleteProcess(id: string): Promise<void> {
  return apiRequest(`/processes/${id}`, { method: "DELETE" });
}
