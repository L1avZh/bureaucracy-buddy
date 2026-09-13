import { z } from "zod";
import type { Document } from "@/types/domain";

// `satisfies` (rather than a `: z.ZodType<Document>` annotation) keeps the
// concrete ZodObject type, so callers can still use `.extend()` etc., while
// still checking at compile time that the schema matches the domain type.
export const documentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  process_id: z.string().nullable(),
  title: z.string(),
  category: z.string(),
  original_filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  expires_at: z.string().nullable(),
  notes: z.string().nullable(),
  uploaded_at: z.string(),
}) satisfies z.ZodType<Document>;

export const documentUploadMetaSchema = z.object({
  title: z.string().min(1, "documents.errors.titleRequired").max(200),
  category: z.string().min(1, "documents.errors.categoryRequired"),
  process_id: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});
export type DocumentUploadMetaValues = z.infer<typeof documentUploadMetaSchema>;

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).optional(),
  process_id: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});
export type UpdateDocumentValues = z.infer<typeof updateDocumentSchema>;

export const documentListQuerySchema = z.object({
  process_id: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;

// Allow-list mirrored from the backend contract, used purely for a fast,
// friendly client-side check before we even attempt the upload. The
// backend remains the source of truth and re-validates.
export const ACCEPTED_DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
