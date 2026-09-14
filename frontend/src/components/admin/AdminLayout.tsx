import type React from "react";
import { ADMIN_MENU_ITEMS, AdminSidebar } from "./AdminSidebar";
import { Header } from "../layout/Header";
import { type DashboardView } from "../../pages/admin/AdminTemplateWorkspace.shared";

type AdminLayoutProps = {
  children: React.ReactNode;
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  adminUsername: string;
  onLogout: () => void;
};

export function AdminLayout({
  children,
  activeView,
  onNavigate,
  adminUsername,
  onLogout,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-naki-page-bg">
      <Header />
      <AdminSidebar
        activeView={activeView}
        onNavigate={onNavigate}
        adminUsername={adminUsername}
        onLogout={onLogout}
      />
      <div className="sticky top-16 z-30 border-b border-naki-steel bg-white/95 px-3 py-2 backdrop-blur min-[360px]:top-[69px] lg:hidden">
        <label className="grid gap-1">
          <span className="sr-only">Menu admin</span>
          <select
            aria-label="Menu admin"
            className="h-11 w-full rounded-xl border border-naki-steel bg-naki-page-bg px-3 text-sm font-semibold text-naki-primary outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary"
            onChange={(event) =>
              onNavigate(event.target.value as DashboardView)
            }
            value={activeView}
          >
            {ADMIN_MENU_ITEMS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <main className="min-w-0 lg:ml-56 xl:ml-60">
        <div className="p-3 sm:p-4 lg:p-5 xl:p-6">{children}</div>
      </main>
    </div>
  );
}
