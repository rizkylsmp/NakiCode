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
import type { PortfolioItem, TemplateItem } from "../../content";
import type { OrderItem } from "../../order-types";
import type { DashboardView } from "./AdminTemplateWorkspace.shared";

type AdminDashboardPageProps = {
  templates: TemplateItem[];
  projects: PortfolioItem[];
  orders: OrderItem[];
  onNavigate: (view: DashboardView) => void;
  onRefreshOrders: () => void;
};

export function AdminDashboardPage({
  templates,
  projects,
  orders,
  onNavigate,
  onRefreshOrders,
}: AdminDashboardPageProps) {
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid").length;
  const pendingOrders = orders.filter((o) => o.paymentStatus === "pending").length;

  const stats = [
    {
      label: "Total Templates",
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
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" },
    green: { bg: "bg-green-50", icon: "text-green-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600" },
  };

  const quickActions = [
    {
      label: "Manage Templates",
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
      label: "Testimonials",
      desc: "Manage customer testimonials",
      icon: MessageSquareQuote,
      view: "testimonials" as DashboardView,
      color: "blue",
    },
    {
      label: "Categories",
      desc: "Manage template categories",
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            Filters
          </button>
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            Last 30 days
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
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`grid size-10 place-items-center rounded-lg ${colors.bg}`}>
                  <Icon size={20} className={colors.icon} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.changeType === "up" ? "text-green-600" : "text-red-600"
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
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
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
                className="group flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className={`grid size-11 place-items-center rounded-lg ${colors.bg} transition group-hover:scale-110`}>
                  <Icon size={20} className={colors.icon} />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {action.label}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <button
            onClick={() => onNavigate("orders")}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No orders yet
            </div>
          ) : (
            orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-gray-500">{order.templateTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </p>
                  <p className="text-xs text-gray-500">
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
