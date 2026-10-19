const VIDEO_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
};

export const VIDEO_FILE_ACCEPT = [...Object.values(VIDEO_TYPES), ...Object.keys(VIDEO_TYPES).map((extension) => `.${extension}`)].join(",");

export function getVideoContentType(file: Pick<File, "name" | "type">): string | null {
  if (Object.values(VIDEO_TYPES).includes(file.type)) return file.type;
  // Some browsers report MKV as an empty or generic MIME type. Normalize only
  // known extensions; oversized files still have their contents probed.
  if (!file.type || file.type === "application/octet-stream" || file.type === "video/matroska") {
    return Object.entries(VIDEO_TYPES).find(([extension]) => file.name.toLowerCase().endsWith(`.${extension}`))?.[1] ?? null;
  }
  return null;
}
