import { ClipboardList, Globe2, Inbox, Tag } from "lucide-react";
import type React from "react";
import { type PortfolioItem, type TemplateItem } from "../../content";
import { type OrderItem } from "../../order-types";
import { type DashboardView } from "./AdminTemplateWorkspace.shared";

type AdminDashboardHomeProps = {
  templates: TemplateItem[];
  projects: PortfolioItem[];
  orders: OrderItem[];
  onNavigate: (view: DashboardView) => void;
  onRefreshOrders: () => void;
};

export function AdminDashboardHome({
  templates,
  projects,
  orders,
  onNavigate,
  onRefreshOrders,
}: AdminDashboardHomeProps) {
  function openView(view: Exclude<DashboardView, "dashboard">) {
    onNavigate(view);

    if (view === "orders") {
      onRefreshOrders();
    }
  }

  return (
    <section className="grid gap-6 py-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardShortcutCard
          icon={<ClipboardList size={20} />}
          label="Kelola Template"
          value={`${templates.length} template`}
          description="Tambah, edit, atau hapus produk katalog."
          onClick={() => openView("templates")}
        />
        <DashboardShortcutCard
          icon={<Inbox size={20} />}
          label="Order Masuk"
          value={`${orders.length} order`}
          description="Cek request konsultasi dan status pembayaran."
          onClick={() => openView("orders")}
        />
        <DashboardShortcutCard
          icon={<Tag size={20} />}
          label="Kategori"
          value="Kelola"
          description="Buka tab template lalu atur kategori."
          onClick={() => openView("templates")}
        />
        <DashboardShortcutCard
          icon={<Globe2 size={20} />}
          label="Portofolio"
          value={`${projects.length} project`}
          description="Update website yang tampil di storefront."
          onClick={() => openView("portfolio")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Total Template" value={templates.length} />
        <DashboardStatCard label="Order Masuk" value={orders.length} />
        <DashboardStatCard
          label="Order Paid"
          value={orders.filter((order) => order.paymentStatus === "paid").length}
        />
        <DashboardStatCard label="Portofolio" value={projects.length} />
      </div>
    </section>
  );
}

type DashboardShortcutCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  onClick: () => void;
};

type DashboardStatCardProps = {
  label: string;
  value: number;
};

function DashboardStatCard({ label, value }: DashboardStatCardProps) {
  return (
    <div className="rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-card">
      <p className="text-sm font-black uppercase text-naki-smoke">{label}</p>
      <p className="mt-2 text-3xl font-black text-naki-primary">{value}</p>
    </div>
  );
}

function DashboardShortcutCard({
  icon,
  label,
  value,
  description,
  onClick,
}: DashboardShortcutCardProps) {
  return (
    <button
      className="group rounded-xl border border-naki-steel bg-naki-frost p-4 text-left shadow-naki-card transition hover:-translate-y-0.5 hover:shadow-naki-soft"
      onClick={onClick}
      type="button"
    >
      <span className="grid size-11 place-items-center rounded-lg bg-naki-steel text-naki-secondary transition group-hover:bg-naki-primary group-hover:text-naki-frost">
        {icon}
      </span>
      <span className="mt-4 block text-lg font-black text-naki-primary">
        {label}
      </span>
      <span className="mt-1 block text-2xl font-black text-naki-secondary">
        {value}
      </span>
      <span className="mt-2 block text-sm font-semibold leading-6 text-naki-smoke">
        {description}
      </span>
    </button>
  );
}

