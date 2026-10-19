// Kept behind a dynamic import so ordinary uploads do not load FFmpeg.
export { FFmpeg, FFFSType } from "@ffmpeg/ffmpeg";
export { default as coreURL } from "@ffmpeg/core?url";
export { default as wasmURL } from "@ffmpeg/core/wasm?url";
