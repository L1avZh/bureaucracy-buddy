import { apiRequest, apiRequestBlob } from "@/api/client";
import { paginatedSchema } from "@/schemas/common";
import { documentSchema } from "@/schemas/document";
import type { DocumentListQuery, DocumentUploadMetaValues, UpdateDocumentValues } from "@/schemas/document";
import type { Document, Paginated } from "@/types/domain";

const listSchema = paginatedSchema(documentSchema);

function toQueryString(query: DocumentListQuery): string {
  const params = new URLSearchParams();
  if (query.process_id) params.set("process_id", query.process_id);
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function listDocuments(query: DocumentListQuery = {}): Promise<Paginated<Document>> {
  return apiRequest(`/documents${toQueryString(query)}`, { schema: listSchema });
}

export function getDocument(id: string): Promise<Document> {
  return apiRequest(`/documents/${id}`, { schema: documentSchema });
}

export function uploadDocument(file: File, meta: DocumentUploadMetaValues): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("metadata", JSON.stringify(meta));
  return apiRequest("/documents", { method: "POST", formData, schema: documentSchema });
}

export function updateDocument(id: string, values: UpdateDocumentValues): Promise<Document> {
  return apiRequest(`/documents/${id}`, { method: "PATCH", body: values, schema: documentSchema });
}

export function deleteDocument(id: string): Promise<void> {
  return apiRequest(`/documents/${id}`, { method: "DELETE" });
}

export function downloadDocumentFile(id: string): Promise<Blob> {
  return apiRequestBlob(`/documents/${id}/file`);
}

export function downloadDocumentsExportZip(): Promise<Blob> {
  return apiRequestBlob(`/documents/export.zip`);
}
