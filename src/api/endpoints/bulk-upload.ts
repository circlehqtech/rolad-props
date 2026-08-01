import client from "../client";

export interface BulkUploadError {
  row: number;
  message: string;
}

export interface BulkUploadResponse {
  totalRows: number;
  created: number;
  updated: number;
  errors: BulkUploadError[];
}

/**
 * Submits a CSV/XLSX file for bulk client ingestion.
 * @param file CSV or XLSX spreadsheet binary
 */
export async function bulkUploadClients(file: File): Promise<BulkUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return client.post<any, BulkUploadResponse>("/bulk-upload/clients", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/**
 * Downloads the offline CSV templates directly as a blob.
 */
export async function getBulkUploadTemplateBlob(): Promise<Blob> {
  return client.get<any, Blob>("/bulk-upload/clients/template", {
    responseType: "blob",
  });
}
