import { useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Clip } from "../../types/clip";
import useAuth from "../../hooks/useAuth";

interface VideoPlayerModalProps {
  clip: Clip | null;
  onClose: () => void;
  onDeleted: (clipId: string) => void;
}

const VideoPlayerModal = ({ clip, ...props }: VideoPlayerModalProps) => clip ? (
  <ClipPlayer key={clip._id} clip={clip} {...props} />
) : null;

const ClipPlayer = ({ clip, onClose, onDeleted }: Omit<VideoPlayerModalProps, "clip"> & { clip: Clip }) => {
  const { user, accessToken } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletePending = useRef(false);
  const canDelete = Boolean(accessToken && user?.id === clip.uploader);

  const handleClose = () => {
    if (!deletePending.current) onClose();
  };

  const handleDelete = async () => {
    if (!canDelete || !confirmingDelete || deletePending.current) return;
    deletePending.current = true;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await axios.delete(`/api/clips/${encodeURIComponent(clip._id)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      onDeleted(clip._id);
      onClose();
    } catch (error) {
      setDeleteError(
        axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message ?? "Could not delete this clip. Please try again."
          : "Could not delete this clip. Please try again."
      );
    } finally {
      deletePending.current = false;
      setIsDeleting(false);
    }
  };

  return (
  <Dialog
    open
    onClose={handleClose}
    aria-labelledby="clip-player-title"
    fullWidth
    maxWidth="md"
    slotProps={{
      paper: {
        sx: {
          bgcolor: "#1b183f",
          backgroundImage: "none",
          border: "1px solid #2a2f41",
        },
      },
      backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.5)" } },
    }}
  >
    {clip && (
      <>
        <DialogTitle id="clip-player-title" sx={{ pr: 7, fontWeight: 800 }}>{clip.title}</DialogTitle>
        <IconButton
          onClick={handleClose}
          disabled={isDeleting}
          aria-label="Close video"
          sx={{ position: "absolute", top: 10, right: 10, color: "text.secondary" }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </IconButton>
        <DialogContent sx={{ pt: 1 }}>
          <Box
            component="video"
            key={clip._id}
            src={clip.playbackUrl}
            controls
            autoPlay
            playsInline
            sx={{
              display: "block",
              width: "100%",
              maxHeight: "70vh",
              bgcolor: "#0f1224",
              borderRadius: 1,
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ mt: 2, flexWrap: "wrap" }}
          >
            {clip.categories.map((category) => (
              <Chip
                key={category}
                label={category}
                size="small"
                sx={{ bgcolor: "#201b50", color: "#a59bff" }}
              />
            ))}
          </Stack>
          <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
            Uploaded by {clip.uploaderUsername || "Unknown uploader"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            Uploaded {new Date(clip.uploadDate).toLocaleDateString()}
          </Typography>
          {canDelete && (
            <Stack spacing={1.5} sx={{ mt: 2, pt: 2, borderTop: "1px solid #2a2f41" }}>
              {deleteError && <Alert severity="error">{deleteError}</Alert>}
              {confirmingDelete ? (
                <>
                  <Typography variant="body2">
                    Delete this clip and its video permanently? This cannot be undone.
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                    <Button
                      disabled={isDeleting}
                      onClick={() => {
                        setConfirmingDelete(false);
                        setDeleteError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button color="error" variant="contained" disabled={isDeleting} onClick={handleDelete}>
                      {isDeleting ? "Deleting…" : "Delete permanently"}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Button
                  color="error"
                  startIcon={<FontAwesomeIcon icon={faTrash} />}
                  onClick={() => setConfirmingDelete(true)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Delete clip
                </Button>
              )}
            </Stack>
          )}
        </DialogContent>
      </>
    )}
  </Dialog>
  );
};

export default VideoPlayerModal;
