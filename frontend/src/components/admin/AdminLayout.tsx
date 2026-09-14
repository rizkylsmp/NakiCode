import { ChevronRight, Menu } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  ADMIN_MENU_ITEMS,
  AdminMobileSidebar,
  AdminSidebar,
} from "./AdminSidebar";
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const activeMenuItem =
    ADMIN_MENU_ITEMS.find((item) => item.key === activeView) ??
    ADMIN_MENU_ITEMS[0];
  const ActiveMenuIcon = activeMenuItem.icon;

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSidebarOpen]);

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  const navigateFromMobile = (view: DashboardView) => {
    onNavigate(view);
    closeMobileSidebar();
  };

  return (
    <div className="min-h-screen bg-naki-page-bg">
      <Header />
      <AdminSidebar
        activeView={activeView}
        onNavigate={onNavigate}
        adminUsername={adminUsername}
        onLogout={onLogout}
      />
      <AdminMobileSidebar
        activeView={activeView}
        adminUsername={adminUsername}
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        onLogout={onLogout}
        onNavigate={navigateFromMobile}
      />
      <div className="sticky top-16 z-30 border-b border-naki-steel bg-white/95 px-3 py-2.5 backdrop-blur min-[360px]:top-[69px] sm:px-4 lg:hidden">
        <button
          aria-controls="admin-mobile-navigation"
          aria-expanded={isMobileSidebarOpen}
          aria-label="Buka menu admin"
          className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-naki-steel bg-naki-page-bg px-3 text-left shadow-sm transition hover:border-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary"
          onClick={() => setIsMobileSidebarOpen(true)}
          ref={menuButtonRef}
          type="button"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-naki-primary text-white shadow-sm">
            <Menu size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-naki-smoke">
              Menu admin
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-sm font-bold text-naki-primary">
              <ActiveMenuIcon
                aria-hidden="true"
                className="text-naki-secondary"
                size={15}
              />
              <span className="truncate">{activeMenuItem.label}</span>
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="shrink-0 text-naki-smoke"
            size={18}
          />
        </button>
      </div>
      <main className="min-w-0 lg:ml-56 xl:ml-60">
        <div className="p-3 sm:p-4 lg:p-5 xl:p-6">{children}</div>
      </main>
    </div>
  );
}
