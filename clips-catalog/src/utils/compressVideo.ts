export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const TARGET_VIDEO_BYTES = 95 * 1024 * 1024;
const AUDIO_BITRATE = 128_000;
const MIN_VIDEO_BITRATE = 100_000;
const MAX_ATTEMPTS = 3;

export interface CompressionProgress {
  stage: "preparing" | "compressing";
  percent: number | null;
  attempt: number;
}

interface CompressionOptions {
  signal?: AbortSignal;
  onProgress?: (progress: CompressionProgress) => void;
}

interface ProbeResult {
  format?: { duration?: string };
  streams?: Array<{
    index: number;
    codec_type?: string;
    width?: number;
    height?: number;
    disposition?: { attached_pic?: number };
  }>;
}

export function calculateVideoBitrate(duration: number, hasAudio: boolean) {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Cannot read this video's duration. Try exporting it as an MP4.");
  }
  const bitrate = Math.floor(TARGET_VIDEO_BYTES * 8 / duration) - (hasAudio ? AUDIO_BITRATE : 0);
  if (bitrate < MIN_VIDEO_BITRATE) {
    throw new Error("This video is too long to fit within 100 MB. Trim it into shorter clips and try again.");
  }
  return bitrate;
}

export async function compressVideo(file: File, { signal, onProgress }: CompressionOptions = {}): Promise<File> {
  signal?.throwIfAborted();
  if (file.size === 0) throw new Error("This video is empty. Choose another file.");
  if (file.size <= MAX_VIDEO_BYTES) return file;

  onProgress?.({ stage: "preparing", percent: null, attempt: 0 });
  const { FFmpeg, FFFSType, coreURL, wasmURL } = await import("./videoEncoder");
  signal?.throwIfAborted();
  const ffmpeg = new FFmpeg();
  const abort = () => ffmpeg.terminate();
  signal?.addEventListener("abort", abort, { once: true });
  let attempt = 0;
  let duration = 0;
  let encoding = false;
  let lastPercent = 0;
  const progress = ({ time }: { time: number }) => {
    // Core timing can carry over between exec calls; retries use an
    // indeterminate indicator instead of a misleading percentage.
    if (!encoding || signal?.aborted || attempt > 1) return;
    // FFmpeg reports encoded time in microseconds. Do not show completion
    // until the output has passed its size and duration checks.
    if (!Number.isFinite(time) || time < 0) return;
    lastPercent = Math.max(lastPercent, Math.min(99, Math.round(time / 1_000_000 / duration * 100)));
    onProgress?.({ stage: "compressing", percent: lastPercent, attempt });
  };
  ffmpeg.on("progress", progress);
  let loadTimeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      ffmpeg.load({ coreURL, wasmURL }),
      new Promise<never>((_, reject) => {
        loadTimeout = setTimeout(() => {
          reject(new Error("The video compressor could not load. Check your connection and try again."));
          ffmpeg.terminate();
        }, 60_000);
      }),
    ]);
    clearTimeout(loadTimeout);
    signal?.throwIfAborted();
    await ffmpeg.createDir("/input");
    // WORKERFS reads the File on demand instead of copying the entire original
    // into WebAssembly memory. Use a fixed name for safe FFmpeg arguments.
    const source = new File([file], "source", { type: file.type });
    if (!await ffmpeg.mount(FFFSType.WORKERFS, { files: [source] }, "/input")) {
      throw new Error("Your browser could not open this video for compression. Try another device.");
    }

    const probe = async (input: string): Promise<ProbeResult> => {
      const code = await ffmpeg.ffprobe([
        "-v", "error", "-show_error", "-show_format", "-show_streams", "-of", "json",
        input, "-o", "/probe.json",
      ], 60_000);
      // core 0.12.10 can return -1 even after a successful ffprobe run
      // (upstream issue #817). Require valid metadata, not just an exit code.
      if (code !== 0 && code !== -1) throw new Error("Cannot read this video. Try exporting it as an MP4.");
      const json = await ffmpeg.readFile("/probe.json", "utf8");
      await ffmpeg.deleteFile("/probe.json");
      const result = JSON.parse(String(json)) as ProbeResult & { error?: unknown };
      if (result.error || !result.streams?.length || !Number.isFinite(Number(result.format?.duration)) || Number(result.format?.duration) <= 0) {
        throw new Error("Cannot read this video. Try exporting it as an MP4.");
      }
      return result;
    };

    const metadata = await probe("/input/source");
    const video = metadata.streams?.find((stream) => stream.codec_type === "video" && !stream.disposition?.attached_pic);
    if (!video?.width || !video.height) throw new Error("No readable video track was found. Choose another video.");
    duration = Number(metadata.format?.duration);
    const audio = metadata.streams?.find((stream) => stream.codec_type === "audio");
    let bitrate = calculateVideoBitrate(duration, Boolean(audio));

    for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      signal?.throwIfAborted();
      lastPercent = 0;
      encoding = true;
      onProgress?.({ stage: "compressing", percent: attempt === 1 ? 0 : null, attempt });
      const code = await ffmpeg.exec([
        "-i", "/input/source", "-map", `0:${video.index}`,
        ...(audio ? ["-map", `0:${audio.index}`, "-c:a", "aac", "-b:a", String(AUDIO_BITRATE), "-ac", "2"] : ["-an"]),
        "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-b:v", String(bitrate),
        "-vf", "scale=w='min(iw,if(gte(iw,ih),1920,1080))':h='min(ih,if(gte(iw,ih),1080,1920))':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-fps_mode", "passthrough", "-movflags", "+faststart", "/output.mp4",
      ], 30 * 60_000);
      encoding = false;
      signal?.throwIfAborted();
      if (code !== 0) throw new Error("Video compression failed or took too long. Try a shorter clip or another device.");

      const data = await ffmpeg.readFile("/output.mp4");
      if (typeof data === "string" || data.byteLength === 0) throw new Error("Compression produced an empty video. Try another file.");
      const size = data.byteLength;
      if (size <= MAX_VIDEO_BYTES) {
        const output = await probe("/output.mp4");
        const outputDuration = Number(output.format?.duration);
        if (!Number.isFinite(outputDuration) || Math.abs(outputDuration - duration) > 1) {
          throw new Error("The compressed video did not preserve the full duration. Try exporting the original as an MP4.");
        }
        signal?.throwIfAborted();
        const result = new File([data], `${file.name.replace(/\.[^.]+$/, "") || "video"}.mp4`, { type: "video/mp4" });
        onProgress?.({ stage: "compressing", percent: 100, attempt });
        return result;
      }

      await ffmpeg.deleteFile("/output.mp4");
      const audioBitrate = audio ? AUDIO_BITRATE : 0;
      bitrate = Math.floor((bitrate + audioBitrate) * TARGET_VIDEO_BYTES / size * 0.9 - audioBitrate);
      if (bitrate < MIN_VIDEO_BITRATE) break;
    }
    throw new Error("Could not compress this video below 100 MB. Trim it into shorter clips and try again.");
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof Error && !(error instanceof WebAssembly.RuntimeError) && !(error instanceof RangeError)) throw error;
    throw new Error("Your browser could not compress this video. Try a shorter clip or a device with more memory.");
  } finally {
    clearTimeout(loadTimeout);
    signal?.removeEventListener("abort", abort);
    ffmpeg.off("progress", progress);
    // Termination releases all mounts, temporary files, and WASM memory,
    // including after failures where filesystem commands may no longer work.
    ffmpeg.terminate();
  }
}
