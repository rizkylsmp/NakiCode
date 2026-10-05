import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

export const officeRoles = [
  "strategy",
  "research",
  "creative",
  "operations",
] as const;
export type OfficeTask = {
  agentId: (typeof officeRoles)[number];
  title: string;
  status: "queued" | "running" | "done";
  steps: string[];
};
export type OfficeStatus =
  | "planned"
  | "queued"
  | "running"
  | "cancelled"
  | "failed"
  | "complete"
  | "reviewed";
type MissionRow = RowDataPacket & {
  id: string;
  owner_id: number;
  instruction: string;
  priority: string;
  status: OfficeStatus;
  tasks: OfficeTask[] | string;
  report: string | null;
  error: string | null;
  lease_token: string | null;
  lease_until: Date | null;
};
type WorkerRow = RowDataPacket & {
  id: string;
  owner_id: number;
  name: string;
  last_seen: Date | null;
};
function publicMission(row: MissionRow) {
  return {
    id: row.id,
    instruction: row.instruction,
    priority: row.priority,
    status: row.status,
    tasks:
      typeof row.tasks === "string"
        ? (JSON.parse(row.tasks) as OfficeTask[])
        : row.tasks,
    report: row.report || "",
    error: row.error || "",
    mode: "codex" as const,
  };
}
export function makeOfficeTasks(instruction: string): OfficeTask[] {
  const roles = [
    {
      id: "strategy",
      title: "Susun tujuan dan urutan prioritas",
      include: true,
    },
    {
      id: "research",
      title: "Analisis kebutuhan data dan pertanyaan riset",
      include: /riset|research|pasar|kompetitor|analisis|pelanggan|data/i.test(
        instruction,
      ),
    },
    {
      id: "creative",
      title: "Buat draft konten dan arah design",
      include:
        /konten|content|design|desain|brand|promosi|marketing|kampanye|website|landing/i.test(
          instruction,
        ),
    },
    {
      id: "operations",
      title: "Susun checklist eksekusi dan handoff",
      include: true,
    },
  ] as const;
  return roles
    .filter((role) => role.include)
    .map((role) => ({
      agentId: role.id,
      title: role.title,
      status: "queued",
      steps: [],
    }));
}
export async function expireOfficeLeases(ownerId: number) {
  await pool.execute(
    "UPDATE digital_office_missions SET status = 'failed', error = 'Worker terputus. Tinjau hasil parsial lalu lanjutkan.', lease_token = NULL, lease_until = NULL WHERE owner_id = ? AND status = 'running' AND lease_until < NOW()",
    [ownerId],
  );
}
export async function listOfficeMissions(ownerId: number) {
  await expireOfficeLeases(ownerId);
  const [rows] = await pool.query<MissionRow[]>(
    "SELECT * FROM digital_office_missions WHERE owner_id = ? ORDER BY created_at DESC LIMIT 50",
    [ownerId],
  );
  return rows.map(publicMission);
}
export async function findOfficeMission(id: string, ownerId: number) {
  const [rows] = await pool.query<MissionRow[]>(
    "SELECT * FROM digital_office_missions WHERE id = ? AND owner_id = ? LIMIT 1",
    [id, ownerId],
  );
  return rows[0] ? publicMission(rows[0]) : null;
}
export async function createOfficeMission(
  ownerId: number,
  instruction: string,
  priority: string,
) {
  const id = randomUUID();
  await pool.execute(
    "INSERT INTO digital_office_missions (id, owner_id, instruction, priority, tasks) VALUES (?, ?, ?, ?, ?)",
    [
      id,
      ownerId,
      instruction,
      priority,
      JSON.stringify(makeOfficeTasks(instruction)),
    ],
  );
  return findOfficeMission(id, ownerId);
}
// A Telegram update has a deterministic UUID, so a retry cannot enqueue a second job.
export async function submitTelegramMission(
  ownerId: number,
  id: string,
  instruction: string,
  agent: "manager" | (typeof officeRoles)[number],
) {
  const tasks =
    agent === "manager"
      ? makeOfficeTasks(instruction)
      : [
          {
            agentId: agent,
            title: `Jawab brief CEO sebagai ${agent} agent`,
            status: "queued",
            steps: [],
          },
        ];
  await pool.execute(
    "INSERT IGNORE INTO digital_office_missions (id, owner_id, instruction, priority, status, tasks) VALUES (?, ?, ?, 'Normal', 'queued', ?)",
    [id, ownerId, instruction, JSON.stringify(tasks)],
  );
  const mission = await findOfficeMission(id, ownerId);
  return mission && mission.instruction === instruction ? mission : null;
}
export async function changeOfficeMission(
  id: string,
  ownerId: number,
  action: "run" | "cancel" | "review",
) {
  const query =
    action === "run"
      ? "UPDATE digital_office_missions SET status = 'queued', error = NULL, worker_id = NULL, lease_token = NULL, lease_until = NULL WHERE id = ? AND owner_id = ? AND status IN ('planned', 'cancelled', 'failed')"
      : action === "cancel"
        ? "UPDATE digital_office_missions SET status = 'cancelled', lease_token = NULL, lease_until = NULL WHERE id = ? AND owner_id = ? AND status IN ('queued', 'running')"
        : "UPDATE digital_office_missions SET status = 'reviewed' WHERE id = ? AND owner_id = ? AND status = 'complete'";
  const [result] = await pool.execute<ResultSetHeader>(query, [id, ownerId]);
  return result.affectedRows === 1;
}
export async function createOfficeWorker(ownerId: number, name: string) {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  await pool.execute(
    "INSERT INTO digital_office_workers (id, owner_id, name, token_hash) VALUES (?, ?, ?, ?)",
    [id, ownerId, name, createHash("sha256").update(token).digest("hex")],
  );
  return { id, name, token };
}
export async function identifyOfficeWorker(token: string) {
  const [rows] = await pool.query<WorkerRow[]>(
    "SELECT id, owner_id, name, last_seen FROM digital_office_workers WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1",
    [createHash("sha256").update(token).digest("hex")],
  );
  return rows[0] || null;
}
export async function listOfficeWorkers(ownerId: number) {
  const [rows] = await pool.query<WorkerRow[]>(
    "SELECT id, name, last_seen FROM digital_office_workers WHERE owner_id = ? AND revoked_at IS NULL ORDER BY created_at DESC",
    [ownerId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    online:
      !!row.last_seen && Date.now() - new Date(row.last_seen).getTime() < 45000,
  }));
}
export async function revokeOfficeWorker(id: string, ownerId: number) {
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE digital_office_workers SET revoked_at = NOW() WHERE id = ? AND owner_id = ? AND revoked_at IS NULL",
    [id, ownerId],
  );
  if (result.affectedRows)
    await pool.execute(
      "UPDATE digital_office_missions SET status = 'cancelled', lease_token = NULL, lease_until = NULL WHERE owner_id = ? AND worker_id = ? AND status = 'running'",
      [ownerId, id],
    );
  return result.affectedRows === 1;
}
export async function claimOfficeMission(workerId: string, ownerId: number) {
  await pool.execute(
    "UPDATE digital_office_workers SET last_seen = NOW() WHERE id = ? AND owner_id = ? AND revoked_at IS NULL",
    [workerId, ownerId],
  );
  await expireOfficeLeases(ownerId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [workers] = await connection.query<WorkerRow[]>(
      "SELECT id FROM digital_office_workers WHERE id = ? AND owner_id = ? AND revoked_at IS NULL FOR UPDATE",
      [workerId, ownerId],
    );
    if (!workers[0]) {
      await connection.rollback();
      return null;
    }
    const [rows] = await connection.query<MissionRow[]>(
      "SELECT * FROM digital_office_missions WHERE owner_id = ? AND status = 'queued' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED",
      [ownerId],
    );
    if (!rows[0]) {
      await connection.commit();
      return null;
    }
    const leaseToken = randomUUID();
    await connection.execute(
      "UPDATE digital_office_missions SET status = 'running', worker_id = ?, lease_token = ?, lease_until = DATE_ADD(NOW(), INTERVAL 90 SECOND) WHERE id = ? AND status = 'queued'",
      [workerId, leaseToken, rows[0].id],
    );
    await connection.commit();
    return {
      mission: { ...publicMission(rows[0]), status: "running" as const },
      leaseToken,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function heartbeatOfficeMission(
  id: string,
  workerId: string,
  ownerId: number,
  leaseToken: string,
) {
  await pool.execute(
    "UPDATE digital_office_workers SET last_seen = NOW() WHERE id = ? AND owner_id = ? AND revoked_at IS NULL",
    [workerId, ownerId],
  );
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE digital_office_missions SET lease_until = DATE_ADD(NOW(), INTERVAL 90 SECOND) WHERE id = ? AND owner_id = ? AND worker_id = ? AND lease_token = ? AND status = 'running' AND lease_until >= NOW()",
    [id, ownerId, workerId, leaseToken],
  );
  return result.affectedRows === 1;
}
export async function updateOfficeProgress(
  id: string,
  workerId: string,
  ownerId: number,
  input: {
    leaseToken: string;
    tasks?: OfficeTask[];
    report?: string;
    status?: "running" | "complete" | "failed";
    error?: string;
  },
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<MissionRow[]>(
      "SELECT * FROM digital_office_missions WHERE id = ? AND owner_id = ? AND worker_id = ? AND lease_token = ? AND status = 'running' AND lease_until >= NOW() FOR UPDATE",
      [id, ownerId, workerId, input.leaseToken],
    );
    if (!rows[0]) {
      await connection.rollback();
      return false;
    }
    const current = publicMission(rows[0]);
    const tasks = input.tasks || current.tasks;
    if (
      tasks.length !== current.tasks.length ||
      tasks.some(
        (task, index) =>
          task.agentId !== current.tasks[index].agentId ||
          task.title !== current.tasks[index].title ||
          (current.tasks[index].status === "done" &&
            (task.status !== "done" ||
              JSON.stringify(task.steps) !==
                JSON.stringify(current.tasks[index].steps))),
      )
    ) {
      await connection.rollback();
      return false;
    }
    if (
      input.status === "complete" &&
      (!tasks.every(
        (task) => task.status === "done" && task.steps.length > 0,
      ) ||
        !input.report?.trim())
    ) {
      await connection.rollback();
      return false;
    }
    await connection.execute(
      "UPDATE digital_office_missions SET tasks = ?, report = ?, status = ?, error = ?, lease_until = DATE_ADD(NOW(), INTERVAL 90 SECOND) WHERE id = ?",
      [
        JSON.stringify(tasks),
        input.report ?? current.report,
        input.status || "running",
        input.error || null,
        id,
      ],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
