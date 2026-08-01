import client from "../client";

export interface UploadResponse {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads a file (multipart/form-data) directly to the backend.
 * @param file Binary file object from file input
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return client.post<any, UploadResponse>("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
