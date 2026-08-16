import { useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlay, faFilm } from "@fortawesome/free-solid-svg-icons";
import { Clip } from "../../types/clip";

interface ClipCardProps {
  clip: Clip;
  onClick: (clip: Clip) => void;
}

const ClipCard = ({ clip, onClick }: ClipCardProps) => {
  const [previewFailed, setPreviewFailed] = useState(false);

  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        bgcolor: "#1b203f",
        border: "1px solid #2a2f41",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        "&:hover": {
          zIndex: 1,
          transform: "translateY(-4px) scale(1.025)",
          borderColor: "#5d4ee6",
          boxShadow: "0 10px 24px rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <CardActionArea
        onClick={() => onClick(clip)}
        aria-label={`Play ${clip.title}`}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <Box
          sx={{
            position: "relative",
            aspectRatio: "16 / 9",
            overflow: "hidden",
            bgcolor: "#110f27",
          }}
        >
          {!previewFailed ? (
            <Box
              component="video"
              src={clip.playbackUrl}
              muted
              playsInline
              preload="metadata"
              onError={() => setPreviewFailed(true)}
              sx={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                pointerEvents: "none",
              }}
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "#6c6c6c",
                fontSize: 42,
              }}
            >
              <FontAwesomeIcon icon={faFilm} />
            </Box>
          )}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "rgba(255, 255, 255, 0.87)",
              fontSize: 42,
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0) 60%)",
              opacity: 0.86,
              transition: "opacity 180ms ease, transform 180ms ease",
              ".MuiCard-root:hover &": { opacity: 1, transform: "scale(1.08)" },
            }}
          >
            <FontAwesomeIcon icon={faCirclePlay} />
          </Box>
        </Box>

        <CardContent sx={{ width: "100%", flexGrow: 1, p: 2 }}>
          <Typography noWrap sx={{ fontWeight: 700, mb: 1 }}>
            {clip.title}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {clip.categories.slice(0, 3).map((category) => (
              <Chip
                key={category}
                label={category}
                size="small"
                sx={{ bgcolor: "#201b50", color: "#a59bff" }}
              />
            ))}
          </Stack>
          <Typography variant="caption" sx={{ display: "block", mt: 1.25, color: "text.secondary" }}>
            {new Date(clip.uploadDate).toLocaleDateString()}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ClipCard;
