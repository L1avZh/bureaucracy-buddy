import { useMutation } from "@tanstack/react-query";
import * as exportApi from "@/api/export";
import * as documentsApi from "@/api/documents";
import type { ExportData } from "@/types/domain";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking synchronously races the browser's (async) handling of the
  // download click in some environments, silently dropping the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useExportJson() {
  return useMutation({
    mutationFn: async () => {
      const data = await exportApi.getExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      downloadBlob(blob, `bureaucracy-buddy-export-${new Date().toISOString().slice(0, 10)}.json`);
      return data;
    },
  });
}

export function useExportDocumentsZip() {
  return useMutation({
    mutationFn: async () => {
      const blob = await documentsApi.downloadDocumentsExportZip();
      downloadBlob(blob, `bureaucracy-buddy-documents-${new Date().toISOString().slice(0, 10)}.zip`);
    },
  });
}

export function useImportData() {
  return useMutation({
    mutationFn: (data: ExportData) => exportApi.importData(data),
  });
}
