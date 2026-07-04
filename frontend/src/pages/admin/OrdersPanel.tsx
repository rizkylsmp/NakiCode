import {
  AlertTriangle,
  CheckSquare,
  Inbox,
  MessageSquareText,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../services/api-client";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { OrderCardSkeletonGrid } from "../../components/ui/skeletons/ProfileSkeleton";
import { getPaymentStatusLabel, type OrderItem } from "../../domain/order-types";
import {
  formatOrderDate,
  orderStatusFilters,
  paymentStatusFilters,
  type AdminOrderFilters,
  type OrderStatus,
  type OrderStatusFilter,
  type PaymentStatusFilter,
} from "./AdminTemplateWorkspace.shared";

type OrdersStats = {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  newOrders: number;
  pendingPayments: number;
  failedPayments: number;
};

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
  const [ordersStats, setOrdersStats] = useState<OrdersStats | null>(null);
  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("contacted");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
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
        .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
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
  const briefLineClamp = density === "compact" ? "line-clamp-1" : "line-clamp-2";

  useEffect(() => {
    let isActive = true;

    apiGet<OrdersStats>("/api/orders/stats")
      .then((data) => {
        if (isActive) setOrdersStats(data);
      })
      .catch(() => {
        // Stats are non-critical; silently ignore if endpoint unavailable.
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const orderIds = new Set(orders.map((order) => order.id));
    setSelectedOrderIds((current) =>
      current.filter((orderId) => orderIds.has(orderId)),
    );
  }, [orders]);

  function updateStatusFilter(status: OrderStatusFilter) {
    onOrderFiltersChange({ ...orderFilters, status });
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
      for (const orderId of selectedVisibleOrderIds) {
        await onUpdateOrderStatus(orderId, bulkStatus);
      }
      setSelectedOrderIds((current) =>
        current.filter((orderId) => !selectedVisibleOrderIds.includes(orderId)),
      );
    } finally {
      setIsBulkUpdating(false);
    }
  }

  function resetOrderTools() {
    setSearch("");
    setSelectedOrderIds([]);
    onOrderFiltersChange({ status: "all", paymentStatus: "all" });
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {ordersStats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">Total Orders</p>
            <p className="mt-2 text-2xl font-bold text-naki-primary">{ordersStats.totalOrders}</p>
          </div>
          <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">Revenue</p>
            <p className="mt-2 text-2xl font-bold text-naki-primary">{formatRupiah(ordersStats.totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">Paid</p>
            <p className="mt-2 text-2xl font-bold text-naki-primary">{ordersStats.paidOrders}</p>
          </div>
          <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">New</p>
            <p className="mt-2 text-2xl font-bold text-naki-secondary">{ordersStats.newOrders}</p>
          </div>
          <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">Failed Payments</p>
            <p className="mt-2 text-2xl font-bold text-naki-secondary">{ordersStats.failedPayments}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Orders</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            Permintaan konsultasi dari halaman detail design.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-naki-steel bg-white px-4 py-2 text-sm font-medium text-naki-smoke transition hover:bg-naki-frost disabled:opacity-50"
          disabled={isLoadingOrders}
          onClick={onRefreshOrders}
          type="button"
        >
          <RefreshCw size={14} className={isLoadingOrders ? "animate-spin" : ""} />
          {isLoadingOrders ? "Loading..." : "Refresh"}
        </button>
      </div>

      {ordersStatus && (
        <div className="rounded-xl border border-naki-steel bg-white px-4 py-3 text-sm text-naki-smoke shadow-sm">
          {ordersStatus}
        </div>
      )}

      {failedOrders.length > 0 && (
        <div className="rounded-xl border border-naki-secondary/25 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-naki-secondary" size={18} />
            <div>
              <p className="text-sm font-semibold text-naki-primary">Payment issues</p>
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
      <div className="rounded-xl border border-naki-steel bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-naki-primary">Filter orders</p>
            <p className="mt-0.5 text-xs text-naki-smoke">
              {visibleOrders.length} order tampil dari {ordersMeta.total} hasil filter.
            </p>
          </div>
          {(hasActiveFilters || hasActiveSearch || selectedOrderIds.length > 0) && (
            <button
              className="inline-flex h-8 items-center rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:bg-naki-frost"
              onClick={resetOrderTools}
              type="button"
            >
              Reset
            </button>
          )}
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-naki-smoke">
              Search current page
            </span>
            <span className="flex h-10 items-center gap-2 rounded-lg border border-naki-steel bg-naki-page-bg px-3 focus-within:border-naki-primary">
              <Search size={15} className="text-naki-smoke" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-naki-primary outline-none"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearch("");
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
          <FilterButtonGroup
            label="Order status"
            filters={orderStatusFilters}
            activeValue={orderFilters.status}
            onChange={updateStatusFilter}
          />
          <FilterButtonGroup
            label="Payment status"
            filters={paymentStatusFilters}
            activeValue={orderFilters.paymentStatus}
            onChange={updatePaymentStatusFilter}
          />
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-naki-steel pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:border-naki-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={visibleOrders.length === 0}
              onClick={toggleVisibleSelection}
              type="button"
            >
              <CheckSquare size={14} />
              {areAllVisibleOrdersSelected ? "Unselect page" : "Select page"}
            </button>
            <span className="text-xs text-naki-smoke">
              {selectedVisibleOrderIds.length} selected on this page
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-xs font-medium text-naki-primary outline-none transition focus:border-naki-primary"
              onChange={(event) => setBulkStatus(event.target.value as OrderStatus)}
              value={bulkStatus}
            >
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              <option value="deal">deal</option>
              <option value="closed">closed</option>
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
              {isBulkUpdating ? "Updating..." : "Apply status"}
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
                  {mode === "comfortable" ? "Comfort" : "Compact"}
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
              ? "No orders match this view."
              : "No orders yet."}
          </h3>
          <p className="mt-2 text-sm text-naki-smoke">
            {hasActiveFilters || hasActiveSearch
              ? "Try another keyword, select a different status, or reset the view."
              : "When users submit consultation forms, requests will appear here."}
          </p>
          {(hasActiveFilters || hasActiveSearch) && (
            <button
              className="mt-5 inline-flex h-9 items-center rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:bg-naki-frost"
              onClick={resetOrderTools}
              type="button"
            >
              Reset view
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <article
              key={order.id}
              className={`rounded-xl border border-naki-steel bg-white ${cardPadding} shadow-sm`}
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
                    <span className="inline-flex h-7 w-fit items-center rounded-md bg-naki-frost px-2.5 text-xs font-medium text-naki-smoke">
                      {order.projectType}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-5">
                    <OrderMeta label="Contact" value={order.customerContact} />
                    <OrderMeta label="Design" value={order.templateTitle} />
                    <OrderMeta label="Budget" value={order.budgetRange} />
                    <OrderMeta
                      label="Payment"
                      value={getPaymentStatusLabel(order.paymentStatus)}
                    />
                    <OrderMeta
                      label="Created"
                      value={formatOrderDate(order.createdAt)}
                    />
                  </div>
                  {order.paymentStatus === "failed" && order.paymentFailureReason && (
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
                          order.paymentFailureCode ? `Code ${order.paymentFailureCode}` : null,
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
                      className="h-10 rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm text-naki-primary outline-none transition focus:border-naki-primary disabled:cursor-not-allowed disabled:text-naki-smoke"
                      disabled={updatingOrderId === order.id}
                      value={order.status}
                      onChange={(event) =>
                        onUpdateOrderStatus(
                          order.id,
                          event.target.value as OrderStatus,
                        )
                      }
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="deal">deal</option>
                      <option value="closed">closed</option>
                    </select>
                  </label>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white text-xs font-medium text-naki-smoke transition hover:border-naki-steel hover:text-naki-secondary disabled:cursor-not-allowed disabled:text-naki-smoke"
                    disabled={updatingOrderId === order.id}
                    onClick={() => onDeleteOrder(order)}
                    type="button"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              <div className={`${density === "compact" ? "mt-3" : "mt-4"} rounded-lg bg-naki-frost p-3`}>
                <div className="flex items-center gap-2 text-xs font-semibold text-naki-smoke">
                  <MessageSquareText size={14} />
                  Brief
                </div>
                <p className={`mt-1.5 ${briefLineClamp} text-sm leading-relaxed text-naki-smoke`}>
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
    </div>
  );
}

type OrderMetaProps = {
  label: string;
  value: string;
};

type FilterButtonGroupProps<Value extends string> = {
  label: string;
  filters: Array<{ label: string; value: Value }>;
  activeValue: Value;
  onChange: (value: Value) => void;
};

function FilterButtonGroup<Value extends string>({
  label,
  filters,
  activeValue,
  onChange,
}: FilterButtonGroupProps<Value>) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = activeValue === filter.value;

          return (
            <button
              key={filter.value}
              className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-medium transition ${
                isActive
                  ? "bg-naki-primary text-white"
                  : "border border-naki-steel bg-white text-naki-smoke hover:border-naki-primary/40"
              }`}
              onClick={() => onChange(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderMeta({ label, value }: OrderMetaProps) {
  return (
    <div className="min-w-0 rounded-lg bg-naki-frost p-2">
      <p className="text-[10px] font-medium uppercase text-naki-smoke">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium text-naki-primary">
        {value}
      </p>
    </div>
  );
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
