import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Clock,
  Trophy,
  Award,
  Medal,
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
          icon={<ShoppingCart className="h-6 w-6" />}
          label="Total Order"
          value={stats.totalOrders.toString()}
          trend={
            stats.weeklyRevenue.length > 1
              ? {
                  value: stats.weeklyRevenue[0]?.orders || 0,
                  label: "minggu ini",
                }
              : undefined
          }
          color="blue"
        />
        <MetricCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Total Revenue"
          value={formatRupiah(stats.totalRevenue)}
          trend={
            stats.weeklyRevenue.length > 1
              ? {
                  value: stats.weeklyRevenue[0]?.revenue || 0,
                  label: "minggu ini",
                  isRupiah: true,
                }
              : undefined
          }
          color="green"
        />
        <MetricCard
          icon={<Trophy className="h-6 w-6" />}
          label="Template Populer"
          value={stats.topTemplates[0]?.templateTitle || "Belum ada"}
          subtitle={
            stats.topTemplates[0]
              ? `${stats.topTemplates[0].orderCount} order • ${formatRupiah(stats.topTemplates[0].revenue)}`
              : undefined
          }
          color="purple"
        />
        <MetricCard
          icon={<BarChart3 className="h-6 w-6" />}
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
            <Trophy className="h-5 w-5 text-naki-secondary" />
            <h3 className="text-lg font-black text-naki-primary">
              Template Populer
            </h3>
          </div>
          {stats.topTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-naki-steel mb-3" />
              <p className="text-sm font-semibold text-naki-smoke">
                Belum ada order
              </p>
              <p className="text-xs text-naki-smoke mt-1">
                Data akan muncul setelah ada order
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topTemplates.slice(0, 5).map((template, index) => {
                const rankIcons = [
                  <Trophy className="h-4 w-4" />,
                  <Award className="h-4 w-4" />,
                  <Medal className="h-4 w-4" />,
                ];
                const rankColors = [
                  "bg-yellow-400 text-yellow-900",
                  "bg-gray-300 text-gray-700",
                  "bg-orange-400 text-orange-900",
                ];
                const isTopThree = index < 3;

                return (
                  <div
                    key={template.templateTitle}
                    className="flex items-center justify-between gap-3 rounded-lg border border-naki-steel bg-white p-3 transition-all hover:shadow-md hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                          isTopThree
                            ? rankColors[index]
                            : "bg-naki-steel text-naki-secondary"
                        }`}
                      >
                        {isTopThree ? rankIcons[index] : index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-naki-primary truncate">
                          {template.templateTitle}
                        </p>
                        <p className="text-xs text-naki-smoke">
                          {template.orderCount} order • {formatRupiah(template.revenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-naki-steel mb-3" />
              <p className="text-sm font-semibold text-naki-smoke">
                Belum ada order
              </p>
              <p className="text-xs text-naki-smoke mt-1">
                Data akan muncul setelah ada order
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.ordersByStatus.map((item) => {
                const totalOrders = stats.ordersByStatus.reduce(
                  (sum, s) => sum + s.count,
                  0
                );
                const percentage =
                  totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;

                return (
                  <div
                    key={item.status}
                    className="rounded-lg border border-naki-steel bg-white p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`rounded-md px-3 py-1 text-sm font-semibold ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-naki-primary">
                          {item.count}
                        </span>
                        <span className="text-xs text-naki-smoke">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-naki-steel rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStatusColor(item.status).split(" ")[0]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-naki-steel mb-3" />
            <p className="text-sm font-semibold text-naki-smoke">
              Belum ada order
            </p>
            <p className="text-xs text-naki-smoke mt-1">
              Order terbaru akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-naki-steel bg-white p-3 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-naki-primary truncate">
                        {order.customerName}
                      </p>
                    </div>
                    <p className="text-sm text-naki-smoke truncate">
                      {order.templateTitle}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-naki-smoke">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {order.budgetRange}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
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
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-naki-secondary" />
              <h3 className="text-lg font-black text-naki-primary">
                Revenue Mingguan
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-naki-smoke">Total 8 minggu</p>
              <p className="text-sm font-black text-naki-primary">
                {formatRupiah(stats.weeklyRevenue.reduce((sum, w) => sum + w.revenue, 0))}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {stats.weeklyRevenue.map((week, index) => {
              const maxRevenue = Math.max(...stats.weeklyRevenue.map(w => w.revenue), 1);
              const percentage = (week.revenue / maxRevenue) * 100;
              const prevWeek = stats.weeklyRevenue[index + 1];
              const trend = prevWeek
                ? ((week.revenue - prevWeek.revenue) / (prevWeek.revenue || 1)) * 100
                : 0;

              return (
                <div
                  key={week.week}
                  className="rounded-lg border border-naki-steel bg-white p-3 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-naki-primary">
                        {week.week}
                      </p>
                      <p className="text-xs text-naki-smoke">
                        {week.orders} order
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-naki-primary">
                        {formatRupiah(week.revenue)}
                      </p>
                      {prevWeek && (
                        <div className="flex items-center gap-1 justify-end text-xs">
                          {trend > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : trend < 0 ? (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          ) : null}
                          <span className={trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-naki-smoke"}>
                            {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-naki-steel rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-linear-to-r from-naki-secondary to-naki-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
  trend?: {
    value: number;
    label: string;
    isRupiah?: boolean;
  };
  color: "blue" | "green" | "purple" | "orange";
};

function MetricCard({ icon, label, value, subtitle, trend, color }: MetricCardProps) {
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
          {trend && (
            <p className="text-xs font-semibold text-naki-secondary mt-1">
              {trend.isRupiah ? 'Rp' : ''}{trend.value} <span className="text-naki-smoke font-normal">{trend.label}</span>
            </p>
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
