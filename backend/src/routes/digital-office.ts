import express from "express";
import { z } from "zod";
import { requireAdmin, type UserTokenPayload } from "../auth";
import * as office from "../models/digital-office.model";

export const digitalOfficeRouter = express.Router();
digitalOfficeRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
const uuid = z.string().uuid();
const owner = (res: express.Response) =>
  (res.locals.admin as UserTokenPayload).userId;
const missionBody = z
  .object({
    instruction: z.string().trim().min(15).max(3000),
    priority: z.enum(["Normal", "Tinggi", "Mendesak"]),
  })
  .strict();
const progressBody = z
  .object({
    leaseToken: uuid,
    tasks: z
      .array(
        z
          .object({
            agentId: z.enum(office.officeRoles),
            title: z.string().min(1).max(300),
            status: z.enum(["queued", "running", "done"]),
            steps: z.array(z.string().min(1).max(8000)).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(4)
      .optional(),
    report: z.string().max(60000).optional(),
    status: z.enum(["running", "complete", "failed"]).optional(),
    error: z.string().max(500).optional(),
  })
  .strict();
async function workerAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    res.status(401).json({ message: "Worker authorization required" });
    return;
  }
  try {
    const worker = await office.identifyOfficeWorker(token);
    if (!worker) {
      res.status(401).json({ message: "Worker authorization required" });
      return;
    }
    res.locals.worker = worker;
    next();
  } catch {
    res.status(503).json({ message: "Worker belum dapat diverifikasi." });
  }
}
digitalOfficeRouter.post("/worker/claim", workerAuth, async (_req, res) => {
  const worker = res.locals.worker;
  try {
    res.json({
      job: await office.claimOfficeMission(worker.id, worker.owner_id),
    });
  } catch {
    res.status(503).json({ message: "Antrean belum dapat diambil." });
  }
});
digitalOfficeRouter.post(
  "/worker/telegram/missions",
  workerAuth,
  async (req, res) => {
    const parsed = z
      .object({
        id: uuid,
        instruction: z.string().trim().min(15).max(3000),
        agent: z.enum(["manager", ...office.officeRoles]),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Instruksi Telegram tidak valid." });
      return;
    }
    try {
      const mission = await office.submitTelegramMission(
        res.locals.worker.owner_id,
        parsed.data.id,
        parsed.data.instruction,
        parsed.data.agent,
      );
      res.status(mission ? 200 : 409).json({ mission });
    } catch {
      res.status(503).json({ message: "Instruksi Telegram belum tersimpan." });
    }
  },
);
digitalOfficeRouter.get(
  "/worker/telegram/missions/:id",
  workerAuth,
  async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ message: "ID tidak valid." });
      return;
    }
    try {
      await office.expireOfficeLeases(res.locals.worker.owner_id);
      const mission = await office.findOfficeMission(
        id.data,
        res.locals.worker.owner_id,
      );
      res.status(mission ? 200 : 404).json({ mission });
    } catch {
      res.status(503).json({ message: "Status belum tersedia." });
    }
  },
);
digitalOfficeRouter.post(
  "/worker/telegram/missions/:id/cancel",
  workerAuth,
  async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ message: "ID tidak valid." });
      return;
    }
    try {
      const cancelled = await office.changeOfficeMission(
        id.data,
        res.locals.worker.owner_id,
        "cancel",
      );
      res.status(cancelled ? 200 : 409).json({ cancelled });
    } catch {
      res.status(503).json({ message: "Pembatalan belum tersimpan." });
    }
  },
);
digitalOfficeRouter.post(
  "/worker/:id/heartbeat",
  workerAuth,
  async (req, res) => {
    const parsed = z.object({ leaseToken: uuid }).strict().safeParse(req.body);
    const id = uuid.safeParse(req.params.id);
    if (!parsed.success || !id.success) {
      res.status(400).json({ message: "Heartbeat tidak valid." });
      return;
    }
    const worker = res.locals.worker;
    try {
      const active = await office.heartbeatOfficeMission(
        id.data,
        worker.id,
        worker.owner_id,
        parsed.data.leaseToken,
      );
      res.status(active ? 200 : 409).json({ active });
    } catch {
      res.status(503).json({ message: "Heartbeat gagal." });
    }
  },
);
digitalOfficeRouter.patch("/worker/:id", workerAuth, async (req, res) => {
  const parsed = progressBody.safeParse(req.body);
  const id = uuid.safeParse(req.params.id);
  if (!parsed.success || !id.success) {
    res.status(400).json({ message: "Progres tidak valid." });
    return;
  }
  const worker = res.locals.worker;
  try {
    const updated = await office.updateOfficeProgress(
      id.data,
      worker.id,
      worker.owner_id,
      parsed.data,
    );
    res.status(updated ? 200 : 409).json({ updated });
  } catch {
    res.status(503).json({ message: "Progres belum tersimpan." });
  }
});
digitalOfficeRouter.use(requireAdmin);
digitalOfficeRouter.get("/", async (_req, res) => {
  try {
    res.json({
      missions: await office.listOfficeMissions(owner(res)),
      workers: await office.listOfficeWorkers(owner(res)),
    });
  } catch {
    res.status(503).json({ message: "Kantor belum dapat dimuat." });
  }
});
digitalOfficeRouter.post("/missions", async (req, res) => {
  const parsed = missionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message:
        "Instruksi minimal 15 dan maksimal 3.000 karakter; pilih prioritas yang valid.",
    });
    return;
  }
  try {
    res.status(201).json({
      mission: await office.createOfficeMission(
        owner(res),
        parsed.data.instruction,
        parsed.data.priority,
      ),
    });
  } catch {
    res.status(503).json({
      message:
        "Instruksi belum tersimpan. Periksa riwayat sebelum mencoba lagi.",
    });
  }
});
digitalOfficeRouter.post("/missions/:id/:action", async (req, res) => {
  const id = uuid.safeParse(req.params.id);
  const action = z
    .enum(["run", "cancel", "review"])
    .safeParse(req.params.action);
  if (!id.success || !action.success) {
    res.status(400).json({ message: "Aksi tidak valid." });
    return;
  }
  try {
    if (!(await office.changeOfficeMission(id.data, owner(res), action.data))) {
      res.status(409).json({
        message:
          "Status berubah atau instruksi tidak tersedia. Muat ulang kantor.",
      });
      return;
    }
    res.json({ mission: await office.findOfficeMission(id.data, owner(res)) });
  } catch {
    res.status(503).json({ message: "Aksi belum dapat disimpan." });
  }
});
digitalOfficeRouter.post("/workers", async (req, res) => {
  const parsed = z
    .object({ name: z.string().trim().min(1).max(100) })
    .strict()
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Nama worker diperlukan." });
    return;
  }
  try {
    res.status(201).json({
      worker: await office.createOfficeWorker(owner(res), parsed.data.name),
    });
  } catch {
    res.status(503).json({ message: "Worker belum dapat dipasangkan." });
  }
});
digitalOfficeRouter.delete("/workers/:id", async (req, res) => {
  const id = uuid.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ message: "ID tidak valid." });
    return;
  }
  try {
    const revoked = await office.revokeOfficeWorker(id.data, owner(res));
    res.status(revoked ? 200 : 404).json({ revoked });
  } catch {
    res.status(503).json({ message: "Worker belum dapat diputus." });
  }
});
