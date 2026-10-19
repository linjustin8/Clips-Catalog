import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateVideoBitrate, compressVideo, MAX_VIDEO_BYTES, TARGET_VIDEO_BYTES } from "./compressVideo";

const mock = vi.hoisted(() => ({
  create: vi.fn(), load: vi.fn(), createDir: vi.fn(), mount: vi.fn(),
  ffprobe: vi.fn(), readFile: vi.fn(), deleteFile: vi.fn(), exec: vi.fn(),
  on: vi.fn(), off: vi.fn(), terminate: vi.fn(),
}));
vi.mock("./videoEncoder", () => ({
  FFmpeg: class { constructor() { mock.create(); return mock; } },
  FFFSType: { WORKERFS: "WORKERFS" }, coreURL: "/core.js", wasmURL: "/core.wasm",
}));

const metadata = (hasAudio = true, duration = "60") => JSON.stringify({
  format: { duration },
  streams: [{ index: 0, codec_type: "video", width: 1920, height: 1080 },
    ...(hasAudio ? [{ index: 1, codec_type: "audio" }] : [])],
});

function input(size = MAX_VIDEO_BYTES + 1) {
  const file = new File(["source"], "clip.mov", { type: "video/quicktime" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

beforeEach(() => {
  vi.resetAllMocks();
  mock.load.mockResolvedValue(true);
  mock.mount.mockResolvedValue(true);
  mock.ffprobe.mockResolvedValue(0);
  mock.exec.mockResolvedValue(0);
  mock.readFile.mockImplementation(async (path: string) => path === "/probe.json" ? metadata() : new Uint8Array([1, 2, 3]));
});

describe("compressVideo", () => {
  it.each([1, MAX_VIDEO_BYTES - 1, MAX_VIDEO_BYTES])("passes through %i-byte files without loading FFmpeg", async (size) => {
    const file = input(size);
    expect(await compressVideo(file)).toBe(file);
    expect(mock.create).not.toHaveBeenCalled();
  });

  it("rejects empty files", async () => {
    await expect(compressVideo(input(0))).rejects.toThrow("empty");
  });

  it("budgets audio and container overhead", () => {
    expect(calculateVideoBitrate(60, true)).toBe(Math.floor(TARGET_VIDEO_BYTES * 8 / 60) - 128_000);
    expect(calculateVideoBitrate(60, false)).toBe(Math.floor(TARGET_VIDEO_BYTES * 8 / 60));
    for (const duration of [0, NaN, Infinity, -1, 100_000]) expect(() => calculateVideoBitrate(duration, true)).toThrow();
  });

  it("mounts originals, produces MP4, and releases the worker", async () => {
    const onProgress = vi.fn();
    const output = await compressVideo(input(), { onProgress });
    expect(output.name).toBe("clip.mp4");
    expect(output.type).toBe("video/mp4");
    expect(output.size).toBe(3);
    expect(mock.mount).toHaveBeenCalledWith("WORKERFS", { files: [expect.any(File)] }, "/input");
    const args = mock.exec.mock.calls[0][0] as string[];
    expect(args).toContain("libx264");
    expect(args).toContain("passthrough");
    expect(args).not.toContain("-fs");
    expect(args).not.toContain("-t");
    expect(onProgress).toHaveBeenLastCalledWith({ stage: "compressing", percent: 100, attempt: 1 });
    expect(mock.terminate).toHaveBeenCalledOnce();
    expect(mock.off).toHaveBeenCalled();
  });

  it("supports videos without audio", async () => {
    mock.readFile.mockImplementation(async (path: string) => path === "/probe.json" ? metadata(false) : new Uint8Array([1]));
    await compressVideo(input());
    expect(mock.exec.mock.calls[0][0]).toContain("-an");
    expect(mock.exec.mock.calls[0][0]).not.toContain("-c:a");
  });

  it("handles ffprobe's documented -1 result only when valid metadata exists", async () => {
    mock.ffprobe.mockResolvedValue(-1);
    expect((await compressVideo(input())).type).toBe("video/mp4");
    mock.readFile.mockResolvedValue('{"error":{"code":-1}}');
    await expect(compressVideo(input())).rejects.toThrow("Cannot read");
  });

  it("retries oversized outputs at lower bitrates and stops after three attempts", async () => {
    const oversized = new Uint8Array(0);
    Object.defineProperty(oversized, "byteLength", { value: MAX_VIDEO_BYTES + 1 });
    mock.readFile.mockImplementation(async (path: string) => path === "/probe.json" ? metadata() : oversized);
    await expect(compressVideo(input())).rejects.toThrow("below 100 MB");
    expect(mock.exec).toHaveBeenCalledTimes(3);
    const rates = mock.exec.mock.calls.map((call) => {
      const args = call[0] as string[];
      return Number(args[args.indexOf("-b:v") + 1]);
    });
    expect(rates[1]).toBeLessThan(rates[0]);
    expect(rates[2]).toBeLessThan(rates[1]);
    expect(mock.terminate).toHaveBeenCalledOnce();
  });

  it("accepts a successful retry", async () => {
    const oversized = new Uint8Array(0);
    Object.defineProperty(oversized, "byteLength", { value: MAX_VIDEO_BYTES + 1 });
    let reads = 0;
    mock.readFile.mockImplementation(async (path: string) => path === "/probe.json" ? metadata() : ++reads === 1 ? oversized : new Uint8Array([1]));
    expect((await compressVideo(input())).size).toBe(1);
    expect(mock.exec).toHaveBeenCalledTimes(2);
  });

  it.each(["probe", "encode", "memory", "duration"])("cleans up after %s failures", async (failure) => {
    if (failure === "probe") mock.ffprobe.mockResolvedValue(1);
    if (failure === "encode") mock.exec.mockResolvedValue(1);
    if (failure === "memory") mock.exec.mockRejectedValue(new WebAssembly.RuntimeError("out of memory"));
    if (failure === "duration") {
      let probes = 0;
      mock.readFile.mockImplementation(async (path: string) => path === "/probe.json" ? metadata(true, ++probes === 1 ? "60" : "30") : new Uint8Array([1]));
    }
    await expect(compressVideo(input())).rejects.toThrow();
    expect(mock.terminate).toHaveBeenCalledOnce();
  });

  it("rejects a pre-cancelled operation without loading FFmpeg", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(compressVideo(input(), { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(mock.create).not.toHaveBeenCalled();
  });

  it("terminates an active encoding when cancelled", async () => {
    const controller = new AbortController();
    mock.exec.mockImplementation(async () => {
      controller.abort();
      throw new Error("terminated");
    });
    await expect(compressVideo(input(), { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(mock.terminate).toHaveBeenCalled();
    expect(mock.readFile).not.toHaveBeenCalledWith("/output.mp4");
  });
});
