import type React from "react";
import { AdminSidebar } from "./AdminSidebar";
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
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        activeView={activeView}
        onNavigate={onNavigate}
        adminUsername={adminUsername}
        onLogout={onLogout}
      />
      <main className="ml-60 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
