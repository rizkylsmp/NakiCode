import { createHash } from "node:crypto";
import { z } from "zod";
import { workerConfigSchema } from "./codex-runner";

export const telegramConfigSchema = workerConfigSchema
  .extend({
    botToken: z.string().regex(/^\d+:[A-Za-z0-9_-]{25,}$/),
    allowedUserId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export const agents = [
  "manager",
  "strategy",
  "research",
  "creative",
  "operations",
] as const;
export type Agent = (typeof agents)[number];
export type TelegramUpdate = {
  update_id: number;
  message?: {
    from?: { id: number; is_bot?: boolean };
    chat: { id: number; type: string };
    text?: string;
  };
};
export type TelegramState = {
  offset: number;
  agent: Agent;
  lastMission?: string;
  jobs: { id: string; sentParts: number }[];
};
export const freshTelegramState = (): TelegramState => ({
  offset: 0,
  agent: "manager",
  jobs: [],
});
export function authorizedMessage(update: TelegramUpdate, userId: number) {
  const message = update.message;
  return message &&
    message.chat.type === "private" &&
    message.chat.id === userId &&
    message.from?.id === userId &&
    !message.from.is_bot
    ? message
    : null;
}
export function telegramMissionId(botId: string, updateId: number) {
  const hash = createHash("sha256")
    .update(`naki-telegram:${botId}:${updateId}`)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hash[12] = "5";
  hash[16] = "8";
  const value = hash.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}
export function splitTelegramText(text: string) {
  const chars = Array.from(text);
  const parts: string[] = [];
  // 1800 code points also stay within Telegram's UTF-16 limit when using emoji.
  for (let i = 0; i < chars.length; i += 1800)
    parts.push(chars.slice(i, i + 1800).join(""));
  return parts.length ? parts : ["Hasil kosong. Periksa Kantor Digital."];
}
type Mission = { id: string; status: string; report: string; error?: string };
type OfficeRequest = (
  route: string,
  method: string,
  body?: unknown,
) => Promise<{ mission?: Mission; cancelled?: boolean }>;
type Send = (text: string, menu?: boolean) => Promise<void>;
export async function handleTelegramUpdate(
  update: TelegramUpdate,
  userId: number,
  botId: string,
  state: TelegramState,
  office: OfficeRequest,
  send: Send,
) {
  if (update.update_id < state.offset) return;
  const message = authorizedMessage(update, userId);
  if (!message) {
    state.offset = update.update_id + 1;
    return;
  }
  const text = message.text?.trim();
  if (!text) {
    await send(
      "Versi percobaan menerima teks. Voice/file belum diproses; tulis instruksi CEO.",
    );
    state.offset = update.update_id + 1;
    return;
  }
  const command = text.split(/\s/, 1)[0].split("@")[0].toLowerCase();
  if (["/start", "/help"].includes(command))
    await send(
      "NAKI CEO Office. Pilih manager atau agent, lalu tulis instruksi 15–3.000 karakter. /status melihat tugas terakhir; /cancel membatalkannya. Hasil berupa draft Codex dan tersimpan di Kantor Digital.",
      true,
    );
  else if (agents.some((agent) => command === `/${agent}`)) {
    state.agent = command.slice(1) as Agent;
    await send(
      `Terhubung ke ${state.agent === "manager" ? "AI Manager" : state.agent + " agent"}. Tulis instruksi Anda.`,
      true,
    );
  } else if (command === "/status" || command === "/cancel") {
    if (!state.lastMission) await send("Belum ada instruksi dari Telegram.");
    else if (command === "/status") {
      const { mission } = await office(`/missions/${state.lastMission}`, "GET");
      await send(
        `Status tugas terakhir: ${mission?.status || "tidak tersedia"}.`,
      );
    } else {
      const { mission } = await office(`/missions/${state.lastMission}`, "GET");
      if (!mission || !["queued", "running"].includes(mission.status))
        await send("Tugas terakhir sudah tidak berjalan. Periksa /status.");
      else {
        try {
          await office(`/missions/${state.lastMission}/cancel`, "POST", {});
          await send(
            "Pembatalan tersimpan. Worker menghentikan proses pada heartbeat berikutnya.",
          );
        } catch (error) {
          if ((error as { status?: number }).status === 409)
            await send(
              "Status tugas berubah sebelum dibatalkan. Periksa /status.",
            );
          else throw error;
        }
      }
    }
  } else if (text.startsWith("/"))
    await send("Perintah belum tersedia. Gunakan /help.");
  else if (text.length < 15 || text.length > 3000)
    await send("Tulis instruksi minimal 15 dan maksimal 3.000 karakter.");
  else if (state.jobs.length >= 20)
    await send(
      "Masih ada 20 tugas menunggu hasil. Tunggu hasil sebelum mengirim instruksi baru.",
    );
  else {
    const id = telegramMissionId(botId, update.update_id);
    const { mission } = await office("/missions", "POST", {
      id,
      instruction: text,
      agent: state.agent,
    });
    if (!mission) throw new Error("Antrean Telegram belum tersimpan.");
    state.lastMission = id;
    if (!state.jobs.some((job) => job.id === id))
      state.jobs.push({ id, sentParts: 0 });
    await send(
      `Instruksi masuk ke ${state.agent === "manager" ? "AI Manager" : state.agent + " agent"}. Hasil akan dikirim ke chat ini setelah Codex selesai. Komputer dan worker harus aktif.`,
    );
  }
  state.offset = update.update_id + 1;
}
export async function deliverTelegramResults(
  state: TelegramState,
  office: OfficeRequest,
  send: Send,
  save: () => Promise<void>,
) {
  for (const job of [...state.jobs]) {
    const { mission } = await office(`/missions/${job.id}`, "GET");
    if (
      !mission ||
      !["complete", "reviewed", "failed", "cancelled"].includes(mission.status)
    )
      continue;
    const parts = splitTelegramText(
      mission.status === "complete" || mission.status === "reviewed"
        ? `Laporan CEO / Codex\n\n${mission.report}`
        : `Tugas ${mission.status}. ${mission.error || "Periksa hasil parsial di Kantor Digital."}`,
    );
    for (let index = job.sentParts; index < parts.length; index++) {
      await send(parts[index]);
      job.sentParts = index + 1;
      await save();
    }
    state.jobs = state.jobs.filter((item) => item.id !== job.id);
    await save();
  }
}
