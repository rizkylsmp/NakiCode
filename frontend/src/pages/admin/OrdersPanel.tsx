import {
  AlertTriangle,
  CheckSquare,
  Inbox,
  MessageSquareText,
  RefreshCw,
  Search,
  BadgeDollarSign,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  apiPatch,
  apiPost,
  getApiErrorMessage,
} from "../../services/api-client";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { OrderCardSkeletonGrid } from "../../components/ui/skeletons/ProfileSkeleton";
import {
  getPaymentStatusLabel,
  type OrderItem,
} from "../../domain/order-types";
import {
  formatOrderDate,
  orderStatusFilters,
  paymentStatusFilters,
  type AdminOrderFilters,
  type OrderStatus,
  type OrderStatusFilter,
  type PaymentStatusFilter,
} from "./AdminTemplateWorkspace.shared";

type OrdersPanelProps = {
  orders: OrderItem[];
  ordersStatus: string;
  ordersPage: number;
  orderFilters: AdminOrderFilters;
  ordersMeta: {
    total: number;
    totalPages: number;
    pageSize: number;
  };
  isLoadingOrders: boolean;
  updatingOrderId: number | null;
  onRefreshOrders: () => void;
  onOrderFiltersChange: (filters: AdminOrderFilters) => void;
  onOrdersPageChange: (page: number) => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (order: OrderItem) => void;
};

type DensityMode = "comfortable" | "compact";

export function OrdersPanel({
  orders,
  ordersStatus,
  ordersPage,
  orderFilters,
  ordersMeta,
  isLoadingOrders,
  updatingOrderId,
  onRefreshOrders,
  onOrderFiltersChange,
  onOrdersPageChange,
  onUpdateOrderStatus,
  onDeleteOrder,
}: OrdersPanelProps) {
  const hasActiveFilters =
    orderFilters.status !== "all" || orderFilters.paymentStatus !== "all";
  const [search, setSearch] = useState(orderFilters.search);
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("contacted");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [actionDialog, setActionDialog] = useState<{
    kind: "quote" | "refund";
    order: OrderItem;
    amount: string;
    notes: string;
  } | null>(null);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const failedOrders = orders.filter(
    (order) => order.paymentStatus === "failed" && order.paymentFailureReason,
  );
  const normalizedSearch = search.trim().toLowerCase();
  const visibleOrders = useMemo(() => {
    if (!normalizedSearch) return orders;

    return orders.filter((order) =>
      [
        order.id,
        order.customerName,
        order.customerContact,
        order.templateTitle,
        order.projectType,
        order.status,
        order.paymentStatus,
        order.paymentFailureReason,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        ),
    );
  }, [normalizedSearch, orders]);
  const visibleOrderIds = visibleOrders.map((order) => order.id);
  const selectedVisibleOrderIds = selectedOrderIds.filter((orderId) =>
    visibleOrderIds.includes(orderId),
  );
  const areAllVisibleOrdersSelected =
    visibleOrderIds.length > 0 &&
    selectedVisibleOrderIds.length === visibleOrderIds.length;
  const hasActiveSearch = normalizedSearch.length > 0;
  const cardPadding = density === "compact" ? "p-4" : "p-5";
  const briefLineClamp =
    density === "compact" ? "line-clamp-1" : "line-clamp-2";

  useEffect(() => {
    const orderIds = new Set(orders.map((order) => order.id));
    setSelectedOrderIds((current) =>
      current.filter((orderId) => orderIds.has(orderId)),
    );
  }, [orders]);

  function updateStatusFilter(status: OrderStatusFilter) {
    onOrderFiltersChange({ ...orderFilters, status });
  }

  function submitSearch() {
    onOrderFiltersChange({ ...orderFilters, search: search.trim() });
  }

  function updatePaymentStatusFilter(paymentStatus: PaymentStatusFilter) {
    onOrderFiltersChange({ ...orderFilters, paymentStatus });
  }

  function toggleOrderSelection(orderId: number) {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((selectedOrderId) => selectedOrderId !== orderId)
        : [...current, orderId],
    );
  }

  function toggleVisibleSelection() {
    setSelectedOrderIds((current) => {
      if (areAllVisibleOrdersSelected) {
        return current.filter((orderId) => !visibleOrderIds.includes(orderId));
      }

      return Array.from(new Set([...current, ...visibleOrderIds]));
    });
  }

  async function applyBulkStatusUpdate() {
    if (selectedVisibleOrderIds.length === 0) return;

    setIsBulkUpdating(true);
    try {
      await apiPatch("/api/orders/bulk/status", {
        ids: selectedVisibleOrderIds,
        status: bulkStatus,
      });
      onRefreshOrders();
      setSelectedOrderIds((current) =>
        current.filter((orderId) => !selectedVisibleOrderIds.includes(orderId)),
      );
      setActionStatus(
        `${selectedVisibleOrderIds.length} order berhasil diperbarui.`,
      );
    } catch (error) {
      setActionStatus(
        getApiErrorMessage(error, "Gagal memperbarui order terpilih."),
      );
    } finally {
      setIsBulkUpdating(false);
    }
  }

  function resetOrderTools() {
    setSearch("");
    setSelectedOrderIds([]);
    onOrderFiltersChange({ status: "all", paymentStatus: "all", search: "" });
  }

  async function submitOrderAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionDialog) return;
    const amount = Number(actionDialog.amount.replace(/[^0-9]/g, ""));
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setActionStatus("Nominal harus lebih dari nol.");
      return;
    }
    setIsSavingAction(true);
    try {
      if (actionDialog.kind === "quote") {
        await apiPatch(`/api/orders/${actionDialog.order.id}/quote`, {
          amount,
          notes: actionDialog.notes || null,
        });
        setActionStatus(
          "Penawaran tersimpan dan pelanggan telah diberi notifikasi.",
        );
      } else {
        await apiPost(`/api/finance/orders/${actionDialog.order.id}/refund`, {
          amount,
          notes: actionDialog.notes || null,
        });
        setActionStatus("Refund berhasil dicatat di pembukuan.");
      }
      setActionDialog(null);
      onRefreshOrders();
    } catch (error) {
      setActionStatus(
        getApiErrorMessage(
          error,
          actionDialog.kind === "quote"
            ? "Gagal menyimpan penawaran."
            : "Gagal mencatat refund.",
        ),
      );
    } finally {
      setIsSavingAction(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-naki-secondary">
            Workspace penjualan
          </p>
          <h1 className="mt-1 text-2xl font-bold text-naki-primary">
            Kelola order
          </h1>
          <p className="mt-1 text-sm text-naki-smoke">
            {ordersMeta.total} order • Tindak lanjuti brief, penawaran,
            pembayaran, dan progres project.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-white shadow-naki-soft transition hover:opacity-90"
            onClick={() =>
              onOrderFiltersChange({
                status: "new",
                paymentStatus: "all",
                search: "",
              })
            }
            type="button"
          >
            <Inbox size={16} />
            Order baru
          </button>
          <button
            className="grid size-11 place-items-center rounded-xl border border-naki-steel bg-white text-naki-smoke transition hover:bg-naki-frost disabled:opacity-50"
            disabled={isLoadingOrders}
            onClick={onRefreshOrders}
            title="Refresh orders"
            type="button"
          >
            <RefreshCw
              size={15}
              className={isLoadingOrders ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {ordersStatus && (
        <div
          aria-live="polite"
          className="rounded-xl border border-naki-steel bg-white px-4 py-3 text-sm text-naki-smoke shadow-sm"
        >
          {ordersStatus}
        </div>
      )}
      {actionStatus && (
        <div
          aria-live="polite"
          className="rounded-xl border border-naki-steel bg-white px-4 py-3 text-sm text-naki-smoke shadow-sm"
        >
          {actionStatus}
        </div>
      )}

      {failedOrders.length > 0 && (
        <div className="rounded-xl border border-naki-secondary/25 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-naki-secondary" size={18} />
            <div>
              <p className="text-sm font-semibold text-naki-primary">
                Payment issues
              </p>
              <p className="text-xs text-naki-smoke">
                Alasan gagal dari webhook gateway untuk order di halaman ini.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {failedOrders.slice(0, 4).map((order) => (
              <div key={order.id} className="rounded-lg bg-naki-frost p-3">
                <p className="text-xs font-semibold text-naki-primary">
                  #{order.id} - {order.customerName}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-naki-smoke">
                  {order.paymentFailureReason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-naki-steel bg-white p-4 shadow-naki-card">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-naki-primary">
              <SlidersHorizontal size={16} />
              Cari dan filter
            </p>
            <p className="mt-0.5 text-xs text-naki-smoke">
              {visibleOrders.length} dari {ordersMeta.total} order
            </p>
          </div>
          {(hasActiveFilters ||
            hasActiveSearch ||
            selectedOrderIds.length > 0) && (
            <button
              className="inline-flex h-8 items-center rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:bg-naki-frost"
              onClick={resetOrderTools}
              type="button"
            >
              Reset
            </button>
          )}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_180px]">
          <label>
            <span className="sr-only">Cari order</span>
            <span className="flex h-10 items-center gap-2 rounded-lg border border-naki-steel bg-naki-page-bg px-3 focus-within:border-naki-primary">
              <Search size={15} className="text-naki-smoke" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-naki-primary outline-none"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearch("");
                  if (event.key === "Enter") submitSearch();
                }}
                onBlur={() => {
                  if (search.trim() !== orderFilters.search) submitSearch();
                }}
                placeholder="Nama, kontak, design, status..."
                type="search"
                value={search}
              />
              {search && (
                <button
                  aria-label="Clear order search"
                  className="grid size-6 place-items-center rounded-md text-naki-smoke transition hover:bg-white hover:text-naki-primary"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          </label>
          <CompactFilterSelect
            label="Status order"
            filters={orderStatusFilters}
            activeValue={orderFilters.status}
            onChange={updateStatusFilter}
          />
          <CompactFilterSelect
            label="Pembayaran"
            filters={paymentStatusFilters}
            activeValue={orderFilters.paymentStatus}
            onChange={updatePaymentStatusFilter}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-naki-steel pt-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:border-naki-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={visibleOrders.length === 0}
              onClick={toggleVisibleSelection}
              type="button"
            >
              <CheckSquare size={14} />
              {areAllVisibleOrdersSelected
                ? "Batalkan pilihan"
                : "Pilih halaman"}
            </button>
            <span className="text-xs text-naki-smoke">
              {selectedVisibleOrderIds.length} dipilih di halaman ini
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end xl:justify-start">
            <select
              className="h-9 min-w-[132px] rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-xs font-medium text-naki-primary outline-none transition focus:border-naki-primary"
              onChange={(event) =>
                setBulkStatus(event.target.value as OrderStatus)
              }
              value={bulkStatus}
            >
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              {orderStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="inline-flex h-9 items-center rounded-lg bg-naki-primary px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                selectedVisibleOrderIds.length === 0 ||
                isBulkUpdating ||
                updatingOrderId !== null
              }
              onClick={applyBulkStatusUpdate}
              type="button"
            >
              {isBulkUpdating ? "Memperbarui..." : "Terapkan status"}
            </button>
            <div className="inline-flex rounded-lg border border-naki-steel bg-white p-1">
              {(["comfortable", "compact"] as const).map((mode) => (
                <button
                  key={mode}
                  className={`h-7 rounded-md px-2.5 text-xs font-medium transition ${
                    density === mode
                      ? "bg-naki-primary text-white"
                      : "text-naki-smoke hover:bg-naki-frost"
                  }`}
                  onClick={() => setDensity(mode)}
                  type="button"
                >
                  {mode === "comfortable" ? "Nyaman" : "Ringkas"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoadingOrders ? (
        <OrderCardSkeletonGrid count={3} />
      ) : visibleOrders.length === 0 ? (
        <div className="rounded-xl border border-naki-steel bg-white p-12 text-center shadow-sm">
          <Inbox className="mx-auto text-naki-steel" size={40} />
          <h3 className="mt-4 text-lg font-bold text-naki-primary">
            {hasActiveFilters || hasActiveSearch
              ? "Tidak ada order yang cocok."
              : "Belum ada order."}
          </h3>
          <p className="mt-2 text-sm text-naki-smoke">
            {hasActiveFilters || hasActiveSearch
              ? "Coba kata kunci atau status lain, atau reset tampilan."
              : "Permintaan konsultasi dan pembelian akan muncul di sini."}
          </p>
          {(hasActiveFilters || hasActiveSearch) && (
            <button
              className="mt-5 inline-flex h-9 items-center rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:bg-naki-frost"
              onClick={resetOrderTools}
              type="button"
            >
              Reset tampilan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <article
              key={order.id}
              className={`overflow-hidden rounded-2xl border bg-white ${getOrderBorderClass(order.status as OrderStatus)} ${cardPadding} shadow-naki-card`}
            >
              <div className="grid gap-4 md:grid-cols-[32px_1fr_170px] md:items-start">
                <label className="flex pt-1">
                  <input
                    aria-label={`Select order #${order.id}`}
                    checked={selectedOrderIds.includes(order.id)}
                    className="size-4 rounded border-naki-steel text-naki-primary focus:ring-naki-primary"
                    onChange={() => toggleOrderSelection(order.id)}
                    type="checkbox"
                  />
                </label>
                <div className="min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <p className="w-fit rounded-md bg-naki-frost px-2.5 py-1 text-xs font-semibold text-naki-primary">
                      #{order.id}
                    </p>
                    <h3 className="min-w-0 flex-1 truncate text-base font-bold text-naki-primary">
                      {order.customerName}
                    </h3>
                    <StatusBadge status={order.status as OrderStatus} />
                    <span className="inline-flex h-7 w-fit items-center rounded-md bg-naki-frost px-2.5 text-xs font-medium text-naki-smoke">
                      {order.projectType}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-5">
                    <OrderMeta label="Kontak" value={order.customerContact} />
                    <OrderMeta label="Design" value={order.templateTitle} />
                    <OrderMeta label="Budget" value={order.budgetRange} />
                    <OrderMeta
                      label="Pembayaran"
                      value={<PaymentBadge status={order.paymentStatus} />}
                    />
                    <OrderMeta
                      label="Dibuat"
                      value={formatOrderDate(order.createdAt)}
                    />
                  </div>
                  {order.paymentStatus === "failed" &&
                    order.paymentFailureReason && (
                      <div className="mt-3 rounded-lg border border-naki-secondary/20 bg-naki-frost p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-naki-secondary">
                          <AlertTriangle size={14} />
                          Payment failure reason
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-naki-smoke">
                          {order.paymentFailureReason}
                        </p>
                        <p className="mt-1 text-xs text-naki-smoke">
                          {[
                            order.paymentFailureCode
                              ? `Code ${order.paymentFailureCode}`
                              : null,
                            order.paymentLastWebhookStatus
                              ? `Webhook ${order.paymentLastWebhookStatus}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      </div>
                    )}
                </div>
                <div className="grid gap-2">
                  <label className="grid w-full gap-1.5">
                    <span className="text-xs font-medium text-naki-smoke">
                      Status
                    </span>
                    <select
                      className={`h-10 rounded-lg border px-3 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 ${getOrderSelectClass(order.status as OrderStatus)}`}
                      disabled={updatingOrderId === order.id}
                      value={order.status}
                      onChange={(event) =>
                        onUpdateOrderStatus(
                          order.id,
                          event.target.value as OrderStatus,
                        )
                      }
                    >
                      {orderStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!["paid", "partial_refunded", "refunded"].includes(
                    order.paymentStatus,
                  ) && (
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white text-xs font-medium text-naki-primary transition hover:bg-naki-frost"
                      onClick={() =>
                        setActionDialog({
                          kind: "quote",
                          order,
                          amount: String(order.quoteAmount ?? ""),
                          notes: order.quoteNotes ?? "",
                        })
                      }
                      type="button"
                    >
                      <BadgeDollarSign size={14} />
                      {order.quoteAmount ? "Ubah penawaran" : "Beri penawaran"}
                    </button>
                  )}
                  {["paid", "partial_refunded"].includes(
                    order.paymentStatus,
                  ) && (
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white text-xs font-medium text-naki-primary transition hover:bg-naki-frost"
                      onClick={() =>
                        setActionDialog({
                          kind: "refund",
                          order,
                          amount: String(order.paymentAmount ?? ""),
                          notes: "",
                        })
                      }
                      type="button"
                    >
                      <RotateCcw size={14} />
                      Catat refund
                    </button>
                  )}
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white text-xs font-medium text-naki-smoke transition hover:border-naki-steel hover:text-naki-secondary disabled:cursor-not-allowed disabled:text-naki-smoke"
                    disabled={
                      updatingOrderId === order.id ||
                      ["paid", "partial_refunded", "refunded"].includes(
                        order.paymentStatus,
                      )
                    }
                    onClick={() => onDeleteOrder(order)}
                    type="button"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>

              <div
                className={`${density === "compact" ? "mt-3" : "mt-4"} rounded-lg bg-naki-frost p-3`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-naki-smoke">
                  <MessageSquareText size={14} />
                  Brief
                </div>
                <p
                  className={`mt-1.5 ${briefLineClamp} text-sm leading-relaxed text-naki-smoke`}
                >
                  {order.message}
                </p>
              </div>
            </article>
          ))}
          <PaginationControls
            page={ordersPage}
            total={ordersMeta.total}
            totalPages={ordersMeta.totalPages}
            pageSize={ordersMeta.pageSize}
            isLoading={isLoadingOrders}
            onPageChange={onOrdersPageChange}
          />
        </div>
      )}
      {actionDialog && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-naki-primary/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-action-title"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isSavingAction)
              setActionDialog(null);
          }}
        >
          <form
            className="w-full max-w-md rounded-2xl border border-naki-steel bg-white p-5 shadow-naki-card"
            onSubmit={submitOrderAction}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-naki-secondary">
                  Order #{actionDialog.order.id}
                </p>
                <h2
                  id="order-action-title"
                  className="mt-1 text-xl font-bold text-naki-primary"
                >
                  {actionDialog.kind === "quote"
                    ? "Penawaran harga"
                    : "Catat refund"}
                </h2>
                <p className="mt-1 text-sm text-naki-smoke">
                  {actionDialog.order.customerName} •{" "}
                  {actionDialog.order.templateTitle}
                </p>
              </div>
              <button
                aria-label="Tutup dialog"
                className="grid size-10 place-items-center rounded-xl text-naki-smoke hover:bg-naki-frost"
                onClick={() => setActionDialog(null)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label
                className="grid gap-1.5 text-xs font-medium text-naki-smoke"
                htmlFor="order-action-amount"
              >
                Nominal (Rp)
                <input
                  autoFocus
                  id="order-action-amount"
                  required
                  inputMode="numeric"
                  className="h-11 rounded-xl border border-naki-steel bg-naki-page-bg px-3 text-sm font-semibold text-naki-primary"
                  value={actionDialog.amount}
                  onChange={(event) =>
                    setActionDialog({
                      ...actionDialog,
                      amount: event.target.value,
                    })
                  }
                />
              </label>
              <label
                className="grid gap-1.5 text-xs font-medium text-naki-smoke"
                htmlFor="order-action-notes"
              >
                Catatan
                <textarea
                  id="order-action-notes"
                  rows={3}
                  className="rounded-xl border border-naki-steel bg-naki-page-bg p-3 text-sm text-naki-primary"
                  value={actionDialog.notes}
                  onChange={(event) =>
                    setActionDialog({
                      ...actionDialog,
                      notes: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-11 rounded-xl border border-naki-steel px-4 text-sm font-medium text-naki-primary"
                onClick={() => setActionDialog(null)}
                type="button"
              >
                Batal
              </button>
              <button
                className="h-11 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isSavingAction}
              >
                {isSavingAction
                  ? "Menyimpan..."
                  : actionDialog.kind === "quote"
                    ? "Simpan penawaran"
                    : "Catat refund"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type OrderMetaProps = {
  label: string;
  value: React.ReactNode;
};

type CompactFilterSelectProps<Value extends string> = {
  label: string;
  filters: Array<{ label: string; value: Value }>;
  activeValue: Value;
  onChange: (value: Value) => void;
};

function CompactFilterSelect<Value extends string>({
  label,
  filters,
  activeValue,
  onChange,
}: CompactFilterSelectProps<Value>) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-xs font-medium text-naki-primary outline-none focus:border-blue-400"
        value={activeValue}
        onChange={(event) => onChange(event.target.value as Value)}
      >
        {filters.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {label}: {filter.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OrderMeta({ label, value }: OrderMetaProps) {
  return (
    <div className="min-w-0 rounded-lg bg-naki-frost p-2">
      <p className="text-[10px] font-medium uppercase text-naki-smoke">
        {label}
      </p>
      <div className="mt-0.5 truncate text-xs font-medium text-naki-primary">
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = Object.fromEntries(
    orderStatusOptions.map((item) => [item.value, item.label]),
  ) as Record<OrderStatus, string>;
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold ${getOrderBadgeClass(status)}`}
    >
      {labels[status]}
    </span>
  );
}

function PaymentBadge({ status }: { status: OrderItem["paymentStatus"] }) {
  const classes =
    status === "paid"
      ? "bg-green-50 text-green-700"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : status === "waiting_payment"
          ? "bg-amber-50 text-amber-700"
          : "bg-naki-steel text-naki-smoke";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${classes}`}
    >
      {getPaymentStatusLabel(status)}
    </span>
  );
}

function getOrderBadgeClass(status: OrderStatus) {
  if (status === "new") return "bg-blue-50 text-blue-700";
  if (["contacted", "quotation", "awaiting_dp"].includes(status))
    return "bg-amber-50 text-amber-700";
  if (["in_progress", "revision", "delivered", "deal"].includes(status))
    return "bg-violet-50 text-violet-700";
  if (["completed", "closed"].includes(status))
    return "bg-green-50 text-green-700";
  return "bg-red-50 text-red-700";
}

function getOrderBorderClass(status: OrderStatus) {
  if (status === "new") return "border-blue-300";
  if (["contacted", "quotation", "awaiting_dp"].includes(status))
    return "border-amber-300";
  if (["in_progress", "revision", "delivered", "deal"].includes(status))
    return "border-violet-300";
  if (["completed", "closed"].includes(status)) return "border-green-300";
  return "border-red-300";
}

function getOrderSelectClass(status: OrderStatus) {
  if (status === "new") return "border-blue-200 bg-blue-50 text-blue-700";
  if (["contacted", "quotation", "awaiting_dp"].includes(status))
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (["in_progress", "revision", "delivered", "deal"].includes(status))
    return "border-violet-200 bg-violet-50 text-violet-700";
  if (["completed", "closed"].includes(status))
    return "border-green-200 bg-green-50 text-green-700";
  return "border-red-200 bg-red-50 text-red-700";
}

const orderStatusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: "new", label: "Baru" },
  { value: "contacted", label: "Dihubungi" },
  { value: "quotation", label: "Penawaran" },
  { value: "awaiting_dp", label: "Menunggu DP" },
  { value: "in_progress", label: "Dikerjakan" },
  { value: "revision", label: "Revisi" },
  { value: "delivered", label: "Diserahkan" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "deal", label: "Deal (lama)" },
  { value: "closed", label: "Closed (lama)" },
];
