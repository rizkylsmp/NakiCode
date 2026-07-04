import { useMemo } from "react";
import {
  FileText,
  ShoppingCart,
  CreditCard,
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MessageSquareQuote,
  Tag,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PortfolioItem, TemplateItem } from "../../domain/content";
import type { OrderItem } from "../../domain/order-types";
import type { DashboardView } from "./AdminTemplateWorkspace.shared";

// Naki Code theme colors for charts
const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  accent: "#f59e0b",
  success: "#10b981",
  smoke: "#9ca3af",
  frost: "#e2e8f0",
  palette: ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"],
};

type AdminDashboardPageProps = {
  templates: TemplateItem[];
  projects: PortfolioItem[];
  orders: OrderItem[];
  onNavigate: (view: DashboardView) => void;
  onRefreshOrders: () => void;
};

type ChartPayloadEntry = {
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartPayloadEntry[];
  label?: number | string;
};

type PieLabelProps = {
  name?: string;
  value?: number | string;
};

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-naki-steel bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-naki-primary">{label}</p>
      {payload.map((entry, index) => (
        <p key={`${entry.name ?? "item"}-${index}`} className="text-xs text-naki-smoke">
          {entry.name}:{" "}
          <span className="font-semibold text-naki-primary">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function renderPieLabel({ name, value }: PieLabelProps) {
  return `${name}: ${value}`;
}

export function AdminDashboardPage({
  templates,
  projects,
  orders,
  onNavigate,
  onRefreshOrders,
}: AdminDashboardPageProps) {
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid").length;

  // Orders by month (last 6 months)
  const ordersByMonth = useMemo(() => {
    const now = new Date();
    const months: { name: string; orders: number; paid: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
      const monthOrders = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      });
      months.push({
        name: monthLabel,
        orders: monthOrders.length,
        paid: monthOrders.filter((o) => o.paymentStatus === "paid").length,
      });
    }

    return months;
  }, [orders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Payment status distribution
  const paymentStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.paymentStatus] = (counts[o.paymentStatus] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Templates by category
  const templatesByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [templates]);

  const stats = [
    {
      label: "Total Design",
      value: templates.length,
      icon: FileText,
      color: "blue",
      change: "+2",
      changeType: "up" as const,
      view: "templates" as DashboardView,
    },
    {
      label: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      color: "purple",
      change: "+5",
      changeType: "up" as const,
      view: "orders" as DashboardView,
    },
    {
      label: "Paid Orders",
      value: paidOrders,
      icon: CreditCard,
      color: "green",
      change: "+3",
      changeType: "up" as const,
      view: "orders" as DashboardView,
    },
    {
      label: "Portfolio",
      value: projects.length,
      icon: Briefcase,
      color: "orange",
      change: "+1",
      changeType: "up" as const,
      view: "portfolio" as DashboardView,
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-naki-frost", icon: "text-naki-primary" },
    purple: { bg: "bg-naki-frost", icon: "text-naki-secondary" },
    green: { bg: "bg-naki-frost", icon: "text-naki-primary" },
    orange: { bg: "bg-naki-frost", icon: "text-naki-secondary" },
  };

  const quickActions = [
    {
      label: "Kelola Design",
      desc: "Add, edit, or delete catalog products",
      icon: FileText,
      view: "templates" as DashboardView,
      color: "blue",
    },
    {
      label: "View Orders",
      desc: "Check consultation requests and payments",
      icon: ShoppingCart,
      view: "orders" as DashboardView,
      color: "purple",
    },
    {
      label: "Manage Portfolio",
      desc: "Update websites shown on storefront",
      icon: Briefcase,
      view: "portfolio" as DashboardView,
      color: "orange",
    },
    {
      label: "View Blog",
      desc: "Manage blog posts and articles",
      icon: FileText,
      view: "blog" as DashboardView,
      color: "green",
    },
    {
      label: "Testimoni",
      desc: "Kelola testimoni customer",
      icon: MessageSquareQuote,
      view: "testimonials" as DashboardView,
      color: "blue",
    },
    {
      label: "Categories",
      desc: "Kelola kategori design",
      icon: Tag,
      view: "categories" as DashboardView,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-naki-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-naki-smoke">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-naki-steel bg-white px-4 py-2 text-sm font-medium text-naki-smoke transition hover:bg-naki-frost">
            Filters
          </button>
          <button className="rounded-lg border border-naki-steel bg-white px-4 py-2 text-sm font-medium text-naki-smoke transition hover:bg-naki-frost">
            Last 6 months
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`grid size-10 place-items-center rounded-lg ${colors.bg}`}>
                  <Icon size={20} className={colors.icon} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.changeType === "up" ? "text-naki-primary" : "text-naki-secondary"
                }`}>
                  {stat.changeType === "up" ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-naki-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-naki-smoke">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1: Orders Trend + Order Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Orders Trend - Area Chart */}
        <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-naki-primary">Orders Trend</h2>
              <p className="text-sm text-naki-smoke">Monthly orders over the last 6 months</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersByMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.frost} />
                <XAxis dataKey="name" tick={{ fill: CHART_COLORS.smoke, fontSize: 12 }} axisLine={{ stroke: CHART_COLORS.frost }} tickLine={false} />
                <YAxis tick={{ fill: CHART_COLORS.smoke, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="orders"
                  name="Total Orders"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorOrders)"
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  name="Paid"
                  stroke={CHART_COLORS.success}
                  strokeWidth={2}
                  fill="url(#colorPaid)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status - Donut Chart */}
        <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-naki-primary">Order Status</h2>
            <p className="text-sm text-naki-smoke">Distribution by status</p>
          </div>
          <div className="h-64">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {ordersByStatus.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS.palette[index % CHART_COLORS.palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-naki-smoke">
                No orders yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Payment Status + Templates by Category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Status - Bar Chart */}
        <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-naki-primary">Payment Status</h2>
            <p className="text-sm text-naki-smoke">Orders by payment status</p>
          </div>
          <div className="h-64">
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentStatusData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.frost} />
                  <XAxis dataKey="name" tick={{ fill: CHART_COLORS.smoke, fontSize: 12 }} axisLine={{ stroke: CHART_COLORS.frost }} tickLine={false} />
                  <YAxis tick={{ fill: CHART_COLORS.smoke, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Orders" radius={[6, 6, 0, 0]}>
                    {paymentStatusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS.palette[index % CHART_COLORS.palette.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-naki-smoke">
                No payment data yet
              </div>
            )}
          </div>
        </div>

        {/* Templates by Category - Horizontal Bar Chart */}
        <div className="rounded-xl border border-naki-steel bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-naki-primary">Design per Kategori</h2>
            <p className="text-sm text-naki-smoke">Distribution across categories</p>
          </div>
          <div className="h-64">
            {templatesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={templatesByCategory}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.frost} horizontal={false} />
                  <XAxis type="number" tick={{ fill: CHART_COLORS.smoke, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: CHART_COLORS.smoke, fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Design" radius={[0, 6, 6, 0]}>
                    {templatesByCategory.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS.palette[index % CHART_COLORS.palette.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-naki-smoke">
                Belum ada design
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-naki-primary">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colors = colorMap[action.color];
            return (
              <button
                key={action.label}
                onClick={() => {
                  onNavigate(action.view);
                  if (action.view === "orders") onRefreshOrders();
                }}
                className="group flex flex-col gap-4 rounded-xl border border-naki-steel bg-white p-6 text-left shadow-sm transition hover:border-naki-primary/40 hover:shadow-md"
              >
                <div className={`grid size-11 place-items-center rounded-lg ${colors.bg} transition group-hover:scale-110`}>
                  <Icon size={20} className={colors.icon} />
                </div>
                <div>
                  <p className="text-base font-semibold text-naki-primary">
                    {action.label}
                  </p>
                  <p className="mt-1 text-sm text-naki-smoke">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-naki-steel bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-naki-steel px-6 py-4">
          <h2 className="text-lg font-semibold text-naki-primary">Recent Orders</h2>
          <button
            onClick={() => onNavigate("orders")}
            className="flex items-center gap-1 text-sm font-medium text-naki-primary hover:opacity-80"
          >
            View all
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-naki-steel">
          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-naki-smoke">
              No orders yet
            </div>
          ) : (
            orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-naki-primary">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-naki-smoke">{order.templateTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-naki-primary">
                    {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </p>
                  <p className="text-xs text-naki-smoke">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
