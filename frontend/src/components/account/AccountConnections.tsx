import { useState } from "react";
import { Unplug } from "lucide-react";
import { apiPost, getApiErrorMessage } from "../../services/api-client";

export type ConnectionProfile = {
  id: number;
  username: string;
  email: string;
  role?: "user" | "admin";
  emailVerifiedAt: string | null;
  emailVerificationSentAt: string | null;
  googleLinked?: boolean;
};

export function AccountConnections({
  profile,
  onUpdate,
}: {
  profile: ConnectionProfile;
  onUpdate: (profile: ConnectionProfile) => void;
}) {
  const [target, setTarget] = useState<"google" | "email">(
    profile.googleLinked ? "google" : "email",
  );
  const [password, setPassword] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const available =
    target === "email" ? Boolean(profile.email) : Boolean(profile.googleLinked);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !available || !password || !acknowledge) return;
    setBusy(true);
    setStatus("");
    try {
      const data = await apiPost<{ user: ConnectionProfile; message: string }>(
        "/api/auth/user/me/unbind",
        {
          target,
          currentPassword: password,
          acknowledge,
        },
      );
      onUpdate(data.user);
      setStatus(data.message);
      setAcknowledge(false);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal melepas koneksi akun."));
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <section
      className="min-w-0 rounded-2xl bg-white p-5 shadow-sm md:p-6"
      aria-labelledby="account-connections-title"
    >
      <h2
        id="account-connections-title"
        className="flex items-center gap-2 text-xl font-bold"
      >
        <Unplug size={20} /> Koneksi akun
      </h2>
      <dl className="my-4 grid gap-2 rounded-xl bg-naki-frost p-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt>Email</dt>
          <dd className="min-w-0 break-all">
            {profile.email ? (
              <span data-no-translate>{profile.email}</span>
            ) : (
              "Tidak terhubung"
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Google</dt>
          <dd>{profile.googleLinked ? "Terhubung" : "Tidak terhubung"}</dd>
        </div>
      </dl>
      <form className="grid gap-4" onSubmit={submit}>
        <fieldset disabled={busy} className="grid min-w-0 gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Koneksi yang dilepas
            <select
              value={target}
              onChange={(event) => {
                setTarget(event.target.value as "google" | "email");
                setAcknowledge(false);
                setPassword("");
                setStatus("");
              }}
            >
              <option value="google">Google saja</option>
              <option value="email">Email dan Google</option>
            </select>
          </label>
          <p
            id="unbind-impact"
            className="rounded-xl border border-naki-steel p-3 text-sm leading-relaxed text-naki-smoke"
          >
            {target === "email"
              ? "Email dan Google akan dilepas. Reset password dan pengiriman invoice melalui email tidak tersedia. Tracking dan unduhan invoice tetap tersedia di akun."
              : "Login Google akan dinonaktifkan dan tidak terhubung kembali secara otomatis. Email akun tetap tersimpan."}
          </p>
          <p className="text-sm text-naki-smoke">
            Login berikutnya menggunakan username dan password. Jika hanya
            pernah login Google, buat password melalui Lupa password sebelum
            unbind.
          </p>
          <label className="grid gap-1.5 text-sm font-medium">
            Password konfirmasi unbind
            <input
              className="min-h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm focus-visible:ring-2 focus-visible:ring-naki-secondary"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label className="flex items-start gap-2 text-sm leading-relaxed">
            <input
              className="mt-1 shrink-0"
              type="checkbox"
              checked={acknowledge}
              onChange={(event) => setAcknowledge(event.target.checked)}
              aria-describedby="unbind-impact"
              required
            />
            Saya memahami dampaknya dan ingin melepas koneksi ini.
          </label>
          <button
            className="min-h-11 w-fit rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!available || !password || !acknowledge}
          >
            {busy ? "Melepas koneksi..." : "Lepas koneksi"}
          </button>
        </fieldset>
        {!available && (
          <p className="text-sm text-naki-smoke">
            Koneksi ini sudah tidak terhubung.
          </p>
        )}
        <p role="status" className="text-sm text-naki-smoke">
          {status}
        </p>
      </form>
    </section>
  );
}
