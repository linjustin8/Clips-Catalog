import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faFileVideo,
} from "@fortawesome/free-solid-svg-icons";
import useClipUpload from "../../hooks/useClipUpload";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
];

const formatFileSize = (bytes: number) => {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
};

const UploadModal = ({ open, onClose }: UploadModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    uploadClip,
    reset,
    status,
    progress,
    error,
    isUploading,
    maxFileSizeBytes,
  } = useClipUpload();

  useEffect(() => {
    if (!open) {
      setFile(null);
      setTitle("");
      setCategories("");
      setIsDragging(false);
      setFileError(null);
      reset();
    }
  }, [open, reset]);

  const selectFile = (selectedFile?: File) => {
    if (!selectedFile || isUploading) return;

    setFile(selectedFile);
    setFileError(null);

    if (!ACCEPTED_VIDEO_TYPES.includes(selectedFile.type)) {
      setFileError("Choose an MP4, MOV, WebM, or MKV video.");
      return;
    }

    if (selectedFile.size > maxFileSizeBytes) {
      setFileError(
        "This test uploader requires a file at or below 100 MB. Automatic compression is the next step."
      );
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleUpload = async () => {
    if (!file || fileError || !title.trim()) return;

    try {
      await uploadClip({
        file,
        title,
        categories: categories
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean),
      });
    } catch {
      // The hook exposes the request error for the modal to render.
    }
  };

  const handleClose = () => {
    if (!isUploading) onClose();
  };

  const statusLabel =
    status === "requesting-url"
      ? "Preparing secure upload…"
      : status === "uploading"
        ? `Uploading to S3… ${progress}%`
        : status === "saving"
          ? "Saving clip details…"
          : null;

  const canSubmit = Boolean(file && title.trim() && !fileError && !isUploading);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            color: "rgba(255, 255, 255, 0.87)",
            bgcolor: "#1b183f",
            backgroundImage: "none",
            border: "1px solid #2a2f41",
            borderRadius: 1,
            boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
          },
        },
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 800, fontFamily: "inherit" }}>
        Upload a clip
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => !isUploading && inputRef.current?.click()}
            onKeyDown={handleDropzoneKeyDown}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
            sx={{
              minHeight: 190,
              px: 3,
              py: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.25,
              textAlign: "center",
              cursor: isUploading ? "default" : "pointer",
              borderRadius: 2.5,
              border: "2px dashed",
              borderColor: isDragging
                ? "#8578ff"
                : "#6c6c6c",
              bgcolor: isDragging
                ? "#343d76"
                : "#201b50",
              transition: "border-color 160ms ease, background-color 160ms ease",
              "&:hover, &:focus-visible": {
                borderColor: "#8578ff",
                bgcolor: "#343d76",
                outline: "none",
              },
            }}
          >
            <FontAwesomeIcon
              icon={file ? faFileVideo : faCloudArrowUp}
              style={{ height: 42, color: "#8578ff" }}
            />
            {file ? (
              <>
                <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                  {file.name}
                </Typography>
                <Chip
                  size="small"
                  label={formatFileSize(file.size)}
                  sx={{
                    color: "rgba(255, 255, 255, 0.87)",
                    bgcolor: "#4a3eb9",
                  }}
                />
                <Typography variant="caption" sx={{ color: "rgb(167, 167, 167)" }}>
                  Click or drop another file to replace it
                </Typography>
              </>
            ) : (
              <>
                <Typography sx={{ fontWeight: 700 }}>
                  Drag and drop your video here
                </Typography>
                <Typography variant="body2" sx={{ color: "rgb(167, 167, 167)" }}>
                  or click to choose a file
                </Typography>
                <Typography variant="caption" sx={{ color: "rgb(112, 112, 112)" }}>
                  MP4, MOV, WebM, or MKV · maximum 100 MB
                </Typography>
              </>
            )}
            <input
              ref={inputRef}
              hidden
              type="file"
              accept={ACCEPTED_VIDEO_TYPES.join(",")}
              onChange={handleFileInput}
            />
          </Box>

          {fileError && <Alert severity="warning">{fileError}</Alert>}

          <Alert
            severity="info"
            sx={{
              color: "rgba(255, 255, 255, 0.87)",
              bgcolor: "#1d2c55",
              border: "1px solid #0b1448",
              "& .MuiAlert-icon": { color: "#a59bff" },
            }}
          >
            Videos larger than 100 MB will eventually be compressed in your browser
            before upload. For this initial test, select a video that is already 100 MB
            or smaller.
          </Alert>

          <TextField
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            disabled={isUploading}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 120 } }}
            sx={textFieldStyles}
          />
          <TextField
            label="Categories"
            value={categories}
            onChange={(event) => setCategories(event.target.value)}
            placeholder="gameplay, highlights"
            helperText="Separate categories with commas"
            disabled={isUploading}
            fullWidth
            sx={textFieldStyles}
          />

          {statusLabel && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: "#a59bff" }}>
                {statusLabel}
              </Typography>
              <LinearProgress
                variant={status === "uploading" ? "determinate" : "indeterminate"}
                value={progress}
                sx={{
                  height: 7,
                  borderRadius: 10,
                  bgcolor: "#201b50",
                  "& .MuiLinearProgress-bar": { bgcolor: "#5d4ee6" },
                }}
              />
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}
          {status === "success" && (
            <Alert severity="success">Your clip was uploaded successfully.</Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={isUploading}
          sx={{ color: "rgb(167, 167, 167)", fontFamily: "inherit" }}
        >
          {status === "success" ? "Done" : "Cancel"}
        </Button>
        {status !== "success" && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!canSubmit}
            startIcon={<FontAwesomeIcon icon={faCloudArrowUp} />}
            sx={{
              bgcolor: "#5d4ee6",
              fontFamily: "inherit",
              fontWeight: 700,
              "&:hover": { bgcolor: "#4a3eb9" },
              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.3)",
                bgcolor: "#4a3eb999",
              },
            }}
          >
            Upload
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const textFieldStyles = {
  "& .MuiInputLabel-root": {
    color: "rgb(167, 167, 167)",
    fontFamily: "inherit",
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#a59bff" },
  "& .MuiOutlinedInput-root": {
    color: "rgba(255, 255, 255, 0.87)",
    fontFamily: "inherit",
    bgcolor: "#1b183f",
    "& fieldset": { borderColor: "rgb(112, 112, 112)" },
    "&:hover fieldset": { borderColor: "rgb(167, 167, 167)" },
    "&.Mui-focused fieldset": { borderColor: "#a59bff" },
  },
  "& .MuiFormHelperText-root": {
    color: "rgb(167, 167, 167)",
    fontFamily: "inherit",
  },
};

export default UploadModal;
