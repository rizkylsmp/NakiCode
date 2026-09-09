import {
  Download,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import apiClient, {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  getApiErrorMessage,
} from "../../services/api-client";

type TransactionType = "income" | "expense" | "refund";
type FinanceTransaction = {
  id: number;
  orderId: number | null;
  categoryId: number | null;
  categoryName: string | null;
  type: TransactionType;
  amount: number;
  gatewayFee: number;
  netAmount: number;
  paymentMethod: string | null;
  reference: string | null;
  occurredAt: string;
  notes: string | null;
};
type FinanceCategory = {
  id: number;
  name: string;
  categoryType: TransactionType;
};
type FinanceResponse = {
  transactions: FinanceTransaction[];
  page: number;
  total: number;
  totalPages: number;
};
type ExpenseForm = {
  id?: number;
  categoryId: string;
  amount: string;
  paymentMethod: string;
  occurredAt: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 8)}01`;
const emptyForm: ExpenseForm = {
  categoryId: "",
  amount: "",
  paymentMethod: "Transfer",
  occurredAt: `${today}T12:00`,
  notes: "",
};

export function AdminFinanceSection() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [type, setType] = useState<"all" | TransactionType>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [form, setForm] = useState<ExpenseForm | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        from,
        to,
        page: String(page),
        pageSize: "20",
      });
      if (type !== "all") query.set("type", type);
      const [finance, categoryResult] = await Promise.all([
        apiGet<FinanceResponse>(`/api/finance/transactions?${query}`),
        apiGet<{ categories: FinanceCategory[] }>("/api/finance/categories"),
      ]);
      setData(finance);
      setCategories(categoryResult.categories);
      setStatus("");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal memuat pembukuan."));
    } finally {
      setLoading(false);
    }
  }, [from, page, to, type]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveExpense(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = {
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod || null,
      occurredAt: new Date(form.occurredAt).toISOString(),
      notes: form.notes || null,
      attachmentUrl: null,
    };
    try {
      if (form.id) await apiPut(`/api/finance/expenses/${form.id}`, payload);
      else await apiPost("/api/finance/expenses", payload);
      setForm(null);
      setStatus("Pengeluaran berhasil disimpan.");
      await load();
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menyimpan pengeluaran."));
    } finally {
      setSaving(false);
    }
  }

  async function voidExpense(item: FinanceTransaction) {
    if (
      !window.confirm(
        "Batalkan catatan pengeluaran ini? Riwayat tetap tersimpan untuk audit.",
      )
    )
      return;
    try {
      await apiDelete(`/api/finance/expenses/${item.id}`);
      setStatus("Pengeluaran dibatalkan.");
      await load();
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal membatalkan pengeluaran."));
    }
  }

  function editExpense(item: FinanceTransaction) {
    setForm({
      id: item.id,
      categoryId: String(item.categoryId ?? ""),
      amount: String(item.amount),
      paymentMethod: item.paymentMethod ?? "",
      occurredAt: new Date(item.occurredAt).toISOString().slice(0, 16),
      notes: item.notes ?? "",
    });
  }

  async function downloadReport(format: "csv" | "pdf") {
    try {
      const query = new URLSearchParams({ from, to });
      if (type !== "all") query.set("type", type);
      const response = await apiClient.get(
        `/api/finance/reports.${format}?${query}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `laporan-keuangan-${from}-${to}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal mengunduh laporan."));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-naki-secondary">
            Arus kas
          </p>
          <h1 className="mt-1 text-2xl font-bold text-naki-primary">
            Pembukuan
          </h1>
          <p className="mt-1 text-sm text-naki-smoke">
            {data?.total ?? 0} transaksi pada periode terpilih • Pembayaran,
            pengeluaran, dan refund.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            aria-label="Muat ulang pembukuan"
            className="grid size-11 place-items-center rounded-xl border border-naki-steel bg-white text-naki-smoke transition hover:bg-naki-frost disabled:opacity-50"
            disabled={loading}
            onClick={() => void load()}
            type="button"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white shadow-naki-soft transition hover:opacity-90"
            onClick={() => setForm(emptyForm)}
            type="button"
          >
            <Plus size={16} />
            Catat pengeluaran
          </button>
        </div>
      </div>
      {status && (
        <p
          aria-live="polite"
          className="rounded-xl border border-naki-steel bg-white px-4 py-3 text-sm text-naki-smoke shadow-sm"
        >
          {status}
        </p>
      )}
      <section className="rounded-2xl border border-naki-steel bg-white p-4 shadow-naki-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-naki-primary">
              <SlidersHorizontal size={16} />
              Filter transaksi
            </p>
            <p className="mt-0.5 text-xs text-naki-smoke">
              Atur periode dan jenis transaksi untuk tabel dan laporan.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[180px_180px_180px_1fr]">
          <label className="grid gap-1.5 text-xs font-medium text-naki-smoke">
            Dari
            <input
              className="h-11 rounded-xl border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-naki-smoke">
            Sampai
            <input
              className="h-11 rounded-xl border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-naki-smoke">
            Jenis
            <select
              className="h-11 rounded-xl border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary"
              value={type}
              onChange={(e) => {
                setType(e.target.value as typeof type);
                setPage(1);
              }}
            >
              <option value="all">Semua transaksi</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
              <option value="refund">Refund</option>
            </select>
          </label>
          <div className="flex items-end gap-2 xl:justify-end">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-naki-steel bg-white px-3 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
              onClick={() => void downloadReport("csv")}
              type="button"
            >
              <Download size={15} />
              CSV
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-naki-steel bg-white px-3 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
              onClick={() => void downloadReport("pdf")}
              type="button"
            >
              <Download size={15} />
              PDF
            </button>
          </div>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-naki-steel bg-white shadow-naki-card">
        <div className="border-b border-naki-steel px-4 py-3">
          <h2 className="font-semibold text-naki-primary">Riwayat transaksi</h2>
          <p className="text-xs text-naki-smoke">
            Urut dari transaksi terbaru.
          </p>
        </div>
        <div className="grid gap-3 p-3 md:hidden">
          {loading ? (
            <p className="py-10 text-center text-sm text-naki-smoke">
              Memuat transaksi...
            </p>
          ) : !data?.transactions.length ? (
            <p className="py-10 text-center text-sm text-naki-smoke">
              Belum ada transaksi pada periode ini.
            </p>
          ) : (
            data.transactions.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-naki-steel bg-naki-page-bg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <TypeBadge type={item.type} />
                    <p className="mt-2 font-semibold text-naki-primary">
                      {item.categoryName ??
                        (item.orderId ? `Order #${item.orderId}` : "Transaksi")}
                    </p>
                    <p className="mt-0.5 text-xs text-naki-smoke">
                      {new Date(item.occurredAt).toLocaleDateString("id-ID")}{" "}
                      {item.reference ? `• ${item.reference}` : ""}
                    </p>
                  </div>
                  <p className="text-right text-sm font-bold text-naki-primary">
                    {money(
                      item.type === "income" ? item.netAmount : -item.netAmount,
                    )}
                  </p>
                </div>
                {item.notes && (
                  <p className="mt-3 border-t border-naki-steel pt-3 text-sm text-naki-smoke">
                    {item.notes}
                  </p>
                )}
                {item.type === "expense" && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      className="h-10 rounded-lg px-3 text-xs font-semibold text-naki-secondary hover:bg-white"
                      onClick={() => editExpense(item)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      aria-label="Batalkan pengeluaran"
                      className="grid size-10 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                      onClick={() => void voidExpense(item)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-naki-frost text-xs uppercase tracking-wide text-naki-smoke">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Kategori / Referensi</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3 text-right">Bersih</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-naki-steel">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-naki-smoke"
                    colSpan={7}
                  >
                    Memuat transaksi...
                  </td>
                </tr>
              ) : !data?.transactions.length ? (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-naki-smoke"
                    colSpan={7}
                  >
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                data.transactions.map((item) => (
                  <tr
                    key={item.id}
                    className="text-naki-primary transition hover:bg-naki-frost/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(item.occurredAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={item.type} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {item.categoryName ??
                          (item.orderId ? `Order #${item.orderId}` : "-")}
                      </p>
                      <p className="text-xs text-naki-smoke">
                        {item.reference}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {money(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {money(
                        item.type === "income"
                          ? item.netAmount
                          : -item.netAmount,
                      )}
                    </td>
                    <td className="max-w-56 truncate px-4 py-3 text-naki-smoke">
                      {item.notes ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.type === "expense" && (
                        <div className="flex justify-end gap-1">
                          <button
                            className="h-9 rounded-lg px-2 text-xs font-semibold text-naki-secondary hover:bg-naki-frost"
                            onClick={() => editExpense(item)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            aria-label="Batalkan pengeluaran"
                            className="grid size-9 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                            onClick={() => void voidExpense(item)}
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-naki-steel px-4 py-3 text-sm text-naki-smoke">
            <span>{data.total} transaksi</span>
            <div className="flex items-center gap-2">
              <button
                className="h-9 rounded-lg border border-naki-steel px-3 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((v) => v - 1)}
                type="button"
              >
                Sebelumnya
              </button>
              <span className="min-w-12 text-center text-xs font-semibold">
                {page}/{data.totalPages}
              </span>
              <button
                className="h-9 rounded-lg border border-naki-steel px-3 disabled:opacity-40"
                disabled={page >= data.totalPages}
                onClick={() => setPage((v) => v + 1)}
                type="button"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </section>
      {form && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-naki-primary/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-dialog-title"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !saving) setForm(null);
          }}
        >
          <form
            className="w-full max-w-lg rounded-2xl border border-naki-steel bg-white p-5 shadow-naki-card"
            onSubmit={saveExpense}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WalletCards size={20} />
                <h2
                  id="expense-dialog-title"
                  className="text-lg font-bold text-naki-primary"
                >
                  {form.id ? "Edit" : "Catat"} pengeluaran
                </h2>
              </div>
              <button
                className="grid size-10 place-items-center rounded-xl text-naki-smoke hover:bg-naki-frost"
                type="button"
                aria-label="Tutup"
                onClick={() => setForm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs text-naki-smoke">
                Kategori
                <select
                  required
                  className="h-11 rounded-lg border border-naki-steel px-3 text-sm text-naki-primary"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  <option value="">Pilih kategori</option>
                  {categories
                    .filter((c) => c.categoryType === "expense")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-naki-smoke">
                Nominal
                <input
                  required
                  min="1"
                  type="number"
                  className="h-11 rounded-lg border border-naki-steel px-3 text-sm text-naki-primary"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </label>
              <label className="grid gap-1 text-xs text-naki-smoke">
                Tanggal
                <input
                  required
                  type="datetime-local"
                  className="h-11 rounded-lg border border-naki-steel px-3 text-sm text-naki-primary"
                  value={form.occurredAt}
                  onChange={(e) =>
                    setForm({ ...form, occurredAt: e.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-xs text-naki-smoke">
                Metode
                <input
                  className="h-11 rounded-lg border border-naki-steel px-3 text-sm text-naki-primary"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-xs text-naki-smoke sm:col-span-2">
                Catatan
                <textarea
                  rows={3}
                  className="rounded-lg border border-naki-steel p-3 text-sm text-naki-primary"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="h-11 rounded-xl border border-naki-steel px-4 text-sm font-medium text-naki-primary"
                onClick={() => setForm(null)}
              >
                Batal
              </button>
              <button
                disabled={saving}
                className="h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: TransactionType }) {
  const labels = { income: "Masuk", expense: "Keluar", refund: "Refund" };
  const colors = {
    income: "bg-emerald-50 text-emerald-700",
    expense: "bg-amber-50 text-amber-700",
    refund: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${colors[type]}`}
    >
      {labels[type]}
    </span>
  );
}
function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
