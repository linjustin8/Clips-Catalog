import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import ClipCard from "../../components/clips/ClipCard";
import ClipCardSkeleton from "../../components/clips/ClipCardSkeleton";
import VideoPlayerModal from "../../components/clips/VideoPlayerModal";
import useClips from "../../hooks/useClips";
import useInfiniteScroll from "../../hooks/useInfiniteScroll";
import { Clip } from "../../types/clip";
import "./Videos.css";

const Videos = () => {
  const {
    clips,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useClips();
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const loadMoreRef = useInfiniteScroll({
    hasMore: hasMore && !error,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  });

  return (
    <Container maxWidth="xl" className="videos-page">
      <Box className="videos-heading">
        <Typography component="h1" variant="h3" sx={{ fontWeight: 900 }}>
          Recent clips
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Browse the latest uploads from the community.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refresh()}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box className="clips-grid" aria-label="Loading clips">
          {Array.from({ length: 12 }, (_, index) => (
            <ClipCardSkeleton key={index} />
          ))}
        </Box>
      ) : clips.length === 0 && !error ? (
        <Box className="videos-empty">
          <Typography variant="h6">No clips have been uploaded yet.</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            New uploads will appear here.
          </Typography>
        </Box>
      ) : (
        <>
          <Box className="clips-grid">
            {clips.map((clip) => (
              <ClipCard key={clip._id} clip={clip} onClick={setSelectedClip} />
            ))}
            {isLoadingMore &&
              Array.from({ length: 4 }, (_, index) => (
                <ClipCardSkeleton key={`loading-${index}`} />
              ))}
          </Box>

          {hasMore && (
            <Box
              ref={loadMoreRef}
              className="load-more-container"
              aria-live="polite"
            >
              <Button
                variant="outlined"
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
                sx={{
                  minWidth: 140,
                  color: "#8578ff",
                  borderColor: "#5d4ee6",
                  "&:hover": {
                    borderColor: "#8578ff",
                    bgcolor: "#201b50",
                  },
                }}
              >
                {isLoadingMore ? (
                  <CircularProgress size={22} />
                ) : (
                  "Load more clips"
                )}
              </Button>
            </Box>
          )}
        </>
      )}

      <VideoPlayerModal
        clip={selectedClip}
        onClose={() => setSelectedClip(null)}
      />
    </Container>
  );
};

export default Videos;
