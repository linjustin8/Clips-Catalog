import { expect, it } from "vitest";
import { getVideoContentType } from "./videoFiles";

it("recognizes supported MIME types and missing MKV MIME types", () => {
  expect(getVideoContentType({ name: "clip.mp4", type: "video/mp4" })).toBe("video/mp4");
  expect(getVideoContentType({ name: "CLIP.MKV", type: "" })).toBe("video/x-matroska");
  expect(getVideoContentType({ name: "clip.mkv", type: "application/octet-stream" })).toBe("video/x-matroska");
  expect(getVideoContentType({ name: "clip.mkv", type: "video/matroska" })).toBe("video/x-matroska");
});

it("rejects unsupported extensions and explicit non-video MIME types", () => {
  expect(getVideoContentType({ name: "clip.exe", type: "" })).toBeNull();
  expect(getVideoContentType({ name: "clip.mp4", type: "text/plain" })).toBeNull();
});
