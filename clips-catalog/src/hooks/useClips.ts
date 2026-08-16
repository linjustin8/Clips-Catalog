import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Clip } from "../types/clip";

const RECENT_CLIPS_URL = "/api/clips/recent";
const PAGE_SIZE = 12;

interface ClipsResponse {
  clips: Clip[];
  nextCursor: string | null;
  hasMore: boolean;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : "Unable to load clips";
};

const useClips = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.get<ClipsResponse>(RECENT_CLIPS_URL, {
        params: { limit: PAGE_SIZE },
      });

      if (requestId !== requestIdRef.current) return;
      setClips(data.clips);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(caughtError));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const { data } = await axios.get<ClipsResponse>(RECENT_CLIPS_URL, {
        params: { limit: PAGE_SIZE, cursor: nextCursor },
      });

      setClips((current) => {
        const existingIds = new Set(current.map((clip) => clip._id));
        return [
          ...current,
          ...data.clips.filter((clip) => !existingIds.has(clip._id)),
        ];
      });
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, nextCursor]);

  return {
    clips,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh: loadFirstPage,
  };
};

export default useClips;
