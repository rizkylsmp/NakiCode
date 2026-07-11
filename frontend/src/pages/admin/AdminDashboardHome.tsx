import { AlertTriangle, ClipboardList, Globe2, Inbox, Tag } from "lucide-react";
import type React from "react";
import { type PortfolioItem, type TemplateItem } from "../../domain/content";
import { type OrderItem } from "../../domain/order-types";
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

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === "paid"
  ).length;
  const failedOrders = orders.filter(
    (order) => order.paymentStatus === "failed"
  );

  return (
    <section className="flex flex-col gap-8 py-8">
      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-naki-smoke">Total Design</p>
          <p className="mt-2 text-3xl font-bold text-naki-primary">
            {templates.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-naki-smoke">Order Masuk</p>
          <p className="mt-2 text-3xl font-bold text-naki-primary">
            {orders.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-naki-smoke">Order Paid</p>
          <p className="mt-2 text-3xl font-bold text-naki-primary">
            {paidOrders}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-naki-smoke">Portofolio</p>
          <p className="mt-2 text-3xl font-bold text-naki-primary">
            {projects.length}
          </p>
        </div>
      </div>

      {failedOrders.length > 0 && (
        <button
          className="rounded-2xl border border-naki-secondary/25 bg-white p-5 text-left shadow-sm transition hover:shadow-lg"
          onClick={() => openView("orders")}
          type="button"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-naki-frost text-naki-secondary">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="text-base font-semibold text-naki-primary">
                {failedOrders.length} pembayaran gagal
              </p>
              <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                {failedOrders[0]?.paymentFailureReason ??
                  "Buka Orders untuk melihat detail webhook gateway."}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Shortcut Cards */}
      <div>
        <h2 className="text-lg font-bold leading-tight text-naki-primary">
          Quick Actions
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <button
            className="group flex flex-col gap-4 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-lg"
            onClick={() => openView("design")}
            type="button"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-naki-frost text-naki-secondary transition group-hover:bg-naki-primary group-hover:text-white">
              <ClipboardList size={20} />
            </span>
            <div>
              <p className="text-base font-semibold text-naki-primary">
                Kelola Design
              </p>
              <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                Tambah, edit, atau hapus produk katalog.
              </p>
            </div>
          </button>

          <button
            className="group flex flex-col gap-4 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-lg"
            onClick={() => openView("orders")}
            type="button"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-naki-frost text-naki-secondary transition group-hover:bg-naki-primary group-hover:text-white">
              <Inbox size={20} />
            </span>
            <div>
              <p className="text-base font-semibold text-naki-primary">
                Order Masuk
              </p>
              <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                Cek request konsultasi dan status pembayaran.
              </p>
            </div>
          </button>

          <button
            className="group flex flex-col gap-4 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-lg"
            onClick={() => openView("design")}
            type="button"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-naki-frost text-naki-secondary transition group-hover:bg-naki-primary group-hover:text-white">
              <Tag size={20} />
            </span>
            <div>
              <p className="text-base font-semibold text-naki-primary">
                Kategori
              </p>
              <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                Buka tab design lalu atur kategori.
              </p>
            </div>
          </button>

          <button
            className="group flex flex-col gap-4 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-lg"
            onClick={() => openView("portfolio")}
            type="button"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-naki-frost text-naki-secondary transition group-hover:bg-naki-primary group-hover:text-white">
              <Globe2 size={20} />
            </span>
            <div>
              <p className="text-base font-semibold text-naki-primary">
                Portofolio
              </p>
              <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                Update website yang tampil di storefront.
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
