import { useEffect, useState } from "react";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  getApiErrorMessage,
} from "../../services/api-client";
import type { Niche } from "./NicheSelect";
export function AdminNichesSection() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Niche | null>(null);
  async function load() {
    setLoading(true);
    try {
      const result = await apiGet<{ niches: Niche[] }>(
        "/api/categories/niches",
      );
      setNiches(result.niches ?? []);
      setMessage("");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Gagal memuat niche."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const result =
        editingId === null
          ? await apiPost<{ niches: Niche[] }>("/api/categories/niches", {
              name: name.trim(),
            })
          : await apiPut<{ niches: Niche[] }>(
              `/api/categories/niches/${editingId}`,
              { name: name.trim() },
            );
      setNiches(result.niches);
      setName("");
      setEditingId(null);
      setMessage("Niche tersimpan.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Gagal menyimpan niche."));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const result = await apiDelete<{ niches: Niche[] }>(
        `/api/categories/niches/${deleteTarget.id}`,
      );
      setNiches(result.niches);
      if (editingId === deleteTarget.id) {
        setEditingId(null);
        setName("");
      }
      setMessage("Niche dihapus.");
      setDeleteTarget(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Gagal menghapus niche."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Kelola Niche"
      className="space-y-4 rounded-xl border border-naki-steel bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-naki-primary">Niche</h2>
          <p className="mt-1 text-sm text-naki-smoke">
            Pilihan bidang bisnis untuk form Design dan Order.
          </p>
        </div>
        <button
          type="button"
          disabled={loading || busy}
          onClick={() => void load()}
          className="min-h-11 rounded-lg border border-naki-steel px-3 text-sm"
        >
          Muat ulang niche
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="grid min-w-0 flex-1 gap-1 text-sm text-naki-primary">
          Nama niche
          <input
            className="min-h-11 w-full rounded-lg border border-naki-steel px-3"
            minLength={2}
            maxLength={120}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={busy || loading}
          />
        </label>
        <button
          type="submit"
          disabled={busy || loading}
          className="min-h-11 rounded-lg bg-naki-primary px-4 text-sm font-semibold text-white"
        >
          {editingId === null ? "Tambah niche" : "Simpan niche"}
        </button>
        {editingId !== null && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setName("");
              setEditingId(null);
            }}
            className="min-h-11 rounded-lg border border-naki-steel px-3"
          >
            Batal
          </button>
        )}
      </form>
      {message && (
        <p role="status" className="text-sm text-naki-primary">
          {message}
        </p>
      )}
      {loading ? (
        <p role="status">Memuat niche...</p>
      ) : !niches.length ? (
        <p className="text-sm text-naki-smoke">Belum ada niche.</p>
      ) : (
        <ul className="divide-y divide-naki-steel">
          {niches.map((niche) => (
            <li
              key={niche.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <span
                  data-no-translate
                  className="break-words font-semibold text-naki-primary"
                >
                  {niche.name}
                </span>
                <p className="text-xs text-naki-smoke">
                  <span data-no-translate>{niche.designCount}</span> design
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Edit niche ${niche.name}`}
                  className="min-h-11 rounded-lg border border-naki-steel px-3"
                  onClick={() => {
                    setEditingId(niche.id);
                    setName(niche.name);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy || niche.designCount > 0}
                  title={
                    niche.designCount > 0
                      ? "Niche masih digunakan oleh design."
                      : "Hapus niche"
                  }
                  aria-label={`Hapus niche ${niche.name}`}
                  className="min-h-11 rounded-lg border border-naki-steel px-3 disabled:opacity-40"
                  onClick={() => setDeleteTarget(niche)}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {deleteTarget && (
        <div
          className="rounded-lg border border-naki-steel bg-naki-frost p-3"
          role="alertdialog"
          aria-label="Konfirmasi hapus niche"
        >
          <p className="text-sm">
            Hapus niche <span data-no-translate>{deleteTarget.name}</span>?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="min-h-11 rounded-lg bg-naki-primary px-3 text-white"
            >
              Konfirmasi hapus
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setDeleteTarget(null)}
              className="min-h-11 rounded-lg border border-naki-steel px-3"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
