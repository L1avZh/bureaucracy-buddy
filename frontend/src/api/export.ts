import { apiRequest, apiRequestBlob } from "@/api/client";
import { exportDataSchema } from "@/schemas/export";
import type { ExportData } from "@/types/domain";

export function getExport(): Promise<ExportData> {
  return apiRequest("/export", { schema: exportDataSchema });
}

export function getDocumentsExportZip(): Promise<Blob> {
  return apiRequestBlob("/documents/export.zip");
}

export function importData(data: ExportData): Promise<void> {
  return apiRequest("/import", { method: "POST", body: data });
}
