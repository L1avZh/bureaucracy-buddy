import { apiRequest } from "@/api/client";
import { healthResponseSchema } from "@/schemas/export";
import type { HealthResponse } from "@/types/domain";

export function getHealth(): Promise<HealthResponse> {
  return apiRequest("/health", { schema: healthResponseSchema, skipAuth: true });
}
