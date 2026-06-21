import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
} from "lucide-react";
import { apiGet } from "../api-client";

type AdminStatsResponse = {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  topTemplates: Array<{
    templateTitle: string;
    orderCount: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: number;
    customerName: string;
    templateTitle: string;
    budgetRange: string;
    status: string;
    createdAt: string;
  }>;
  weeklyRevenue: Array<{
    week: string;
    revenue: number;
    orders: number;
  }>;
};

export function AdminDashboard() {
  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useQuery<AdminStatsResponse>({
    queryKey: ["admin-stats"],
    queryFn: () => apiGet<AdminStatsResponse>("/api/admin/stats"),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-naki-steel bg-naki-frost p-8 text-center shadow-naki-card">
        <p className="text-sm font-semibold text-naki-smoke">
          Gagal memuat statistik dashboard.
        </p>
        <p className="mt-2 text-xs text-naki-smoke">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      deal: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
      paid: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <section className="py-8">
      {/* Key Metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Total Order"
          value={stats.totalOrders.toString()}
          color="blue"
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Revenue"
          value={formatRupiah(stats.totalRevenue)}
          color="green"
        />
        <MetricCard
          icon={<Package className="h-5 w-5" />}
          label="Template Populer"
          value={stats.topTemplates[0]?.templateTitle || "-"}
          subtitle={
            stats.topTemplates[0]
              ? `${stats.topTemplates[0].orderCount} order`
              : undefined
          }
          color="purple"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Order Minggu Ini"
          value={stats.weeklyRevenue[0]?.orders.toString() || "0"}
          subtitle={
            stats.weeklyRevenue[0]
              ? formatRupiah(stats.weeklyRevenue[0].revenue)
              : undefined
          }
          color="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Templates */}
        <div className="rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-card">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-naki-secondary" />
            <h3 className="text-lg font-black text-naki-primary">
              Template Populer
            </h3>
          </div>
          {stats.topTemplates.length === 0 ? (
            <p className="text-sm text-naki-smoke">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {stats.topTemplates.slice(0, 5).map((template, index) => (
                <div
                  key={template.templateTitle}
                  className="flex items-center justify-between gap-3 rounded-lg border border-naki-steel bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-naki-steel text-sm font-black text-naki-secondary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-naki-primary">
                        {template.templateTitle}
                      </p>
                      <p className="text-xs text-naki-smoke">
                        {template.orderCount} order • {formatRupiah(template.revenue)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-card">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-naki-secondary" />
            <h3 className="text-lg font-black text-naki-primary">
              Status Order
            </h3>
          </div>
          {stats.ordersByStatus.length === 0 ? (
            <p className="text-sm text-naki-smoke">Belum ada data</p>
          ) : (
            <div className="space-y-2">
              {stats.ordersByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-lg border border-naki-steel bg-white p-3"
                >
                  <span
                    className={`rounded-md px-3 py-1 text-sm font-semibold ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                  <span className="font-black text-naki-primary">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6 rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-card">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-naki-secondary" />
          <h3 className="text-lg font-black text-naki-primary">
            Order Terbaru
          </h3>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-naki-smoke">Belum ada order</p>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-naki-steel bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-naki-primary">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-naki-smoke">
                      {order.templateTitle}
                    </p>
                    <p className="mt-1 text-xs text-naki-smoke">
                      {order.budgetRange} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Revenue */}
      {stats.weeklyRevenue.length > 0 && (
        <div className="mt-6 rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-card">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-naki-secondary" />
            <h3 className="text-lg font-black text-naki-primary">
              Revenue Mingguan
            </h3>
          </div>
          <div className="space-y-2">
            {stats.weeklyRevenue.map((week) => (
              <div
                key={week.week}
                className="flex items-center justify-between rounded-lg border border-naki-steel bg-white p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-naki-primary">
                    {week.week}
                  </p>
                  <p className="text-xs text-naki-smoke">
                    {week.orders} order
                  </p>
                </div>
                <p className="font-black text-naki-primary">
                  {formatRupiah(week.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

type MetricCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: "blue" | "green" | "purple" | "orange";
};

function MetricCard({ icon, label, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-card">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-naki-smoke">{label}</p>
          <p className="text-2xl font-black text-naki-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-naki-smoke">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="py-8">
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-card"
          >
            <div className="h-4 w-24 bg-naki-steel rounded"></div>
            <div className="mt-2 h-8 w-32 bg-naki-steel rounded"></div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-naki-steel bg-naki-frost p-6 shadow-naki-card"
          >
            <div className="h-6 w-40 bg-naki-steel rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-16 bg-naki-steel rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
