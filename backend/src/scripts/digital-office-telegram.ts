import {
  readFile,
  writeFile,
  mkdir,
  rename,
  open,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  telegramConfigSchema,
  freshTelegramState,
  handleTelegramUpdate,
  deliverTelegramResults,
  type TelegramUpdate,
  type TelegramState,
} from "../digital-office/telegram-bridge";
async function main() {
  const flag = process.argv.indexOf("--config");
  const configPath = path.resolve(
    flag >= 0
      ? process.argv[flag + 1]
      : "../.local/digital-office/telegram.json",
  );
  const config = telegramConfigSchema.parse(
    JSON.parse(await readFile(configPath, "utf8")),
  );
  const botId = config.botToken.split(":")[0];
  const directory = path.join(
    path.dirname(configPath),
    `telegram-state-${botId}-${config.allowedUserId}`,
  );
  await mkdir(directory, { recursive: true });
  const lock = path.join(directory, "bridge.lock");
  let handle;
  try {
    handle = await open(lock, "wx", 0o600);
    await handle.writeFile(String(process.pid));
  } catch {
    throw new Error(
      "Bridge sudah aktif atau lock tersisa. Periksa proses sebelum menghapus bridge.lock.",
    );
  }
  const lifecycle = new AbortController();
  process.once("SIGINT", () => lifecycle.abort());
  process.once("SIGTERM", () => lifecycle.abort());
  const stateFile = path.join(directory, "state.json");
  let state: TelegramState = freshTelegramState();
  try {
    try {
      state = JSON.parse(await readFile(stateFile, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new Error(
          "State Telegram rusak. Pulihkan file state sebelum menjalankan bridge.",
        );
    }
    async function save() {
      await writeFile(stateFile + ".tmp", JSON.stringify(state), {
        mode: 0o600,
      });
      await rename(stateFile + ".tmp", stateFile);
    }
    async function telegram(method: string, body: object) {
      const response = await fetch(
        `https://api.telegram.org/bot${config.botToken}/${method}`,
        {
          method: "POST",
          redirect: "error",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.any([
            lifecycle.signal,
            AbortSignal.timeout(35000),
          ]),
        },
      );
      const data = (await response.json()) as { ok: boolean; result: unknown };
      if (!response.ok || !data.ok)
        throw new Error(
          "Telegram API belum tersedia. Periksa bot, koneksi, atau pembatasan request.",
        );
      return data.result;
    }
    const info = (await telegram("getWebhookInfo", {})) as { url: string };
    if (info.url)
      throw new Error(
        "Bot ini memakai webhook existing. Gunakan bot khusus percobaan; webhook tidak dihapus otomatis.",
      );
    const me = (await telegram("getMe", {})) as { id: number };
    if (String(me.id) !== botId) throw new Error("Identitas bot tidak cocok.");
    const office = async (route: string, method: string, body?: unknown) => {
      const response = await fetch(
        `${config.apiUrl.replace(/\/$/, "")}/api/admin/digital-office/worker/telegram${route}`,
        {
          method,
          redirect: "error",
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.any([
            lifecycle.signal,
            AbortSignal.timeout(15000),
          ]),
        },
      );
      if (!response.ok) {
        const error = new Error(
          response.status === 401
            ? "Pairing worker sudah dicabut."
            : response.status === 409
              ? "Status tugas berubah; periksa Kantor Digital."
              : "Backend kantor belum tersedia.",
        );
        Object.assign(error, { status: response.status });
        throw error;
      }
      return response.json();
    };
    const send = async (text: string, menu = false) => {
      await telegram("sendMessage", {
        chat_id: config.allowedUserId,
        text,
        protect_content: true,
        link_preview_options: { is_disabled: true },
        ...(menu
          ? {
              reply_markup: {
                keyboard: [
                  [{ text: "/manager" }, { text: "/strategy" }],
                  [{ text: "/research" }, { text: "/creative" }],
                  [{ text: "/operations" }, { text: "/status" }],
                ],
                resize_keyboard: true,
              },
            }
          : {}),
      });
      await delay(1100, undefined, { signal: lifecycle.signal });
    };
    console.log(
      "Bridge Telegram aktif; hanya akun CEO terkonfigurasi yang diterima.",
    );
    while (!lifecycle.signal.aborted) {
      try {
        const updates = (await telegram("getUpdates", {
          offset: state.offset,
          timeout: 20,
          limit: 20,
          allowed_updates: ["message"],
        })) as TelegramUpdate[];
        for (const update of updates) {
          await handleTelegramUpdate(
            update,
            config.allowedUserId,
            botId,
            state,
            office,
            send,
          );
          await save();
        }
        await deliverTelegramResults(state, office, send, save);
      } catch (error) {
        if (lifecycle.signal.aborted) break;
        if ((error as { status?: number }).status === 401) throw error;
        // Never print fetch URLs/error objects: Telegram tokens are embedded in URLs.
        console.log(
          error instanceof Error && !("cause" in error)
            ? error.message
            : "Koneksi bridge gagal. Mencoba kembali.",
        );
        await delay(10000, undefined, { signal: lifecycle.signal }).catch(
          () => {},
        );
      }
    }
  } finally {
    await handle.close();
    await unlink(lock).catch(() => {});
  }
}
void main().catch(() => {
  console.error(
    "Bridge belum dapat dimulai. Periksa konfigurasi lokal, token bot, backend, atau lock proses.",
  );
  process.exitCode = 1;
});
