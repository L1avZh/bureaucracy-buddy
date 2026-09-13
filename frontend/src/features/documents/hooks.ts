import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as documentsApi from "@/api/documents";
import type { DocumentListQuery, DocumentUploadMetaValues, UpdateDocumentValues } from "@/schemas/document";

export const documentsKeys = {
  all: ["documents"] as const,
  list: (query: DocumentListQuery) => ["documents", "list", query] as const,
  detail: (id: string) => ["documents", "detail", id] as const,
};

export function useDocuments(query: DocumentListQuery = {}) {
  return useQuery({
    queryKey: documentsKeys.list(query),
    queryFn: () => documentsApi.listDocuments(query),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: DocumentUploadMetaValues }) =>
      documentsApi.uploadDocument(file, meta),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateDocumentValues }) =>
      documentsApi.updateDocument(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const blob = await documentsApi.downloadDocumentFile(id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}
