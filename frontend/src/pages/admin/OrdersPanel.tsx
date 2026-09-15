import {
  AlertTriangle,
  BadgeCheck,
  CheckSquare,
  Inbox,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  BadgeDollarSign,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  apiDelete,
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
import { formatRupiahInputPreview } from "../../utils/currency";
import {
  formatOrderDate,
  orderStatusFilters,
  paymentStatusFilters,
  type AdminOrderFilters,
  type OrderStatus,
  type OrderStatusFilter,
  type PaymentStatusFilter,
  formatFileSize,
  uploadSourcePackage,
} from "./AdminDesignWorkspace.shared";

type OrdersPanelProps = {
  adminToken?: string | null;
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
  onOrdersPageSizeChange?: (pageSize: number) => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (order: OrderItem) => void;
};

type DensityMode = "comfortable" | "compact";
type OrderActionDialog = {
  kind: "quote" | "refund" | "delivery";
  order: OrderItem;
  amount: string;
  notes: string;
  depositPercent: string;
  demoUrl?: string;
  sourceUrl?: string;
  sourceFile?: File | null;
};

export function OrdersPanel({
  adminToken = null,
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
  onOrdersPageSizeChange,
  onUpdateOrderStatus,
  onDeleteOrder,
}: OrdersPanelProps) {
  const hasActiveFilters =
    orderFilters.status !== "all" || orderFilters.paymentStatus !== "all";
  const [search, setSearch] = useState(orderFilters.search);
  const [density, setDensity] = useState<DensityMode>("compact");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("contacted");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkDeleteOrderIds, setBulkDeleteOrderIds] = useState<number[] | null>(
    null,
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [actionDialog, setActionDialog] = useState<OrderActionDialog | null>(
    null,
  );
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [confirmingLynkOrderId, setConfirmingLynkOrderId] = useState<
    number | null
  >(null);
  const failedOrders = orders.filter(
    (order) =>
      ["failed", "expired"].includes(order.paymentStatus) &&
      order.paymentFailureReason,
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
  const bulkDeleteOrders = bulkDeleteOrderIds
    ? orders.filter((order) => bulkDeleteOrderIds.includes(order.id))
    : [];
  const deletableBulkOrders = bulkDeleteOrders.filter(
    (order) =>
      !["paid", "partial_refunded", "refunded"].includes(order.paymentStatus),
  );
  const protectedBulkOrderCount =
    bulkDeleteOrders.length - deletableBulkOrders.length;
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
      const result = await apiPatch<{ updated: number; skipped: number[] }>(
        "/api/orders/bulk/status",
        {
          ids: selectedVisibleOrderIds,
          status: bulkStatus,
        },
      );
      onRefreshOrders();
      setSelectedOrderIds((current) =>
        current.filter((orderId) => !selectedVisibleOrderIds.includes(orderId)),
      );
      setActionStatus(
        result.skipped.length > 0
          ? `${result.updated} order diperbarui; ${result.skipped.length} dilewati karena transisinya tidak aman.`
          : `${result.updated} order berhasil diperbarui.`,
      );
    } catch (error) {
      setActionStatus(
        getApiErrorMessage(error, "Gagal memperbarui order terpilih."),
      );
    } finally {
      setIsBulkUpdating(false);
    }
  }

  async function confirmBulkDelete() {
    if (deletableBulkOrders.length === 0) return;

    const idsToDelete = deletableBulkOrders.map((order) => order.id);
    setIsBulkDeleting(true);

    const results = await Promise.allSettled(
      idsToDelete.map((orderId) => apiDelete(`/api/orders/${orderId}`)),
    );
    const deletedIds = idsToDelete.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failedCount = results.length - deletedIds.length;

    if (deletedIds.length > 0) {
      setSelectedOrderIds((current) =>
        current.filter((orderId) => !deletedIds.includes(orderId)),
      );
      onRefreshOrders();
    }

    const statusParts = [`${deletedIds.length} order berhasil dihapus`];
    if (protectedBulkOrderCount > 0) {
      statusParts.push(
        `${protectedBulkOrderCount} order bertransaksi tidak dihapus`,
      );
    }
    if (failedCount > 0) {
      statusParts.push(`${failedCount} order gagal dihapus`);
    }
    setActionStatus(`${statusParts.join("; ")}.`);
    setBulkDeleteOrderIds(null);
    setIsBulkDeleting(false);
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
    if (
      actionDialog.kind !== "delivery" &&
      (!Number.isSafeInteger(amount) || amount <= 0)
    ) {
      setActionStatus("Nominal harus lebih dari nol.");
      return;
    }
    if (
      actionDialog.kind === "delivery" &&
      !actionDialog.sourceFile &&
      !actionDialog.sourceUrl?.trim()
    ) {
      setActionStatus("Upload arsip source code final atau isi URL source.");
      return;
    }
    setIsSavingAction(true);
    try {
      if (actionDialog.kind === "quote") {
        const depositPercent = 50;
        await apiPatch(`/api/orders/${actionDialog.order.id}/quote`, {
          amount,
          notes: actionDialog.notes || null,
          depositPercent,
        });
        setActionStatus(
          "Penawaran tersimpan dan pelanggan telah diberi notifikasi.",
        );
      } else if (actionDialog.kind === "refund") {
        await apiPost(`/api/finance/orders/${actionDialog.order.id}/refund`, {
          amount,
          notes: actionDialog.notes || null,
        });
        setActionStatus("Refund berhasil dicatat di pembukuan.");
      } else {
        let sourceUrl = actionDialog.sourceUrl?.trim() || "";
        if (actionDialog.sourceFile) {
          const uploaded = await uploadSourcePackage(
            actionDialog.sourceFile,
            adminToken,
          );
          sourceUrl = uploaded.source.url;
        }
        await apiPatch(`/api/orders/${actionDialog.order.id}/delivery`, {
          demoUrl: actionDialog.demoUrl?.trim() || null,
          sourceUrl,
          notes: actionDialog.notes.trim(),
        });
        setActionStatus(
          "Hasil review dan source final dikirim. Source akan terbuka setelah pesanan lunas.",
        );
      }
      setActionDialog(null);
      onRefreshOrders();
    } catch (error) {
      setActionStatus(
        getApiErrorMessage(
          error,
          actionDialog.kind === "quote"
            ? "Gagal menyimpan penawaran."
            : actionDialog.kind === "delivery"
              ? "Gagal mengirim hasil pekerjaan."
              : "Gagal mencatat refund.",
        ),
      );
    } finally {
      setIsSavingAction(false);
    }
  }

  async function confirmLynkPayment(order: OrderItem) {
    setConfirmingLynkOrderId(order.id);
    setActionStatus(`Mengonfirmasi pembayaran Lynk order #${order.id}...`);
    try {
      await apiPost(`/api/orders/${order.id}/payment/confirm-lynk`);
      setActionStatus(
        `Pembayaran Lynk order #${order.id} berhasil dikonfirmasi.`,
      );
      onRefreshOrders();
    } catch (error) {
      setActionStatus(
        getApiErrorMessage(error, "Gagal mengonfirmasi pembayaran Lynk."),
      );
    } finally {
      setConfirmingLynkOrderId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">
            Kelola order
          </h1>
          <p className="mt-1 text-sm text-naki-smoke">
            {ordersMeta.total} order • Tindak lanjuti brief, penawaran,
            pembayaran, dan progres project.
          </p>
        </div>
        <div className="flex w-full justify-end sm:w-auto">
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
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
      <div className="rounded-2xl border border-naki-steel bg-white p-3 shadow-naki-card sm:p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-naki-primary">
              <SlidersHorizontal size={16} />
              Cari dan filter
            </p>
            <p className="mt-0.5 text-xs text-naki-smoke">
              {visibleOrders.length} dari {ordersMeta.total} order
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(hasActiveFilters || hasActiveSearch) && (
              <span className="inline-flex h-8 items-center rounded-lg bg-naki-secondary/10 px-3 text-xs font-semibold text-naki-secondary">
                Filter aktif
              </span>
            )}
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
            <button
              aria-controls="admin-order-filter-fields"
              aria-expanded={isFilterPanelOpen}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-xs font-semibold text-naki-primary transition hover:border-naki-primary/40"
              onClick={() => setIsFilterPanelOpen((current) => !current)}
              type="button"
            >
              {isFilterPanelOpen ? "Sembunyikan filter" : "Tampilkan filter"}
              <ChevronDown
                className={`transition-transform ${isFilterPanelOpen ? "rotate-180" : ""}`}
                size={14}
              />
            </button>
          </div>
        </div>
        {isFilterPanelOpen && (
          <div
            className="mt-3 grid gap-2 border-t border-naki-steel pt-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_170px_190px]"
            id="admin-order-filter-fields"
          >
            <label className="sm:col-span-2 lg:col-span-1">
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
            <div className="sm:col-span-1 lg:col-span-1">
              <CompactFilterSelect
                label="Status order"
                filters={orderStatusFilters}
                activeValue={orderFilters.status}
                onChange={updateStatusFilter}
              />
            </div>
            <CompactFilterSelect
              label="Pembayaran"
              filters={paymentStatusFilters}
              activeValue={orderFilters.paymentStatus}
              onChange={updatePaymentStatusFilter}
            />
          </div>
        )}
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedVisibleOrderIds.length > 0 ? (
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:flex sm:flex-none">
                <select
                  className="h-9 min-w-0 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-xs font-medium text-naki-primary outline-none transition focus:border-naki-primary sm:min-w-[148px]"
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
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-naki-primary px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isBulkUpdating || updatingOrderId !== null}
                  onClick={applyBulkStatusUpdate}
                  type="button"
                >
                  {isBulkUpdating ? "Memperbarui..." : "Terapkan status"}
                </button>
                <button
                  aria-label="Hapus order terpilih"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20"
                  disabled={
                    isBulkUpdating ||
                    isBulkDeleting ||
                    updatingOrderId !== null
                  }
                  onClick={() =>
                    setBulkDeleteOrderIds([...selectedVisibleOrderIds])
                  }
                  type="button"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            ) : null}
            <div className="inline-flex rounded-lg border border-naki-steel bg-white p-1">
              {(["comfortable", "compact"] as const).map((mode) => (
                <button
                  key={mode}
                  aria-pressed={density === mode}
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
          {density === "compact" ? (
            <CompactOrdersTable
              confirmingLynkOrderId={confirmingLynkOrderId}
              onConfirmLynkPayment={confirmLynkPayment}
              onDeleteOrder={onDeleteOrder}
              onOpenAction={setActionDialog}
              onToggleOrderSelection={toggleOrderSelection}
              onUpdateOrderStatus={onUpdateOrderStatus}
              orders={visibleOrders}
              selectedOrderIds={selectedOrderIds}
              updatingOrderId={updatingOrderId}
            />
          ) : (
            visibleOrders.map((order) => (
              <article
                key={order.id}
                className={`overflow-hidden rounded-2xl border bg-white ${getOrderBorderClass(order.status as OrderStatus)} ${cardPadding} shadow-naki-card`}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(190px,220px)] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 border-b border-naki-steel pb-3">
                      <label className="flex size-7 shrink-0 items-center justify-center rounded-md bg-naki-frost">
                        <input
                          aria-label={`Select order #${order.id}`}
                          checked={selectedOrderIds.includes(order.id)}
                          className="size-4 rounded border-naki-steel text-naki-primary focus:ring-naki-primary"
                          onChange={() => toggleOrderSelection(order.id)}
                          type="checkbox"
                        />
                      </label>
                      <p className="w-fit rounded-md bg-naki-frost px-2.5 py-1 text-xs font-semibold text-naki-primary">
                        #{order.id}
                      </p>
                      <h3 className="min-w-[140px] flex-1 truncate text-base font-bold text-naki-primary">
                        {order.customerName}
                      </h3>
                      <StatusBadge status={order.status as OrderStatus} />
                      <span className="inline-flex h-7 w-fit items-center rounded-md bg-naki-frost px-2.5 text-xs font-medium text-naki-smoke">
                        {order.projectType}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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
                    {order.quoteAmount ? (
                      <div className="mt-3 rounded-lg border border-naki-steel bg-naki-frost p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-naki-primary">
                            Penawaran Rp
                            {order.quoteAmount.toLocaleString("id-ID")}
                          </p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-naki-smoke">
                            {getQuoteStatusLabel(order.quoteStatus)}
                          </span>
                        </div>
                        {order.orderType === "custom_project" ? (
                          <p className="mt-1.5 text-xs font-medium text-naki-smoke">
                            Opsi DP 50% / lunas · Dibayar Rp
                            {order.amountPaid.toLocaleString("id-ID")} · Sisa Rp
                            {order.remainingAmount.toLocaleString("id-ID")}
                          </p>
                        ) : null}
                        {order.quoteNotes ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-naki-smoke">
                            {order.quoteNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {order.deliveryReviewStatus ? (
                      <div className="mt-3 rounded-lg border border-naki-steel bg-naki-frost p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-naki-secondary">
                            Review hasil
                          </p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-naki-smoke">
                            {order.deliveryReviewStatus === "pending"
                              ? "Menunggu pelanggan"
                              : order.deliveryReviewStatus === "approved"
                                ? "Disetujui"
                                : "Revisi diminta"}
                          </span>
                        </div>
                        {order.revisionNotes ? (
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-naki-smoke">
                            {order.revisionNotes}
                          </p>
                        ) : null}
                        {order.revisionFiles.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {order.revisionFiles.map((file, index) => (
                              <a
                                key={file}
                                className="text-xs font-semibold text-naki-secondary underline"
                                href={file}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {getAttachmentLabel(file, index)}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {["failed", "expired", "cancelled"].includes(
                      order.paymentStatus,
                    ) &&
                      order.paymentFailureReason && (
                        <div className="mt-3 rounded-lg border border-naki-secondary/20 bg-naki-frost p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-naki-secondary">
                            <AlertTriangle size={14} />
                            {order.paymentStatus === "expired"
                              ? "Pembayaran kedaluwarsa"
                              : order.paymentStatus === "cancelled"
                                ? "Pembayaran dibatalkan"
                                : "Alasan pembayaran gagal"}
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
                    <div className="mt-4 rounded-lg bg-naki-frost p-3">
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
                  </div>
                  <div className="grid gap-2 rounded-xl border border-naki-steel bg-naki-frost p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
                    <label className="grid w-full gap-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-1">
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
                        {getAllowedOrderStatusOptions(order).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {["pending", "failed", "expired", "cancelled"].includes(
                      order.paymentStatus,
                    ) &&
                      order.orderType === "custom_project" &&
                      !["completed", "closed", "cancelled"].includes(
                        order.status,
                      ) && (
                        <button
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-primary transition hover:bg-naki-frost"
                          onClick={() =>
                            setActionDialog({
                              kind: "quote",
                              order,
                              amount: String(order.quoteAmount ?? ""),
                              notes: order.quoteNotes ?? "",
                              depositPercent: String(
                                order.depositPercent ?? 50,
                              ),
                            })
                          }
                          type="button"
                        >
                          <BadgeDollarSign size={14} />
                          {order.quoteAmount
                            ? "Ubah penawaran"
                            : "Beri penawaran"}
                        </button>
                      )}
                    {order.paymentStatus === "waiting_payment" &&
                    order.paymentMethod?.toLowerCase() === "lynk" ? (
                      <button
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={confirmingLynkOrderId === order.id}
                        onClick={() => void confirmLynkPayment(order)}
                        type="button"
                      >
                        <BadgeCheck size={14} />
                        {confirmingLynkOrderId === order.id
                          ? "Mengonfirmasi..."
                          : "Konfirmasi bayar Lynk"}
                      </button>
                    ) : null}
                    {order.orderType === "custom_project" &&
                    ["partial_paid", "paid"].includes(order.paymentStatus) &&
                    (["in_progress", "revision"].includes(order.status) ||
                      (order.status === "delivered" &&
                        order.deliveryReviewStatus === "pending" &&
                        !order.deliverySourceUrl)) ? (
                      <button
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-naki-primary px-3 text-xs font-semibold text-white transition hover:opacity-90"
                        onClick={() =>
                          setActionDialog({
                            kind: "delivery",
                            order,
                            amount: "0",
                            notes: order.deliveryNotes ?? "",
                            depositPercent: "50",
                            demoUrl: order.deliveryDemoUrl ?? "",
                            sourceUrl: order.deliverySourceUrl ?? "",
                            sourceFile: null,
                          })
                        }
                        type="button"
                      >
                        <Send size={14} />
                        {order.status === "revision" ||
                        order.deliveryReviewStatus === "revision_requested"
                          ? "Kirim hasil revisi"
                          : order.status === "delivered"
                            ? "Lengkapi source final"
                            : "Kirim hasil review"}
                      </button>
                    ) : null}
                    {["partial_paid", "paid", "partial_refunded"].includes(
                      order.paymentStatus,
                    ) && (
                      <button
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-primary transition hover:bg-naki-frost"
                        onClick={() =>
                          setActionDialog({
                            kind: "refund",
                            order,
                            amount: String(
                              order.amountPaid || order.paymentAmount || "",
                            ),
                            notes: "",
                            depositPercent: "50",
                          })
                        }
                        type="button"
                      >
                        <RotateCcw size={14} />
                        Catat refund
                      </button>
                    )}
                    <button
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:border-naki-steel hover:text-naki-secondary disabled:cursor-not-allowed disabled:text-naki-smoke"
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
              </article>
            ))
          )}
        </div>
      )}
      <PaginationControls
        alwaysVisible
        page={ordersPage}
        total={ordersMeta.total}
        totalPages={ordersMeta.totalPages}
        pageSize={ordersMeta.pageSize}
        isLoading={isLoadingOrders}
        onPageChange={onOrdersPageChange}
        onPageSizeChange={onOrdersPageSizeChange}
      />
      {bulkDeleteOrderIds && (
        <div
          aria-labelledby="bulk-delete-order-title"
          aria-modal="true"
          className="fixed inset-0 z-[95] grid place-items-center bg-naki-primary/60 p-4"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isBulkDeleting) {
              setBulkDeleteOrderIds(null);
            }
          }}
          role="alertdialog"
        >
          <div className="w-full max-w-md rounded-2xl border border-naki-steel bg-white p-5 shadow-naki-card">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300">
                <AlertTriangle size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  className="text-lg font-bold text-naki-primary"
                  id="bulk-delete-order-title"
                >
                  Hapus {bulkDeleteOrders.length} order terpilih?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                  {deletableBulkOrders.length} order dapat dihapus
                  {protectedBulkOrderCount > 0
                    ? `, ${protectedBulkOrderCount} order bertransaksi akan tetap disimpan.`
                    : ". Tindakan ini tidak dapat dibatalkan."}
                </p>
              </div>
              <button
                aria-label="Tutup dialog hapus order"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost"
                disabled={isBulkDeleting}
                onClick={() => setBulkDeleteOrderIds(null)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-xl border border-naki-steel px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:opacity-50"
                disabled={isBulkDeleting}
                onClick={() => setBulkDeleteOrderIds(null)}
                type="button"
              >
                {deletableBulkOrders.length > 0 ? "Batal" : "Tutup"}
              </button>
              {deletableBulkOrders.length > 0 ? (
                <button
                  autoFocus
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isBulkDeleting}
                  onClick={() => void confirmBulkDelete()}
                  type="button"
                >
                  <Trash2 size={15} />
                  {isBulkDeleting
                    ? "Menghapus..."
                    : `Hapus ${deletableBulkOrders.length} order`}
                </button>
              ) : null}
            </div>
          </div>
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
                    : actionDialog.kind === "delivery"
                      ? "Kirim hasil review"
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
              {actionDialog.kind !== "delivery" ? (
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
                  {formatRupiahInputPreview(actionDialog.amount) ? (
                    <span
                      aria-live="polite"
                      className="text-xs font-semibold text-naki-secondary"
                    >
                      {formatRupiahInputPreview(actionDialog.amount)}
                    </span>
                  ) : null}
                </label>
              ) : (
                <>
                  <label className="grid gap-1.5 text-xs font-medium text-naki-smoke">
                    URL demo
                    <input
                      autoFocus
                      className="h-11 rounded-xl border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary"
                      placeholder="https://demo.website..."
                      type="url"
                      value={actionDialog.demoUrl ?? ""}
                      onChange={(event) =>
                        setActionDialog({
                          ...actionDialog,
                          demoUrl: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-naki-smoke">
                    Source code final
                    <span className="font-normal leading-relaxed">
                      Upload ZIP/RAR maksimal 100 MB. File disimpan sekarang,
                      tetapi baru dapat diunduh pelanggan setelah lunas.
                    </span>
                    <span className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary transition hover:border-naki-secondary">
                      <span className="min-w-0 truncate">
                        {actionDialog.sourceFile
                          ? `${actionDialog.sourceFile.name} · ${formatFileSize(actionDialog.sourceFile.size)}`
                          : "Pilih arsip source final"}
                      </span>
                      <span className="shrink-0 font-semibold text-naki-secondary">
                        Browse
                      </span>
                      <input
                        accept=".zip,.rar"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (file && file.size > 100 * 1024 * 1024) {
                            setActionStatus(
                              "Ukuran source final maksimal 100 MB.",
                            );
                            event.target.value = "";
                            return;
                          }
                          setActionDialog({
                            ...actionDialog,
                            sourceFile: file,
                          });
                        }}
                        type="file"
                      />
                    </span>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-naki-smoke">
                    Atau URL source final
                    <input
                      className="h-11 rounded-xl border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary"
                      placeholder="https://drive..."
                      type="text"
                      value={actionDialog.sourceUrl ?? ""}
                      onChange={(event) =>
                        setActionDialog({
                          ...actionDialog,
                          sourceUrl: event.target.value,
                        })
                      }
                    />
                  </label>
                </>
              )}
              {actionDialog.kind === "quote" ? (
                <div className="rounded-xl bg-naki-frost p-3 text-xs leading-relaxed text-naki-smoke">
                  Pelanggan dapat memilih DP 50% atau langsung melunasi seluruh
                  penawaran. Jika memilih DP, sisanya baru ditagihkan setelah
                  hasil pekerjaan disetujui.
                </div>
              ) : null}
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
                    : actionDialog.kind === "delivery"
                      ? "Kirim ke pelanggan"
                      : "Catat refund"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type CompactOrdersTableProps = {
  orders: OrderItem[];
  selectedOrderIds: number[];
  updatingOrderId: number | null;
  confirmingLynkOrderId: number | null;
  onToggleOrderSelection: (orderId: number) => void;
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  onConfirmLynkPayment: (order: OrderItem) => Promise<void>;
  onOpenAction: (dialog: OrderActionDialog) => void;
  onDeleteOrder: (order: OrderItem) => void;
};

function CompactOrdersTable({
  orders,
  selectedOrderIds,
  updatingOrderId,
  confirmingLynkOrderId,
  onToggleOrderSelection,
  onUpdateOrderStatus,
  onConfirmLynkPayment,
  onOpenAction,
  onDeleteOrder,
}: CompactOrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-naki-steel bg-white shadow-naki-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
          <caption className="sr-only">
            Daftar order dalam tampilan tabel ringkas
          </caption>
          <thead className="bg-naki-frost text-[11px] font-semibold uppercase tracking-wide text-naki-smoke">
            <tr>
              <th className="w-11 px-3 py-2.5">
                <span className="sr-only">Pilih</span>
              </th>
              <th className="w-20 px-2 py-2.5">Order</th>
              <th className="w-48 px-3 py-2.5">Pelanggan</th>
              <th className="w-52 px-3 py-2.5">Pesanan</th>
              <th className="w-48 px-3 py-2.5">Progres</th>
              <th className="w-48 px-3 py-2.5">Pembayaran</th>
              <th className="w-28 px-3 py-2.5">Dibuat</th>
              <th className="w-44 px-3 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-naki-steel">
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`align-middle transition hover:bg-naki-frost/70 ${
                  selectedOrderIds.includes(order.id)
                    ? "bg-naki-frost"
                    : "bg-white"
                }`}
              >
                <td className="px-3 py-2.5">
                  <input
                    aria-label={`Select order #${order.id}`}
                    checked={selectedOrderIds.includes(order.id)}
                    className="size-4 rounded border-naki-steel text-naki-primary focus:ring-naki-primary"
                    onChange={() => onToggleOrderSelection(order.id)}
                    type="checkbox"
                  />
                </td>
                <td className="px-2 py-2.5">
                  <span className="inline-flex rounded-md bg-naki-frost px-2 py-1 text-xs font-bold text-naki-primary">
                    #{order.id}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <p className="truncate font-semibold text-naki-primary">
                    {order.customerName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-naki-smoke">
                    {order.customerContact}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <p
                    className="truncate font-medium text-naki-primary"
                    title={order.templateTitle}
                  >
                    {order.templateTitle}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-naki-smoke">
                    {order.projectType}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <div className="grid gap-1.5">
                    <StatusBadge status={order.status as OrderStatus} />
                    <select
                      aria-label={`Ubah status order #${order.id}`}
                      className={`h-8 min-w-0 rounded-lg border px-2 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 ${getOrderSelectClass(order.status as OrderStatus)}`}
                      disabled={updatingOrderId === order.id}
                      value={order.status}
                      onChange={(event) =>
                        onUpdateOrderStatus(
                          order.id,
                          event.target.value as OrderStatus,
                        )
                      }
                    >
                      {getAllowedOrderStatusOptions(order).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <PaymentBadge status={order.paymentStatus} />
                  <p className="mt-1.5 truncate text-xs font-medium text-naki-smoke">
                    Dibayar Rp{order.amountPaid.toLocaleString("id-ID")}
                    {order.remainingAmount > 0
                      ? ` · Sisa Rp${order.remainingAmount.toLocaleString("id-ID")}`
                      : ""}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-xs text-naki-smoke">
                  {formatOrderDate(order.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {canSendQuote(order) ? (
                      <button
                        aria-label={`${order.quoteAmount ? "Ubah" : "Beri"} penawaran order #${order.id}`}
                        className="grid size-8 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:bg-naki-frost"
                        onClick={() => onOpenAction(makeQuoteDialog(order))}
                        title={
                          order.quoteAmount
                            ? "Ubah penawaran"
                            : "Beri penawaran"
                        }
                        type="button"
                      >
                        <BadgeDollarSign size={14} />
                      </button>
                    ) : null}
                    {order.paymentStatus === "waiting_payment" &&
                    order.paymentMethod?.toLowerCase() === "lynk" ? (
                      <button
                        aria-label={`Konfirmasi pembayaran Lynk order #${order.id}`}
                        className="grid size-8 place-items-center rounded-lg bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-60"
                        disabled={confirmingLynkOrderId === order.id}
                        onClick={() => void onConfirmLynkPayment(order)}
                        title="Konfirmasi pembayaran Lynk"
                        type="button"
                      >
                        <BadgeCheck size={14} />
                      </button>
                    ) : null}
                    {canSendDelivery(order) ? (
                      <button
                        aria-label={`Kirim hasil order #${order.id}`}
                        className="grid size-8 place-items-center rounded-lg bg-naki-primary text-white transition hover:opacity-90"
                        onClick={() => onOpenAction(makeDeliveryDialog(order))}
                        title={
                          order.status === "delivered"
                            ? "Lengkapi source final"
                            : "Kirim hasil review"
                        }
                        type="button"
                      >
                        <Send size={14} />
                      </button>
                    ) : null}
                    {canRefund(order) ? (
                      <button
                        aria-label={`Catat refund order #${order.id}`}
                        className="grid size-8 place-items-center rounded-lg border border-naki-steel bg-white text-naki-primary transition hover:bg-naki-frost"
                        onClick={() => onOpenAction(makeRefundDialog(order))}
                        title="Catat refund"
                        type="button"
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : null}
                    <button
                      aria-label={`Hapus order #${order.id}`}
                      className="grid size-8 place-items-center rounded-lg border border-naki-steel bg-white text-naki-smoke transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        updatingOrderId === order.id ||
                        ["paid", "partial_refunded", "refunded"].includes(
                          order.paymentStatus,
                        )
                      }
                      onClick={() => onDeleteOrder(order)}
                      title="Hapus order"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function canSendQuote(order: OrderItem) {
  return (
    ["pending", "failed", "expired", "cancelled"].includes(
      order.paymentStatus,
    ) &&
    order.orderType === "custom_project" &&
    !["completed", "closed", "cancelled"].includes(order.status)
  );
}

function canSendDelivery(order: OrderItem) {
  return (
    order.orderType === "custom_project" &&
    ["partial_paid", "paid"].includes(order.paymentStatus) &&
    (["in_progress", "revision"].includes(order.status) ||
      (order.status === "delivered" &&
        order.deliveryReviewStatus === "pending" &&
        !order.deliverySourceUrl))
  );
}

function canRefund(order: OrderItem) {
  return ["partial_paid", "paid", "partial_refunded"].includes(
    order.paymentStatus,
  );
}

function makeQuoteDialog(order: OrderItem): OrderActionDialog {
  return {
    kind: "quote",
    order,
    amount: String(order.quoteAmount ?? ""),
    notes: order.quoteNotes ?? "",
    depositPercent: String(order.depositPercent ?? 50),
  };
}

function makeDeliveryDialog(order: OrderItem): OrderActionDialog {
  return {
    kind: "delivery",
    order,
    amount: "0",
    notes: order.deliveryNotes ?? "",
    depositPercent: "50",
    demoUrl: order.deliveryDemoUrl ?? "",
    sourceUrl: order.deliverySourceUrl ?? "",
    sourceFile: null,
  };
}

function makeRefundDialog(order: OrderItem): OrderActionDialog {
  return {
    kind: "refund",
    order,
    amount: String(order.amountPaid || order.paymentAmount || ""),
    notes: "",
    depositPercent: "50",
  };
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
            {filter.label}
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
        : status === "expired"
          ? "bg-amber-50 text-amber-700"
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

function getAttachmentLabel(url: string, index: number) {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const rawName = decodeURIComponent(pathname.split("/").pop() ?? "");
    const cleanName = rawName.replace(/^\d+-[a-f0-9]{16}-/i, "");
    return cleanName || `Lampiran revisi ${index + 1}`;
  } catch {
    return `Lampiran revisi ${index + 1}`;
  }
}

function getQuoteStatusLabel(status: OrderItem["quoteStatus"]) {
  if (status === "accepted") return "Disetujui pelanggan";
  if (status === "rejected") return "Ditolak pelanggan";
  return "Menunggu respons";
}

function getAllowedOrderStatusOptions(order: OrderItem) {
  const transitions: Record<string, OrderStatus[]> = {
    new: ["contacted", "quotation", "cancelled"],
    contacted: ["quotation", "awaiting_dp", "cancelled"],
    quotation: ["contacted", "awaiting_dp", "cancelled"],
    awaiting_dp: ["quotation", "in_progress", "cancelled"],
    awaiting_balance: ["cancelled"],
    in_progress: ["delivered", "cancelled"],
    revision: ["in_progress", "delivered", "cancelled"],
    delivered: ["in_progress", "awaiting_balance", "cancelled"],
    completed: ["closed"],
    cancelled: ["contacted"],
    deal: ["in_progress", "closed", "cancelled"],
    closed: [],
  };
  const current = order.status as OrderStatus;
  const allowed = new Set<OrderStatus>([
    current,
    ...(transitions[current] ?? []),
  ]);
  if (
    !["pending", "failed", "expired", "cancelled"].includes(order.paymentStatus)
  ) {
    allowed.delete("cancelled");
  }
  if (order.orderType === "custom_project") {
    (["delivered", "awaiting_balance", "completed"] as OrderStatus[]).forEach(
      (status) => {
        if (status !== current) allowed.delete(status);
      },
    );
  }
  return orderStatusOptions.filter((option) => allowed.has(option.value));
}

function getOrderBadgeClass(status: OrderStatus) {
  if (status === "new") return "bg-blue-50 text-blue-700";
  if (["contacted", "quotation", "awaiting_dp"].includes(status))
    return "bg-amber-50 text-amber-700";
  if (
    [
      "in_progress",
      "revision",
      "delivered",
      "awaiting_balance",
      "deal",
    ].includes(status)
  )
    return "bg-violet-50 text-violet-700";
  if (["completed", "closed"].includes(status))
    return "bg-green-50 text-green-700";
  return "bg-red-50 text-red-700";
}

function getOrderBorderClass(status: OrderStatus) {
  if (status === "new") return "border-blue-300";
  if (["contacted", "quotation", "awaiting_dp"].includes(status))
    return "border-amber-300";
  if (
    [
      "in_progress",
      "revision",
      "delivered",
      "awaiting_balance",
      "deal",
    ].includes(status)
  )
    return "border-violet-300";
  if (["completed", "closed"].includes(status)) return "border-green-300";
  return "border-red-300";
}

function getOrderSelectClass(status: OrderStatus) {
  if (status === "new") return "border-blue-200 bg-blue-50 text-blue-700";
  if (["contacted", "quotation", "awaiting_dp"].includes(status))
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (
    [
      "in_progress",
      "revision",
      "delivered",
      "awaiting_balance",
      "deal",
    ].includes(status)
  )
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
  { value: "awaiting_balance", label: "Menunggu pelunasan" },
  { value: "in_progress", label: "Dikerjakan" },
  { value: "revision", label: "Revisi" },
  { value: "delivered", label: "Diserahkan" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "deal", label: "Deal (lama)" },
  { value: "closed", label: "Closed (lama)" },
];
