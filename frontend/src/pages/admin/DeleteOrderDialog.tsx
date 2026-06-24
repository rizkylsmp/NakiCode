import { AlertTriangle, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { getPaymentStatusLabel, type OrderItem } from "../../order-types";

type DeleteOrderDialogProps = {
  order: OrderItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (order: OrderItem) => void;
};

export function DeleteOrderDialog({
  order,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteOrderDialogProps) {
  if (!order || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[130] grid place-items-center bg-naki-primary/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-order-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-naki-steel bg-naki-frost shadow-naki-soft">
        <div className="flex items-start justify-between gap-4 border-b border-naki-steel bg-naki-steel p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-naki-primary text-naki-frost">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-naki-secondary">
                Validasi hapus order
              </p>
              <h2
                id="delete-order-title"
                className="mt-1 text-2xl font-black leading-tight text-naki-primary"
              >
                Hapus order #{order.id}?
              </h2>
            </div>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-naki-steel text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
            aria-label="Tutup dialog hapus order"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <p className="text-sm font-semibold leading-6 text-naki-smoke">
            Order ini akan dihapus dari inbox admin dan daftar pesanan user.
            Datanya tetap disimpan sebagai soft delete di database.
          </p>

          <div className="grid gap-2 rounded-lg border border-naki-steel bg-naki-steel p-3">
            <DeleteOrderMeta label="Customer" value={order.customerName} />
            <DeleteOrderMeta label="Template" value={order.templateTitle} />
            <DeleteOrderMeta
              label="Payment"
              value={getPaymentStatusLabel(order.paymentStatus)}
            />
            <DeleteOrderMeta label="Status order" value={order.status} />
          </div>

          <div className="rounded-lg border border-naki-steel bg-naki-frost px-3 py-2 text-xs font-bold leading-5 text-naki-smoke">
            Aksi ini bukan hapus permanen. Untuk restore, admin perlu
            mengosongkan kolom <span className="font-black">deleted_at</span>{" "}
            pada order terkait.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-naki-steel bg-naki-steel p-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-naki-steel bg-naki-frost px-4 text-sm font-black text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-secondary disabled:cursor-not-allowed disabled:bg-naki-smoke"
            disabled={isDeleting}
            onClick={() => onConfirm(order)}
            type="button"
          >
            <Trash2 size={16} />
            {isDeleting ? "Menghapus..." : "Ya, hapus order"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type DeleteOrderMetaProps = {
  label: string;
  value: string;
};

function DeleteOrderMeta({ label, value }: DeleteOrderMetaProps) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:items-center">
      <p className="text-xs font-black uppercase text-naki-smoke">{label}</p>
      <p className="min-w-0 truncate text-sm font-black text-naki-primary">
        {value}
      </p>
    </div>
  );
}

