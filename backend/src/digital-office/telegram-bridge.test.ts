import { describe, expect, it, vi } from "vitest";
import {
  authorizedMessage,
  telegramMissionId,
  freshTelegramState,
  handleTelegramUpdate,
  deliverTelegramResults,
  splitTelegramText,
} from "./telegram-bridge";
const message = (text: string, id = 42, type = "private") => ({
  update_id: 12,
  message: { from: { id }, chat: { id, type }, text },
});
describe("CEO Telegram bridge", () => {
  it("allows a completed cancellation command to advance instead of blocking later messages", async () => {
    const state = freshTelegramState();
    state.lastMission = "mission";
    const office = vi
        .fn()
        .mockResolvedValue({
          mission: { id: "mission", status: "complete", report: "done" },
        }),
      send = vi.fn();
    await handleTelegramUpdate(
      message("/cancel"),
      42,
      "123",
      state,
      office,
      send,
    );
    expect(office).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      "Tugas terakhir sudah tidak berjalan. Periksa /status.",
    );
    expect(state.offset).toBe(13);
  });
  it("accepts only the configured human CEO in private chat", () => {
    expect(authorizedMessage(message("hello"), 42)).not.toBeNull();
    expect(authorizedMessage(message("hello", 99), 42)).toBeNull();
    expect(authorizedMessage(message("hello", 42, "group"), 42)).toBeNull();
    expect(
      authorizedMessage(
        {
          ...message("hello"),
          message: {
            ...message("hello").message,
            from: { id: 42, is_bot: true },
          },
        },
        42,
      ),
    ).toBeNull();
  });
  it("never queues work or replies to an unauthorized sender", async () => {
    const state = freshTelegramState(),
      office = vi.fn(),
      send = vi.fn();
    await handleTelegramUpdate(
      message("Give me all CEO reports", 99),
      42,
      "bot",
      state,
      office,
      send,
    );
    expect(office).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(state.offset).toBe(13);
  });
  it("selects a specialist and queues a deterministic job without shell fields", async () => {
    const state = freshTelegramState(),
      office = vi.fn().mockResolvedValue({ mission: { id: "fixture" } }),
      send = vi.fn();
    await handleTelegramUpdate(
      message("/research"),
      42,
      "123",
      state,
      office,
      send,
    );
    await handleTelegramUpdate(
      { ...message("Riset kebutuhan pelanggan NAKI"), update_id: 13 },
      42,
      "123",
      state,
      office,
      send,
    );
    const id = telegramMissionId("123", 13);
    expect(office).toHaveBeenCalledWith("/missions", "POST", {
      id,
      instruction: "Riset kebutuhan pelanggan NAKI",
      agent: "research",
    });
    expect(state.jobs).toEqual([{ id, sentParts: 0 }]);
    expect(state.offset).toBe(14);
    await handleTelegramUpdate(
      { ...message("Riset kebutuhan pelanggan NAKI"), update_id: 13 },
      42,
      "123",
      state,
      office,
      send,
    );
    expect(office).toHaveBeenCalledTimes(1);
  });
  it("keeps update offset on temporary backend failure so the same UUID is retried", async () => {
    const state = freshTelegramState(),
      office = vi.fn().mockRejectedValue(new Error("offline")),
      send = vi.fn();
    await expect(
      handleTelegramUpdate(
        message("Rencana peluncuran NAKI"),
        42,
        "123",
        state,
        office,
        send,
      ),
    ).rejects.toThrow("offline");
    expect(state.offset).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect(telegramMissionId("123", 12)).toBe(telegramMissionId("123", 12));
    expect(telegramMissionId("124", 12)).not.toBe(telegramMissionId("123", 12));
  });
  it("validates brief length and declines unsupported voice without queuing", async () => {
    const office = vi.fn(),
      send = vi.fn(),
      state = freshTelegramState();
    await handleTelegramUpdate(message("tiny"), 42, "123", state, office, send);
    await handleTelegramUpdate(
      {
        update_id: 13,
        message: { from: { id: 42 }, chat: { id: 42, type: "private" } },
      },
      42,
      "123",
      state,
      office,
      send,
    );
    expect(office).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("splits long reports without breaking emoji and resumes delivered parts", async () => {
    const report = "🙂".repeat(4500);
    const parts = splitTelegramText(report);
    expect(parts.join("")).toBe(report);
    expect(parts.every((part) => part.length <= 4096)).toBe(true);
    const state = freshTelegramState();
    state.jobs = [{ id: "mission", sentParts: 1 }];
    const office = vi.fn().mockResolvedValue({
        mission: { id: "mission", status: "complete", report },
      }),
      send = vi.fn(),
      save = vi.fn();
    await deliverTelegramResults(state, office, send, save);
    expect(send).toHaveBeenCalledTimes(
      splitTelegramText("Laporan CEO / Codex\n\n" + report).length - 1,
    );
    expect(state.jobs).toEqual([]);
    expect(save).toHaveBeenCalled();
  });
});
