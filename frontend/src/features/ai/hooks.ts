import { useMutation } from "@tanstack/react-query";
import * as aiApi from "@/api/ai";
import type { AiChatRequestValues, AiChecklistRequestValues } from "@/schemas/ai";

export function useGenerateChecklist() {
  return useMutation({
    mutationFn: (values: AiChecklistRequestValues) => aiApi.generateChecklist(values),
  });
}

export function useAiChat() {
  return useMutation({
    mutationFn: (values: AiChatRequestValues) => aiApi.chat(values),
  });
}
