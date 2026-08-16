import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Clip } from "../../types/clip";

interface VideoPlayerModalProps {
  clip: Clip | null;
  onClose: () => void;
}

const VideoPlayerModal = ({ clip, onClose }: VideoPlayerModalProps) => (
  <Dialog
    open={Boolean(clip)}
    onClose={onClose}
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
        <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>{clip.title}</DialogTitle>
        <IconButton
          onClick={onClose}
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
            Uploaded {new Date(clip.uploadDate).toLocaleDateString()}
          </Typography>
        </DialogContent>
      </>
    )}
  </Dialog>
);

export default VideoPlayerModal;
