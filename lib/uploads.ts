import { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const MAX_FILES = 2;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface UploadedFileMeta {
  name: string;
  path: string;
  url: string;
  size: number;
  uploaded_at: string;
}

export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) {
    return `You can upload at most ${MAX_FILES} files.`;
  }
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" is larger than 5MB. Please upload files under 5MB.`;
    }
  }
  return null;
}

// Uploads the given files to the shared "attachments" bucket under
// `${folder}/` and returns their public URLs + metadata.
export async function uploadFilesToStorage(
  supabaseAdmin: SupabaseClient,
  files: File[],
  folder: string
): Promise<UploadedFileMeta[]> {
  const uploaded: UploadedFileMeta[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from("attachments")
      .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });

    if (error) throw new Error(`Failed to upload "${file.name}": ${error.message}`);

    const { data: publicUrlData } = supabaseAdmin.storage.from("attachments").getPublicUrl(path);

    uploaded.push({
      name: file.name,
      path,
      url: publicUrlData.publicUrl,
      size: file.size,
      uploaded_at: new Date().toISOString(),
    });
  }

  return uploaded;
}
