import { BadgeCheck, Inbox, MessageSquareText, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "../../api-client";
import { PaginationControls } from "../../components/PaginationControls";
import { OrderCardSkeletonGrid } from "../../components/skeletons/ProfileSkeleton";
import { getPaymentStatusLabel, type OrderItem } from "../../order-types";
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
  onUpdateOrderStatus: (orderId: number, status: OrderStatus) => void;
  onDeleteOrder: (order: OrderItem) => void;
};

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

  function updateStatusFilter(status: OrderStatusFilter) {
    onOrderFiltersChange({ ...orderFilters, status });
  }

  function updatePaymentStatusFilter(paymentStatus: PaymentStatusFilter) {
    onOrderFiltersChange({ ...orderFilters, paymentStatus });
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {ordersStats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Orders</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            Consultation requests from template detail pages.
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

      {/* Filters */}
      <div className="rounded-xl border border-naki-steel bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-naki-primary">Filter orders</p>
            <p className="mt-0.5 text-xs text-naki-smoke">
              {ordersMeta.total} orders match current filters.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              className="inline-flex h-8 items-center rounded-lg border border-naki-steel bg-white px-3 text-xs font-medium text-naki-smoke transition hover:bg-naki-frost"
              onClick={() =>
                onOrderFiltersChange({ status: "all", paymentStatus: "all" })
              }
              type="button"
            >
              Reset filters
            </button>
          )}
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
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
      </div>

      {/* Orders List */}
      {isLoadingOrders ? (
        <OrderCardSkeletonGrid count={3} />
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-naki-steel bg-white p-12 text-center shadow-sm">
          <Inbox className="mx-auto text-naki-steel" size={40} />
          <h3 className="mt-4 text-lg font-bold text-naki-primary">
            {hasActiveFilters ? "No orders match this filter." : "No orders yet."}
          </h3>
          <p className="mt-2 text-sm text-naki-smoke">
            {hasActiveFilters
              ? "Try selecting a different status or reset filters."
              : "When users submit consultation forms, requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl border border-naki-steel bg-white p-5 shadow-sm"
            >
              <div className="grid gap-4 md:grid-cols-[1fr_170px] md:items-start">
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
                    <OrderMeta label="Template" value={order.templateTitle} />
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

              <div className="mt-4 rounded-lg bg-naki-frost p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-naki-smoke">
                  <MessageSquareText size={14} />
                  Brief
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-naki-smoke">
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

type StatCardProps = {
  label: string;
  value: string;
  color?: string;
};

function StatCard({ label, value, color = "text-naki-primary" }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-naki-smoke uppercase tracking-wide">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
