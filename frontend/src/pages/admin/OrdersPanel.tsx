import { BadgeCheck, Inbox, MessageSquareText, RefreshCw, Trash2 } from "lucide-react";
import { PaginationControls } from "../../components/PaginationControls";
import { OrderCardSkeletonGrid } from "../../components/ProfileSkeleton";
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

  function updateStatusFilter(status: OrderStatusFilter) {
    onOrderFiltersChange({ ...orderFilters, status });
  }

  function updatePaymentStatusFilter(paymentStatus: PaymentStatusFilter) {
    onOrderFiltersChange({ ...orderFilters, paymentStatus });
  }

  return (
    <section className="py-8">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">Inbox order</h2>
          <p className="mt-1 text-sm font-semibold text-naki-smoke">
            Request konsultasi dari halaman detail template.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-naki-steel px-3 py-2 text-sm font-black text-naki-secondary">
            <BadgeCheck size={16} />
            {ordersStatus}
          </span>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost transition hover:bg-naki-primary disabled:cursor-not-allowed disabled:bg-naki-smoke"
            disabled={isLoadingOrders}
            onClick={onRefreshOrders}
            type="button"
          >
            <RefreshCw size={16} />
            {isLoadingOrders ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-card">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black text-naki-primary">Filter order</p>
            <p className="mt-1 text-xs font-semibold text-naki-smoke">
              {ordersMeta.total} order cocok dengan filter saat ini.
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              className="inline-flex h-9 w-fit items-center justify-center rounded-lg border border-naki-steel px-3 text-xs font-black text-naki-secondary transition hover:border-naki-smoke"
              onClick={() =>
                onOrderFiltersChange({ status: "all", paymentStatus: "all" })
              }
              type="button"
            >
              Reset filter
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          <FilterButtonGroup
            label="Status order"
            filters={orderStatusFilters}
            activeValue={orderFilters.status}
            onChange={updateStatusFilter}
          />
          <FilterButtonGroup
            label="Status pembayaran"
            filters={paymentStatusFilters}
            activeValue={orderFilters.paymentStatus}
            onChange={updatePaymentStatusFilter}
          />
        </div>
      </div>

      {isLoadingOrders ? (
        <OrderCardSkeletonGrid count={3} />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
          <Inbox className="mx-auto text-naki-secondary" size={34} />
          <h3 className="mt-4 text-2xl font-black">
            {hasActiveFilters ? "Tidak ada order di filter ini." : "Belum ada order."}
          </h3>
          <p className="mt-2 text-naki-smoke">
            {hasActiveFilters
              ? "Coba pilih status lain atau reset filter."
              : "Saat user mengirim form konsultasi, request akan muncul di sini."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-lg border border-naki-steel bg-naki-frost p-3 shadow-naki-card"
            >
              <div className="grid gap-3 xl:grid-cols-[1fr_170px] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <p className="w-fit rounded-md bg-naki-steel px-2 py-1 text-xs font-black uppercase text-naki-secondary">
                      #{order.id}
                    </p>
                    <h3 className="min-w-0 flex-1 truncate text-lg font-black leading-tight text-naki-primary">
                      {order.customerName}
                    </h3>
                    <span className="inline-flex h-8 w-fit items-center rounded-md bg-naki-steel px-2.5 text-xs font-black text-naki-primary">
                      {order.projectType}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-5">
                    <OrderMeta label="Kontak" value={order.customerContact} />
                    <OrderMeta label="Template" value={order.templateTitle} />
                    <OrderMeta label="Budget" value={order.budgetRange} />
                    <OrderMeta
                      label="Payment"
                      value={getPaymentStatusLabel(order.paymentStatus)}
                    />
                    <OrderMeta
                      label="Masuk"
                      value={formatOrderDate(order.createdAt)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="grid w-full gap-1 text-xs font-black text-naki-smoke">
                    Status
                    <select
                      className="h-9 rounded-lg border border-naki-steel bg-naki-frost px-2.5 text-xs font-black text-naki-primary outline-none transition focus:border-naki-secondary disabled:cursor-not-allowed disabled:text-naki-smoke"
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
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-naki-steel text-xs font-black text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed disabled:text-naki-smoke"
                    disabled={updatingOrderId === order.id}
                    onClick={() => onDeleteOrder(order)}
                    type="button"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>

              <div className="mt-2 rounded-lg bg-naki-steel p-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-naki-primary">
                  <MessageSquareText size={14} />
                  Brief
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-naki-smoke">
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
    </section>
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
      <p className="text-xs font-black uppercase text-naki-smoke">{label}</p>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = activeValue === filter.value;

          return (
            <button
              key={filter.value}
              className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-black transition ${
                isActive
                  ? "bg-naki-primary text-naki-frost"
                  : "border border-naki-steel text-naki-secondary hover:border-naki-smoke"
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
    <div className="min-w-0 rounded-md bg-naki-steel p-2">
      <p className="text-[10px] font-black uppercase text-naki-smoke">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-black text-naki-primary">
        {value}
      </p>
    </div>
  );
}

