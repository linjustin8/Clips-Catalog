import { useCallback, useState } from "react";
import axios from "axios";
import useAuth from "./useAuth";
import usePermissions from "./usePermissions";

const CLIPS_API_URL = "/api/clips";
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export type UploadStatus =
  | "idle"
  | "requesting-url"
  | "uploading"
  | "saving"
  | "success"
  | "error";

export interface Clip {
  _id: string;
  title: string;
  uploader: string;
  categories: string[];
  s3Key: string;
  contentType: string;
  fileSize: number;
  uploadDate: string;
  playbackUrl: string;
}

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
  const { isAdmin } = usePermissions();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  const uploadClip = useCallback(
    async ({ file, title, categories = [] }: UploadClipParams) => {
      setError(null);
      setProgress(0);

      try {
        if (!accessToken) {
          throw new Error("You must be signed in to upload a video");
        }

        if (!isAdmin) {
          throw new Error("Only administrators can upload videos");
        }

        if (!title.trim()) {
          throw new Error("A title is required");
        }

        if (!file.type.startsWith("video/")) {
          throw new Error("Please select a video file");
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error("Compress the video to 100 MB or less before uploading");
        }

        const authorization = { Authorization: `Bearer ${accessToken}` };

        setStatus("requesting-url");
        const { data: upload } = await axios.post<PresignedUploadResponse>(
          `${CLIPS_API_URL}/upload-url`,
          {
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          },
          { headers: authorization }
        );

        setStatus("uploading");
        await axios.put(upload.uploadUrl, file, {
          headers: upload.headers,
          onUploadProgress: ({ loaded, total }) => {
            const uploadSize = total ?? file.size;
            setProgress(Math.min(100, Math.round((loaded / uploadSize) * 100)));
          },
        });

        setStatus("saving");
        const { data } = await axios.post<CompleteUploadResponse>(
          `${CLIPS_API_URL}/complete`,
          {
            key: upload.key,
            title: title.trim(),
            categories,
          },
          { headers: authorization }
        );

        setProgress(100);
        setStatus("success");
        return data.clip;
      } catch (caughtError) {
        const message = getErrorMessage(caughtError);
        setError(message);
        setStatus("error");
        throw caughtError;
      }
    },
    [accessToken, isAdmin]
  );

  return {
    uploadClip,
    reset,
    canUpload: Boolean(accessToken && isAdmin),
    isUploading:
      status === "requesting-url" ||
      status === "uploading" ||
      status === "saving",
    status,
    progress,
    error,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  };
};

export default useClipUpload;
