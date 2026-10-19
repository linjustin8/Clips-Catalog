// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import VideoPlayerModal from "./VideoPlayerModal";
import { Clip } from "../../types/clip";

const auth = vi.hoisted(() => ({ user: { id: "owner", roles: ["Viewer"] } as { id: string; roles: string[] } | null, accessToken: "token" as string | null }));
vi.mock("../../hooks/useAuth", () => ({ default: () => auth }));
vi.mock("axios", () => ({ default: { delete: vi.fn(), isAxiosError: () => false } }));

const clip: Clip = { _id: "clip-id", uploader: "owner", uploaderUsername: "clip-maker", title: "Test clip", categories: ["Highlights"], uploadDate: "2026-10-19T12:00:00Z", playbackUrl: "/test.mp4" };
const onClose = vi.fn();
const onDeleted = vi.fn();
const show = (value = clip) => render(<VideoPlayerModal clip={value} onClose={onClose} onDeleted={onDeleted} />);

beforeEach(() => {
  vi.resetAllMocks();
  auth.user = { id: "owner", roles: ["Viewer"] };
  auth.accessToken = "token";
  vi.mocked(axios.delete).mockResolvedValue({});
});
afterEach(cleanup);

it.each(["guest", "other-user"])("shows the uploader but hides deletion for a %s", (viewer) => {
  auth.user = viewer === "guest" ? null : { id: "someone-else", roles: ["admin"] };
  auth.accessToken = viewer === "guest" ? null : "token";
  show();
  expect(screen.getByText("Uploaded by clip-maker")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Delete clip" })).toBeNull();
});

it("uses a fallback when the uploader account is unavailable", () => {
  show({ ...clip, uploaderUsername: null });
  expect(screen.getByText("Uploaded by Unknown uploader")).toBeTruthy();
});

it("requires confirmation and allows cancelling without a request", () => {
  show();
  fireEvent.click(screen.getByRole("button", { name: "Delete clip" }));
  expect(screen.getByText(/cannot be undone/)).toBeTruthy();
  expect(axios.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("button", { name: "Delete permanently" })).toBeNull();
  expect(axios.delete).not.toHaveBeenCalled();
});

it("deletes an owned clip with authentication and updates the feed on success", async () => {
  show();
  fireEvent.click(screen.getByRole("button", { name: "Delete clip" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  await waitFor(() => expect(onDeleted).toHaveBeenCalledWith("clip-id"));
  expect(axios.delete).toHaveBeenCalledWith("/api/clips/clip-id", { headers: { Authorization: "Bearer token" } });
  expect(onClose).toHaveBeenCalledOnce();
});

it("keeps the modal open on failure and permits retry", async () => {
  vi.mocked(axios.delete).mockRejectedValueOnce(new Error("Network failed"));
  show();
  fireEvent.click(screen.getByRole("button", { name: "Delete clip" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  await screen.findByRole("alert");
  expect(onDeleted).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
});

it("blocks duplicate requests and closing while deletion is pending", async () => {
  let finish: () => void = () => {};
  vi.mocked(axios.delete).mockImplementationOnce(() => new Promise((resolve) => { finish = () => resolve({}); }));
  show();
  fireEvent.click(screen.getByRole("button", { name: "Delete clip" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  const deletingButton = screen.getByRole("button", { name: "Deleting…" }) as HTMLButtonElement;
  expect(deletingButton.disabled).toBe(true);
  fireEvent.click(deletingButton);
  fireEvent.click(screen.getByRole("button", { name: "Close video" }));
  expect(onClose).not.toHaveBeenCalled();
  expect(axios.delete).toHaveBeenCalledOnce();
  await act(async () => finish());
});

it("resets confirmation when a different clip opens", () => {
  const view = show();
  fireEvent.click(screen.getByRole("button", { name: "Delete clip" }));
  view.rerender(<VideoPlayerModal clip={{ ...clip, _id: "another" }} onClose={onClose} onDeleted={onDeleted} />);
  expect(screen.queryByRole("button", { name: "Delete permanently" })).toBeNull();
  expect(screen.getByRole("button", { name: "Delete clip" })).toBeTruthy();
});
