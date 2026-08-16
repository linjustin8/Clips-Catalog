import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

const ClipCardSkeleton = () => (
  <Card
    aria-label="Loading clip"
    sx={{
      height: "100%",
      overflow: "hidden",
      bgcolor: "#1b203f",
      border: "1px solid #2a2f41",
    }}
  >
    <Skeleton
      variant="rectangular"
      animation="wave"
      sx={{
        width: "100%",
        height: "55%",
        aspectRatio: "16 / 9",
        bgcolor: "#201b50",
        "&::after": {
          background:
            "linear-gradient(90deg, transparent, rgba(133, 120, 255, 0.12), transparent)",
        },
      }}
    />
    <CardContent sx={{ p: 2 }}>
      <Skeleton
        variant="text"
        width="100%"
        height={28}
        sx={{ bgcolor: "#201b50" }}
      />
      <Stack
        direction="row"
        sx={{
          width: "100%",
          mt: 1.25,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Skeleton
            variant="text"
            width={90}
            height={20}
            sx={{ bgcolor: "#201b50" }}
          />
        </Box>
        <Box>
          <Skeleton
            variant="text"
            width={40}
            height={20}
            sx={{ bgcolor: "#201b50" }}
          />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default ClipCardSkeleton;
