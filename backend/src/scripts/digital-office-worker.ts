import { readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { OfficeTask } from "../models/digital-office.model";
import { findHermesPython, generateHermes, type HermesRole } from "../digital-office/hermes-runner";
import {
  workerConfigSchema,
  findCodexExecutable,
  generateCodex,
} from "../digital-office/codex-runner";

type Job = {
  mission: {
    id: string;
    instruction: string;
    priority: string;
    tasks: OfficeTask[];
  };
  leaseToken: string;
};

async function main() {
  const flag = process.argv.indexOf("--config");
  const configPath =
    process.argv[flag + 1] && flag >= 0
      ? process.argv[flag + 1]
      : path.resolve(".local/digital-office/worker.json");
  const config = workerConfigSchema.parse(
    JSON.parse(await readFile(configPath, "utf8")),
  );
  const engineFlag = process.argv.indexOf("--engine");
  const engine = engineFlag >= 0 ? process.argv[engineFlag + 1] : config.engine;
  if (engine !== "codex" && engine !== "hermes") throw new Error("Engine worker tidak valid.");
  const executable = engine === "hermes" ? await findHermesPython(config.hermesPython) : await findCodexExecutable(config.codexExecutable);
  const homeRoot = path.resolve(config.hermesHome || path.join(path.dirname(configPath), "hermes"));
  const helper = path.resolve(__dirname, "../../scripts/hermes-office-query.py");
  const generate = (prompt: string, kind: "agent" | "manager", signal: AbortSignal, role: HermesRole) =>
    engine === "hermes" ? generateHermes(executable, homeRoot, helper, role, prompt, kind, signal) : generateCodex(executable, prompt, kind, signal);
  const endpoint = `${config.apiUrl.replace(/\/$/, "")}/api/admin/digital-office/worker`;
  const lifecycle = new AbortController();
  let current: AbortController | null = null;
  const stop = () => {
    lifecycle.abort();
    current?.abort();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  async function request(route: string, method: string, body: unknown) {
    const response = await fetch(`${endpoint}${route}`, {
      method,
      redirect: "error",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const failure = new Error(
        response.status === 401
          ? "Pairing worker dicabut. Hubungkan komputer kembali."
          : response.status === 409
            ? "Pekerjaan dibatalkan atau lease kedaluwarsa."
            : "Koneksi antrean gagal.",
      );
      Object.assign(failure, { status: response.status });
      throw failure;
    }
    return response.json();
  }
  console.log(
    `Worker ${engine} aktif. Menunggu instruksi CEO; Ctrl+C untuk berhenti.`,
  );
  while (!lifecycle.signal.aborted) {
    try {
      const { job } = (await request("/claim", "POST", {})) as {
        job: Job | null;
      };
      if (!job) {
        await delay(10000, undefined, { signal: lifecycle.signal });
        continue;
      }
      current = new AbortController();
      const jobController = current;
      const tasks = job.mission.tasks.map((task) => ({
        ...task,
        steps: [...task.steps],
      }));
      const update = (data: object) =>
        request(`/${job.mission.id}`, "PATCH", {
          leaseToken: job.leaseToken,
          ...data,
        });
      let heartbeatBusy = false;
      const heartbeat = setInterval(() => {
        if (heartbeatBusy) return;
        heartbeatBusy = true;
        void request(`/${job.mission.id}/heartbeat`, "POST", {
          leaseToken: job.leaseToken,
        })
          .catch(() => jobController.abort())
          .finally(() => {
            heartbeatBusy = false;
          });
      }, 15000);
      try {
        for (const task of tasks) {
          if (task.status === "done") continue;
          task.status = "running";
          await update({ tasks });
          console.log(`Agent ${task.agentId} mengerjakan draft.`);
          const output = await generate(
            [
              "Anda adalah agent kantor NAKI CODE. Buat hasil draft konkret dalam bahasa Indonesia sesuai peran. Jangan menjalankan perintah, mengubah file, menghubungi orang, atau mempublikasikan apa pun. Jangan mengaku telah melakukan riset atau tindakan yang belum dilakukan. Nyatakan asumsi dan data yang perlu diverifikasi. Kembalikan JSON steps berupa bagian-bagian hasil kerja, bukan hanya janji akan bekerja.",
              JSON.stringify({
                role: task.agentId,
                assignment: task.title,
                ceoBrief: job.mission.instruction,
                priority: job.mission.priority,
                completedWork: tasks.filter((item) => item.status === "done"),
              }),
            ].join("\n"),
            "agent",
            jobController.signal,
            task.agentId,
          );
          if (!("steps" in output))
            throw new Error("Format hasil agent tidak valid.");
          task.steps = output.steps;
          task.status = "done";
          await update({ tasks });
        }
        console.log("Manager menyusun laporan CEO.");
        const output = await generate(
          [
            "Anda adalah AI Manager NAKI CODE. Gabungkan hasil agent menjadi laporan Markdown berbahasa Indonesia untuk CEO: tujuan, hasil konkret, urutan pelaksanaan, asumsi/batasan, keputusan CEO. Hasil adalah draft; jangan mengaku telah melaksanakan tindakan eksternal. Jangan menggunakan tools atau mengubah file. Kembalikan JSON report.",
            JSON.stringify({
              instruction: job.mission.instruction,
              priority: job.mission.priority,
              tasks,
            }),
          ].join("\n"),
          "manager",
          jobController.signal,
          "manager",
        );
        if (!("report" in output))
          throw new Error("Format laporan tidak valid.");
        await update({ tasks, report: output.report, status: "complete" });
        console.log("Laporan tersimpan dan tersedia bagi CEO.");
      } catch (error) {
        if (!jobController.signal.aborted)
          await update({
            tasks,
            status: "failed",
            error:
              error instanceof Error
                ? error.message.slice(0, 500)
                : "Agent gagal.",
          }).catch(() => {});
        console.log(
          jobController.signal.aborted
            ? "Pekerjaan dihentikan; hasil parsial tersimpan."
            : "Pekerjaan gagal; periksa status di kantor digital.",
        );
      } finally {
        clearInterval(heartbeat);
        jobController.abort();
        current = null;
      }
    } catch (error) {
      if (lifecycle.signal.aborted) break;
      if ((error as { status?: number }).status === 401) throw error;
      console.log("Antrean belum terhubung. Mencoba kembali dalam lima detik.");
      await delay(5000, undefined, { signal: lifecycle.signal }).catch(
        () => {},
      );
    }
  }
}
void main().catch((error) => {
  console.error(
    error instanceof Error && !(error instanceof SyntaxError)
      ? error.message
      : "Konfigurasi worker tidak valid.",
  );
  process.exitCode = 1;
});
