import type { Resource } from "./types";
export type ResourceKind = "note" | "link" | "document" | "image";
export function safeResourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function resourceKind(resource: Resource): ResourceKind {
  if (resource.resource_type === "note") return "note";
  const url = safeResourceUrl(resource.resource_url);
  const path = url ? new URL(url).pathname : "";
  if (/\.(pdf|docx?)$/i.test(path)) return "document";
  if (/\.(png|jpe?g|webp|gif)$/i.test(path)) return "image";
  return "link";
}
export function fileSize(size: number): string {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
export const FILE_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif";
export const MAX_PREVIEW_FILE_SIZE = 20 * 1024 * 1024;
export function validatePreviewFile(
  file: Pick<File, "name" | "size" | "type">,
): string | null {
  if (!/\.(pdf|docx?|png|jpe?g|webp|gif)$/i.test(file.name))
    return "Choose a PDF, Word document, or a PNG, JPG, WebP, or GIF image.";
  if (file.size === 0) return "This file is empty. Please choose another file.";
  if (file.size > MAX_PREVIEW_FILE_SIZE)
    return "This file is larger than 20 MB. Please choose a smaller file.";
  // Never render SVG, HTML, or other active content as an image preview.
  if (
    file.type &&
    ![
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ].includes(file.type)
  )
    return "That file format can’t be previewed safely. Please choose a supported document or image.";
  return null;
}
