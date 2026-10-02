import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { apiPost, getApiErrorMessage } from "../../services/api-client";
import { budgetOptions } from "../../domain/budget-options";
import { useLanguage } from "../../i18n/language";
import { NicheSelect } from "./NicheSelect";

type Result = {
  order: { id: number };
  invitationUrl: string;
  expiresAt: string | null;
  existingAccount: boolean;
  emailSent: boolean;
};
export function CreateClientOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { language } = useLanguage();
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    customerContact: "",
    projectTitle: "",
    niche: "",
    message: "",
    budgetRange: budgetOptions[0] as string,
    language,
    sendEmail: true,
  });
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      setResult(
        await apiPost<Result>("/api/orders/admin-create", form, {
          timeout: 60000,
        }),
      );
      onCreated();
    } catch (error) {
      setStatus(
        getApiErrorMessage(error, "Gagal membuat order klien. Coba lagi."),
      );
    } finally {
      setSaving(false);
    }
  }
  const inputClass =
    "mt-1.5 w-full rounded-lg border border-naki-steel bg-white px-3 py-2.5 text-sm text-naki-primary";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-order-title"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 sm:p-6"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !saving) onClose();
          if (event.key === "Tab") {
            const items = dialog.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]",
            );
            if (!items?.length) {
              event.preventDefault();
              dialog.current?.focus();
              return;
            }
            const first = items[0],
              last = items[items.length - 1];
            if (
              event.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === dialog.current)
            ) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="client-order-title"
            className="text-xl font-bold text-naki-primary"
          >
            Buat order untuk klien
          </h2>
          <button
            type="button"
            disabled={saving}
            aria-label="Tutup form"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-naki-steel text-naki-primary"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm text-naki-smoke">
          Untuk project custom dari WhatsApp atau luar website. Penawaran dan
          pembayaran tetap diproses melalui akun klien.
        </p>
        {result ? (
          <div className="mt-5 space-y-4">
            <p role="status" className="text-sm text-naki-primary">
              Order berhasil dibuat.
            </p>
            <p className="text-sm text-naki-smoke">
              {result.existingAccount
                ? "Pesanan sudah ditautkan ke akun yang terdaftar. Klien cukup login."
                : "Klien membuat password melalui undangan sekali pakai. Tautan berlaku 72 jam."}
            </p>
            <p
              className={`text-sm ${form.sendEmail && !result.emailSent ? "text-red-600" : "text-naki-smoke"}`}
            >
              {result.emailSent
                ? "Email sudah dikirim."
                : form.sendEmail
                  ? "Email gagal dikirim. Salin tautan untuk dikirim manual ke klien."
                  : "Email tidak dikirim. Bagikan tautan secara manual."}
            </p>
            <label className="block text-sm text-naki-primary">
              Tautan klien
              <input
                className={`${inputClass} font-mono text-xs`}
                value={result.invitationUrl}
                readOnly
                onFocus={(event) => event.target.select()}
              />
            </label>
            <button
              className="min-h-11 rounded-lg bg-naki-primary px-4 text-sm font-semibold text-white"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.invitationUrl);
                  setStatus("Tautan disalin.");
                } catch {
                  setStatus("Pilih dan salin tautan secara manual.");
                }
              }}
            >
              Salin tautan
            </button>
            <p className="text-xs text-naki-smoke">
              Tautan undangan bersifat pribadi. Kirim hanya kepada klien yang
              sesuai.
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <fieldset disabled={saving} className="space-y-4">
              <label className="block text-sm font-medium text-naki-primary">
                Nama klien
                <input
                  className={inputClass}
                  required
                  maxLength={120}
                  value={form.customerName}
                  onChange={(event) =>
                    setForm({ ...form, customerName: event.target.value })
                  }
                />
              </label>
              <label className="block text-sm font-medium text-naki-primary">
                Email klien
                <input
                  className={inputClass}
                  required
                  type="email"
                  maxLength={160}
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>
              <label className="block text-sm font-medium text-naki-primary">
                Kontak WhatsApp
                <input
                  className={inputClass}
                  required
                  maxLength={120}
                  value={form.customerContact}
                  onChange={(event) =>
                    setForm({ ...form, customerContact: event.target.value })
                  }
                />
              </label>
              <label className="block text-sm font-medium text-naki-primary">
                Judul project
                <input
                  className={inputClass}
                  required
                  minLength={3}
                  maxLength={160}
                  value={form.projectTitle}
                  onChange={(event) =>
                    setForm({ ...form, projectTitle: event.target.value })
                  }
                />
              </label>
              <label className="block text-sm font-medium text-naki-primary">
                Budget
                <select
                  className={inputClass}
                  value={form.budgetRange}
                  onChange={(event) =>
                    setForm({ ...form, budgetRange: event.target.value })
                  }
                >
                  {budgetOptions.map((budget) => (
                    <option key={budget} value={budget}>
                      {budget}
                    </option>
                  ))}
                </select>
              </label>
              <NicheSelect value={form.niche} onChange={niche => setForm({ ...form, niche })} disabled={saving} />
              <label className="block text-sm font-medium text-naki-primary">
                Brief project
                <textarea
                  className={inputClass}
                  required
                  minLength={3}
                  maxLength={5000}
                  rows={4}
                  value={form.message}
                  onChange={(event) =>
                    setForm({ ...form, message: event.target.value })
                  }
                />
              </label>
              <label className="block text-sm font-medium text-naki-primary">
                Bahasa undangan
                <select
                  className={inputClass}
                  value={form.language}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      language: event.target.value === "en" ? "en" : "id",
                    })
                  }
                >
                  <option value="id">Indonesia</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm text-naki-primary">
                <input
                  type="checkbox"
                  checked={form.sendEmail}
                  onChange={(event) =>
                    setForm({ ...form, sendEmail: event.target.checked })
                  }
                />
                Kirim undangan melalui email
              </label>
              <button
                disabled={saving}
                type="submit"
                className="min-h-11 w-full rounded-lg bg-naki-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Membuat order..." : "Buat order dan undangan"}
              </button>
            </fieldset>
          </form>
        )}
        {status && (
          <p role="status" className="mt-4 text-sm text-naki-primary">
            {status}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
