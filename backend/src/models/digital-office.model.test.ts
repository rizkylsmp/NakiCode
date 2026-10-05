import { beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db";
import {
  claimOfficeMission,
  updateOfficeProgress,
  makeOfficeTasks,
  createOfficeWorker,
  submitTelegramMission,
} from "./digital-office.model";
vi.mock("../db", () => ({
  pool: { execute: vi.fn(), query: vi.fn(), getConnection: vi.fn() },
}));
const connection = {
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
  query: vi.fn(),
  execute: vi.fn(),
};
const task = {
  agentId: "strategy" as const,
  title: "Plan",
  status: "done" as const,
  steps: ["Preserve completed draft"],
};
const row = {
  id: "mission",
  instruction: "brief",
  priority: "Normal",
  status: "running",
  tasks: [task],
  report: null,
  error: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(pool.getConnection).mockResolvedValue(connection as never);
  vi.mocked(pool.execute).mockResolvedValue([{ affectedRows: 1 }] as never);
});
describe("persistent office queue", () => {
  it("queues a specialist once and returns the existing job on retry without resetting progress", async () => {
    vi.mocked(pool.query).mockResolvedValue([
      [{ ...row, status: "complete" }],
    ] as never);
    const first = await submitTelegramMission(
      7,
      "mission",
      "brief",
      "research",
    );
    const again = await submitTelegramMission(
      7,
      "mission",
      "brief",
      "research",
    );
    expect(first?.status).toBe("complete");
    expect(again?.status).toBe("complete");
    const [query, values] = vi.mocked(pool.execute).mock.calls[0];
    expect(query).toContain("INSERT IGNORE");
    expect(query).not.toContain("UPDATE");
    expect(JSON.parse((values as unknown[])[3] as string)).toEqual([
      {
        agentId: "research",
        title: "Jawab brief CEO sebagai research agent",
        status: "queued",
        steps: [],
      },
    ]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("owner_id = ?"),
      ["mission", 7],
    );
  });
  it("does not return a collided job from another owner or with a different brief", async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce([[]] as never)
      .mockResolvedValueOnce([[row]] as never);
    expect(
      await submitTelegramMission(8, "mission", "brief", "manager"),
    ).toBeNull();
    expect(
      await submitTelegramMission(7, "mission", "another brief", "manager"),
    ).toBeNull();
  });
  it("keeps strategy and operations and selects specialists for relevant briefs", () => {
    expect(
      makeOfficeTasks("Riset pelanggan dan design website").map(
        (t) => t.agentId,
      ),
    ).toEqual(["strategy", "research", "creative", "operations"]);
    expect(
      makeOfficeTasks("Buat agenda rapat internal").map((t) => t.agentId),
    ).toEqual(["strategy", "operations"]);
  });
  it("stores only a hash of the pairing token", async () => {
    const worker = await createOfficeWorker(7, "PC");
    const values = vi.mocked(pool.execute).mock.calls[0][1] as unknown[];
    expect(worker.token.length).toBe(43);
    expect(values[3]).not.toBe(worker.token);
    expect(String(values[3]).length).toBe(64);
  });
  it("does not claim a job after worker revocation while auth was in flight", async () => {
    connection.query.mockResolvedValueOnce([[]]);
    expect(await claimOfficeMission("worker", 7)).toBeNull();
    expect(connection.execute).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
  it("does not accept stale or cancelled leases", async () => {
    connection.query.mockResolvedValueOnce([[]]);
    expect(
      await updateOfficeProgress("mission", "worker", 7, {
        leaseToken: "expired",
        status: "complete",
        report: "draft",
      }),
    ).toBe(false);
    expect(connection.execute).not.toHaveBeenCalled();
  });
  it("keeps completed output immutable when resuming and rejects empty completed tasks", async () => {
    connection.query.mockResolvedValueOnce([[row]]);
    expect(
      await updateOfficeProgress("mission", "worker", 7, {
        leaseToken: "valid",
        tasks: [{ ...task, steps: ["Changed result"] }],
      }),
    ).toBe(false);
    connection.query.mockResolvedValueOnce([
      [{ ...row, tasks: [{ ...task, status: "running", steps: [] }] }],
    ]);
    expect(
      await updateOfficeProgress("mission", "worker", 7, {
        leaseToken: "valid",
        tasks: [{ ...task, steps: [] }],
        status: "complete",
        report: "draft",
      }),
    ).toBe(false);
    expect(connection.execute).not.toHaveBeenCalled();
  });
  it("commits a final report only when all agent outputs are complete", async () => {
    connection.query.mockResolvedValueOnce([[row]]);
    expect(
      await updateOfficeProgress("mission", "worker", 7, {
        leaseToken: "valid",
        status: "complete",
        report: "CEO report",
      }),
    ).toBe(true);
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
