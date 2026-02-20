import { createServiceClient } from "./supabase";

const BUCKET = "funnel-images";

/**
 * Fetch an external image and re-upload it to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImageFromUrl(
  url: string,
  userId: string
): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "GenFunnel/1.0 (image-proxy)" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const blob = await res.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  // Derive extension from content-type
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
        ? "gif"
        : "jpg";

  const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const sb = createServiceClient();
  const { error } = await sb.storage.from(BUCKET).upload(filename, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Upload a raw file buffer to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string,
  userId: string,
  originalName?: string
): Promise<string> {
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
        ? "gif"
        : "jpg";

  const safeName = originalName
    ? originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50)
    : Math.random().toString(36).slice(2, 8);

  const filename = `${userId}/${Date.now()}-${safeName}.${ext}`;

  const sb = createServiceClient();
  const { error } = await sb.storage.from(BUCKET).upload(filename, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
