// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import axios from "axios";
import useClips from "./useClips";

vi.mock("axios", () => ({ default: { get: vi.fn(), isAxiosError: () => false } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("removes deleted clips immediately and filters stale pagination and refresh responses", async () => {
  vi.mocked(axios.get).mockResolvedValueOnce({ data: { clips: [{ _id: "deleted" }], nextCursor: "cursor", hasMore: true } });
  const { result } = renderHook(useClips);
  await waitFor(() => expect(result.current.clips).toHaveLength(1));
  let finish: () => void = () => {};
  vi.mocked(axios.get).mockImplementationOnce(() => new Promise((resolve) => {
    finish = () => resolve({ data: { clips: [{ _id: "deleted" }, { _id: "remaining" }], nextCursor: null, hasMore: false } });
  }));
  let loading: Promise<void>;
  act(() => { loading = result.current.loadMore(); });
  act(() => result.current.removeClip("deleted"));
  expect(result.current.clips).toEqual([]);
  await act(async () => { finish(); await loading; });
  expect(result.current.clips.map((clip) => clip._id)).toEqual(["remaining"]);
  vi.mocked(axios.get).mockResolvedValueOnce({ data: { clips: [{ _id: "deleted" }, { _id: "remaining" }], nextCursor: null, hasMore: false } });
  await act(async () => result.current.refresh());
  expect(result.current.clips.map((clip) => clip._id)).toEqual(["remaining"]);
});
