// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import useClipUpload from "./useClipUpload";
import { compressVideo, MAX_VIDEO_BYTES } from "../utils/compressVideo";

vi.mock("./useAuth", () => ({ default: () => ({ accessToken: "test-token" }) }));
vi.mock("./usePermissions", () => ({ default: () => ({ isAdmin: true }) }));
vi.mock("../utils/compressVideo", async (importOriginal) => ({
  ...await importOriginal<typeof import("../utils/compressVideo")>(), compressVideo: vi.fn(),
}));
vi.mock("axios", () => ({ default: { post: vi.fn(), put: vi.fn(), isAxiosError: () => false } }));

const source = new File(["original"], "clip.mov", { type: "video/quicktime" });
const compressed = new File(["compressed"], "clip.mp4", { type: "video/mp4" });
const params = { file: source, title: " Clip ", categories: ["gameplay"] };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(compressVideo).mockResolvedValue(compressed);
  vi.mocked(axios.post).mockResolvedValueOnce({ data: {
    uploadUrl: "https://s3.test/upload", key: "clips/test/clip.mp4",
    headers: { "Content-Type": "video/mp4" }, maxFileSizeBytes: MAX_VIDEO_BYTES,
  } }).mockResolvedValueOnce({ data: { clip: { _id: "clip-id" } } });
  vi.mocked(axios.put).mockResolvedValue({});
});
afterEach(cleanup);

it("uploads the prepared bytes and metadata and then saves the clip", async () => {
  const { result } = renderHook(useClipUpload);
  await act(async () => { await result.current.uploadClip(params); });
  expect(axios.post).toHaveBeenNthCalledWith(1, "/api/clips/upload-url", {
    filename: "clip.mp4", contentType: "video/mp4", fileSize: compressed.size,
  }, expect.any(Object));
  expect(axios.put).toHaveBeenCalledWith("https://s3.test/upload", compressed, expect.objectContaining({ headers: { "Content-Type": "video/mp4" } }));
  expect(axios.post).toHaveBeenNthCalledWith(2, "/api/clips/complete", {
    key: "clips/test/clip.mp4", title: "Clip", categories: ["gameplay"],
  }, expect.any(Object));
  expect(result.current.status).toBe("success");
  expect(result.current.compressionSizes).toEqual({ original: source.size, compressed: compressed.size });
});

it("normalizes a missing MKV MIME type without claiming smaller files were compressed", async () => {
  vi.mocked(compressVideo).mockImplementation(async (file) => file);
  const { result } = renderHook(useClipUpload);
  await act(async () => {
    await result.current.uploadClip({ ...params, file: new File(["original"], "small.mkv") });
  });
  expect(axios.post).toHaveBeenNthCalledWith(1, "/api/clips/upload-url", {
    filename: "small.mkv", contentType: "video/x-matroska", fileSize: source.size,
  }, expect.any(Object));
  expect(result.current.compressionSizes).toBeNull();
});

it("waits for compression to finish before requesting a signed URL", async () => {
  let finish: (file: File) => void = () => {};
  vi.mocked(compressVideo).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const { result } = renderHook(useClipUpload);
  let upload: Promise<unknown>;
  act(() => { upload = result.current.uploadClip(params); });
  expect(axios.post).not.toHaveBeenCalled();
  await act(async () => { finish(compressed); await upload; });
  expect(result.current.status).toBe("success");
});

it.each(["failure", "oversized", "empty"])("never contacts S3 on %s output", async (failure) => {
  if (failure === "failure") vi.mocked(compressVideo).mockRejectedValue(new Error("compression failed"));
  else {
    const badOutput = new File([], "bad.mp4", { type: "video/mp4" });
    Object.defineProperty(badOutput, "size", { value: failure === "empty" ? 0 : MAX_VIDEO_BYTES + 1 });
    vi.mocked(compressVideo).mockResolvedValue(badOutput);
  }
  const { result } = renderHook(useClipUpload);
  await act(async () => { await expect(result.current.uploadClip(params)).rejects.toThrow(); });
  expect(axios.post).not.toHaveBeenCalled();
  expect(axios.put).not.toHaveBeenCalled();
  expect(result.current.status).toBe("error");
});

it("cancels preparation and permits a fresh retry without uploading the cancelled file", async () => {
  vi.mocked(compressVideo).mockImplementationOnce((_file, { signal } = {}) => new Promise((_, reject) => {
    signal?.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")));
  }));
  const { result } = renderHook(useClipUpload);
  let upload: Promise<unknown>;
  act(() => { upload = result.current.uploadClip(params).catch((error: unknown) => error); });
  await waitFor(() => expect(result.current.canCancel).toBe(true));
  await act(async () => { result.current.cancel(); await upload; });
  expect(result.current.status).toBe("cancelled");
  expect(axios.post).not.toHaveBeenCalled();
  await act(async () => { await result.current.uploadClip(params); });
  expect(result.current.status).toBe("success");
});

it("guards duplicate submissions and aborts on unmount", async () => {
  let signal: AbortSignal | undefined;
  vi.mocked(compressVideo).mockImplementationOnce((_file, options = {}) => new Promise((_, reject) => {
    signal = options.signal;
    signal?.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")));
  }));
  const { result, unmount } = renderHook(useClipUpload);
  let upload: Promise<unknown>;
  act(() => { upload = result.current.uploadClip(params).catch((error: unknown) => error); });
  await expect(result.current.uploadClip(params)).rejects.toThrow("already in progress");
  unmount();
  await upload!;
  expect(signal?.aborted).toBe(true);
  expect(axios.post).not.toHaveBeenCalled();
});
