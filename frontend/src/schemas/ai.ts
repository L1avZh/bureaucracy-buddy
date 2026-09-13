import { z } from "zod";
import type { AiChatResponse, AiChecklistResponse, AiMessage } from "@/types/domain";
import { processCategorySchema } from "@/schemas/process";

const aiProviderSchema = z.enum(["mock", "openai"]);
const aiConfidenceSchema = z.literal("ai_generated");

export const aiMessageSchema: z.ZodType<AiMessage> = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  created_at: z.string(),
});

const processPrioritySchema = z.enum(["low", "medium", "high"]);

export const aiChecklistResponseSchema: z.ZodType<AiChecklistResponse> = z.object({
  process: z.object({
    title: z.string(),
    category: processCategorySchema,
    description: z.string(),
    priority: processPrioritySchema,
    confidence: aiConfidenceSchema,
  }),
  tasks: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
      estimated_minutes: z.number().nullable(),
      confidence: aiConfidenceSchema,
    }),
  ),
  documents: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      confidence: aiConfidenceSchema,
    }),
  ),
  questions: z.array(z.string()),
  disclaimer: z.string(),
  provider: aiProviderSchema,
});

export const aiChecklistRequestSchema = z.object({
  goal: z.string().min(1, "ai.errors.goalRequired").max(500),
  category: processCategorySchema.optional(),
});
export type AiChecklistRequestValues = z.infer<typeof aiChecklistRequestSchema>;

export const aiChatResponseSchema: z.ZodType<AiChatResponse> = z.object({
  conversation_id: z.string(),
  reply: z.string(),
  messages: z.array(aiMessageSchema),
  disclaimer: z.string(),
  provider: aiProviderSchema,
});

export const aiChatRequestSchema = z.object({
  conversation_id: z.string().optional(),
  process_id: z.string().optional(),
  message: z.string().min(1).max(4000),
});
export type AiChatRequestValues = z.infer<typeof aiChatRequestSchema>;
