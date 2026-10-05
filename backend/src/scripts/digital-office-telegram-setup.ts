import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  telegramConfigSchema,
  freshTelegramState,
  type TelegramUpdate,
} from "../digital-office/telegram-bridge";
import { workerConfigSchema } from "../digital-office/codex-runner";
async function main() {
  const token = telegramConfigSchema.shape.botToken.parse(
    process.env.OFFICE_TELEGRAM_BOT_TOKEN,
  );
  delete process.env.OFFICE_TELEGRAM_BOT_TOKEN;
  const directory = path.resolve("../.local/digital-office");
  const worker = workerConfigSchema.parse(
    JSON.parse(await readFile(path.join(directory, "worker.json"), "utf8")),
  );
  async function api(method: string, body: object) {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      },
    );
    const data = (await response.json()) as { ok: boolean; result: unknown };
    if (!response.ok || !data.ok)
      throw new Error(
        "Telegram belum dapat dihubungi. Periksa token atau koneksi.",
      );
    return data.result;
  }
  const me = (await api("getMe", {})) as { id: number; username: string };
  if (((await api("getWebhookInfo", {})) as { url: string }).url)
    throw new Error(
      "Bot sudah memakai webhook. Gunakan bot baru khusus percobaan.",
    );
  const configFile = path.join(directory, "telegram.json");
  try {
    await readFile(configFile);
    throw new Error(
      "Konfigurasi Telegram sudah ada. Pindahkan konfigurasi lama secara eksplisit sebelum pairing ulang.",
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const challenge = randomBytes(12).toString("hex");
  console.log(`Buka bot Anda: https://t.me/${me.username}`);
  console.log(`Kirim pesan ini ke bot dari akun CEO: /start ${challenge}`);
  console.log(
    "Menunggu pairing selama lima menit. Jangan bagikan kode pairing.",
  );
  let offset = 0;
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    const updates = (await api("getUpdates", {
      offset,
      timeout: 20,
      allowed_updates: ["message"],
    })) as TelegramUpdate[];
    for (const update of updates) {
      offset = update.update_id + 1;
      const message = update.message;
      if (
        message?.chat.type !== "private" ||
        !message.from ||
        message.from.is_bot ||
        message.chat.id !== message.from.id ||
        message.text?.trim() !== `/start ${challenge}`
      )
        continue;
      const config = telegramConfigSchema.parse({
        ...worker,
        botToken: token,
        allowedUserId: message.from.id,
      });
      const stateDirectory = path.join(
        directory,
        `telegram-state-${me.id}-${message.from.id}`,
      );
      await mkdir(stateDirectory, { recursive: true });
      await writeFile(
        path.join(stateDirectory, "state.json"),
        JSON.stringify({ ...freshTelegramState(), offset }),
        { flag: "wx", mode: 0o600 },
      );
      await writeFile(configFile, JSON.stringify(config, null, 2), {
        flag: "wx",
        mode: 0o600,
      });
      console.log(
        "Akun CEO berhasil dipasangkan. Token tersimpan privat; tidak ditampilkan. Jalankan office:telegram dan kirim /start ke bot.",
      );
      return;
    }
  }
  throw new Error(
    "Pairing belum selesai. Jalankan setup kembali untuk kode baru.",
  );
}
void main().catch(() => {
  console.error(
    "Setup Telegram belum selesai. Periksa token, bot khusus tanpa webhook, worker.json, konfigurasi lama, dan pesan kode pairing. Token tidak dicetak.",
  );
  process.exitCode = 1;
});
