import type React from "react";
import { AdminSidebar } from "./AdminSidebar";
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
      <main className="ml-60">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
