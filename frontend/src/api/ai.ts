import { apiRequest } from "@/api/client";
import { aiChatResponseSchema, aiChecklistResponseSchema } from "@/schemas/ai";
import type { AiChatRequestValues, AiChecklistRequestValues } from "@/schemas/ai";
import type { AiChatResponse, AiChecklistResponse } from "@/types/domain";

export function generateChecklist(values: AiChecklistRequestValues): Promise<AiChecklistResponse> {
  return apiRequest("/ai/checklist", { method: "POST", body: values, schema: aiChecklistResponseSchema });
}

export function chat(values: AiChatRequestValues): Promise<AiChatResponse> {
  return apiRequest("/ai/chat", { method: "POST", body: values, schema: aiChatResponseSchema });
}
