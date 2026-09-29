import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import apiClient, {
  apiGet,
  getApiErrorMessage,
} from "../../services/api-client";

type Invoice = {
  id: number;
  stage: "deposit" | "balance" | "full";
  label: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
};

export function OrderInvoices({
  orderId,
  version,
}: {
  orderId: number;
  version: string;
}) {
  const [open, setOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    void apiGet<{ invoices: Invoice[] }>(`/api/orders/${orderId}/invoices`)
      .then((data) => {
        if (active) setInvoices(data.invoices);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, "Gagal memuat invoice."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, orderId, version, retry]);

  async function download(invoice: Invoice) {
    setDownloading(invoice.id);
    setError("");
    try {
      const response = await apiClient.get<Blob>(
        `/api/orders/${orderId}/invoice?stage=${invoice.stage}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${orderId}-${invoice.stage}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Gagal mengunduh invoice. Silakan coba lagi.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="mt-4 border-t border-naki-steel pt-3">
      <button
        aria-expanded={open}
        aria-controls={`order-invoices-${orderId}`}
        type="button"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-naki-primary focus-visible:ring-2 focus-visible:ring-naki-secondary"
        onClick={() => setOpen((current) => !current)}
      >
        <FileText size={16} />
        {open ? "Tutup invoice" : "Invoice"}
      </button>
      {open ? (
        <div
          id={`order-invoices-${orderId}`}
          className="mt-2 grid gap-2"
          aria-live="polite"
        >
          {loading ? (
            <p className="flex items-center gap-2 text-xs text-naki-smoke">
              <Loader2 size={14} className="animate-spin" />
              Memuat invoice...
            </p>
          ) : invoices.length ? (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="naki-orders-detail-surface flex min-w-0 flex-col gap-3 rounded-xl bg-naki-frost p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-naki-primary">
                    {invoice.label}
                  </p>
                  <p className="break-all text-xs text-naki-smoke">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="mt-1 text-xs text-naki-primary">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: invoice.currency,
                      maximumFractionDigits: 0,
                    }).format(invoice.totalAmount)}{" "}
                    ·{" "}
                    {invoice.status === "paid"
                      ? "Lunas"
                      : ["expired", "failed", "cancelled"].includes(
                            invoice.status,
                          )
                        ? "Sesi bayar berakhir"
                        : ["refunded", "partial_refunded"].includes(
                              invoice.status,
                            )
                          ? "Direfund"
                          : "Belum dibayar"}
                  </p>
                </div>
                <button
                  className="naki-orders-secondary-action inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-xs font-semibold text-naki-primary focus-visible:ring-2 focus-visible:ring-naki-secondary disabled:opacity-50"
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => void download(invoice)}
                >
                  {downloading === invoice.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Unduh{" "}
                  {invoice.stage === "deposit"
                    ? "DP"
                    : invoice.stage === "balance"
                      ? "pelunasan"
                      : "invoice"}
                </button>
              </div>
            ))
          ) : !error ? (
            <p className="text-xs text-naki-smoke">
              Invoice terbit setelah opsi pembayaran dipilih. Invoice pelunasan
              tersedia setelah hasil disetujui.
            </p>
          ) : null}
          {error ? (
            <div className="text-xs text-red-700" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="mt-1 min-h-11 underline"
                onClick={() => setRetry((value) => value + 1)}
              >
                Coba lagi
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
