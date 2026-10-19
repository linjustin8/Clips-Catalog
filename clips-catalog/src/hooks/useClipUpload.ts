import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import useAuth from "./useAuth";
import { Clip } from "../types/clip";
import { compressVideo, CompressionProgress, MAX_VIDEO_BYTES } from "../utils/compressVideo";
import { getVideoContentType } from "../utils/videoFiles";

export type { Clip } from "../types/clip";

const CLIPS_API_URL = "/api/clips";

export type UploadStatus =
  | "idle"
  | "preparing"
  | "compressing"
  | "cancelled"
  | "requesting-url"
  | "uploading"
  | "saving"
  | "success"
  | "error";

interface UploadClipParams {
  file: File;
  title: string;
  categories?: string[];
}

interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresIn: number;
  maxFileSizeBytes: number;
}

interface CompleteUploadResponse {
  clip: Clip;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : "Video upload failed";
};

const useClipUpload = () => {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [compressionSizes, setCompressionSizes] = useState<{ original: number; compressed: number } | null>(null);
  const activeUpload = useRef<AbortController | null>(null);

  useEffect(() => () => {
    activeUpload.current?.abort();
    activeUpload.current = null;
  }, []);

  const reset = useCallback(() => {
    if (activeUpload.current) return;
    setStatus("idle");
    setProgress(0);
    setError(null);
    setCompressionProgress(null);
    setCompressionSizes(null);
  }, []);

  const canCancel = status === "preparing" || status === "compressing";
  const cancel = useCallback(() => {
    if (canCancel) activeUpload.current?.abort();
  }, [canCancel]);

  const uploadClip = useCallback(
    async ({ file, title, categories = [] }: UploadClipParams) => {
      if (activeUpload.current) throw new Error("An upload is already in progress");
      const controller = new AbortController();
      activeUpload.current = controller;
      const { signal } = controller;
      setError(null);
      setProgress(0);
      setCompressionProgress(null);
      setCompressionSizes(null);

      try {
        if (!accessToken) {
          throw new Error("You must be signed in to upload a video");
        }

        if (!title.trim()) {
          throw new Error("A title is required");
        }

        const contentType = getVideoContentType(file);
        if (!contentType) {
          throw new Error("Choose an MP4, MOV, WebM, or MKV video.");
        }
        const uploadFile = file.type === contentType ? file : new File([file], file.name, { type: contentType, lastModified: file.lastModified });

        setStatus("preparing");
        const preparedFile = await compressVideo(uploadFile, {
          signal,
          onProgress: (update) => {
            if (signal.aborted) return;
            setStatus(update.stage);
            setCompressionProgress(update);
          },
        });
        signal.throwIfAborted();
        if (preparedFile.size < 1 || preparedFile.size > MAX_VIDEO_BYTES) {
          throw new Error("The prepared video must be between 1 byte and 100 MB. Try a shorter clip.");
        }
        if (preparedFile !== uploadFile) setCompressionSizes({ original: file.size, compressed: preparedFile.size });

        const authorization = { Authorization: `Bearer ${accessToken}` };

        setStatus("requesting-url");
        const { data: upload } = await axios.post<PresignedUploadResponse>(
          `${CLIPS_API_URL}/upload-url`,
          {
            filename: preparedFile.name,
            contentType: preparedFile.type,
            fileSize: preparedFile.size,
          },
          { headers: authorization, signal }
        );
        signal.throwIfAborted();
        if (preparedFile.size > upload.maxFileSizeBytes) {
          throw new Error("The server's upload limit is smaller than this video. Try a shorter clip.");
        }

        setStatus("uploading");
        await axios.put(upload.uploadUrl, preparedFile, {
          headers: upload.headers,
          signal,
          onUploadProgress: ({ loaded, total }) => {
            if (signal.aborted) return;
            const uploadSize = total ?? preparedFile.size;
            setProgress(Math.min(100, Math.round((loaded / uploadSize) * 100)));
          },
        });
        signal.throwIfAborted();

        setStatus("saving");
        const { data } = await axios.post<CompleteUploadResponse>(
          `${CLIPS_API_URL}/complete`,
          {
            key: upload.key,
            title: title.trim(),
            categories,
          },
          { headers: authorization, signal }
        );
        signal.throwIfAborted();

        setProgress(100);
        setStatus("success");
        return data.clip;
      } catch (caughtError) {
        if (signal.aborted) {
          if (activeUpload.current === controller) {
            setStatus("cancelled");
            setCompressionProgress(null);
          }
          throw caughtError;
        }
        const message = getErrorMessage(caughtError);
        setError(message);
        setStatus("error");
        throw caughtError;
      } finally {
        if (activeUpload.current === controller) activeUpload.current = null;
      }
    },
    [accessToken]
  );

  return {
    uploadClip,
    reset,
    cancel,
    canCancel,
    compressionProgress,
    compressionSizes,
    canUpload: Boolean(accessToken),
    isUploading:
      status === "preparing" ||
      status === "compressing" ||
      status === "requesting-url" ||
      status === "uploading" ||
      status === "saving",
    status,
    progress,
    error,
  };
};

export default useClipUpload;
