import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Briefcase,
  MessageSquareQuote,
  Tag,
  TicketPercent,
  BookOpen,
  WalletCards,
  ContactRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { type DashboardView } from "../../pages/admin/AdminDesignWorkspace.shared";

type AdminSidebarProps = {
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  adminUsername: string;
  onLogout: () => void;
};

type AdminMobileSidebarProps = AdminSidebarProps & {
  isOpen: boolean;
  onClose: () => void;
};

type AdminDesktopSidebarProps = AdminSidebarProps & {
  collapsed: boolean;
  onToggle: () => void;
};

type MenuItem = {
  key: DashboardView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const MAIN_MENU: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const APP_MENU: MenuItem[] = [
  { key: "design", label: "Design", icon: FileText },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "outreach", label: "Client Outreach", icon: ContactRound },
  { key: "finance", label: "Keuangan", icon: WalletCards },
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "blog", label: "Blog", icon: BookOpen },
  { key: "testimonials", label: "Testimoni", icon: MessageSquareQuote },
  { key: "categories", label: "Categories", icon: Tag },
  { key: "coupons", label: "Coupon", icon: TicketPercent },
];

export const ADMIN_MENU_ITEMS: MenuItem[] = [...MAIN_MENU, ...APP_MENU];

type NavSection = {
  label: string;
  items: MenuItem[];
};

const NAV_SECTIONS: NavSection[] = [
  { label: "Main", items: MAIN_MENU },
  { label: "App", items: APP_MENU },
];

type AdminNavigationProps = Pick<
  AdminSidebarProps,
  "activeView" | "onNavigate"
> & {
  mobile?: boolean;
  collapsed?: boolean;
};

function AdminNavigation({
  activeView,
  onNavigate,
  mobile = false,
  collapsed = false,
}: AdminNavigationProps) {
  return (
    <>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-5 last:mb-0">
          <p
            className={`${collapsed ? "sr-only" : "mb-1.5 px-3"} text-[10px] font-semibold uppercase tracking-[0.16em] text-naki-smoke`}
          >
            {section.label}
          </p>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;

              return (
                <li key={item.key}>
                  <button
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={() => onNavigate(item.key)}
                    type="button"
                    className={`group flex min-h-11 w-full items-center rounded-xl py-2 text-left text-[13px] font-semibold transition focus-visible:ring-2 focus-visible:ring-naki-secondary ${collapsed ? "justify-center px-1" : "gap-3 px-3"} ${
                      isActive
                        ? mobile
                          ? "bg-naki-primary text-white shadow-naki-card"
                          : "bg-naki-frost text-naki-primary"
                        : "text-naki-smoke hover:bg-naki-frost/60 hover:text-naki-primary"
                    }`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg transition ${
                        isActive && mobile
                          ? "bg-white/15 text-white"
                          : isActive
                            ? "bg-white text-naki-primary shadow-sm"
                            : "bg-naki-frost text-naki-smoke group-hover:text-naki-primary"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    {!collapsed && (
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    )}
                    {isActive && mobile ? (
                      <span className="size-1.5 rounded-full bg-naki-secondary" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Link
        to="/admin/digital-office"
        aria-label="Kantor Digital"
        title={collapsed ? "Kantor Digital" : undefined}
        className={`flex min-h-11 items-center rounded-xl py-2 text-[13px] font-semibold text-naki-primary hover:bg-naki-frost focus-visible:ring-2 focus-visible:ring-naki-secondary ${collapsed ? "justify-center px-1" : "gap-3 px-3"}`}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-naki-frost">
          <Building2 size={16} aria-hidden="true" />
        </span>
        {!collapsed && <span>Kantor Digital</span>}
      </Link>
    </>
  );
}

function AdminProfile({
  adminUsername,
  onLogout,
  collapsed = false,
}: Pick<AdminSidebarProps, "adminUsername" | "onLogout"> & {
  collapsed?: boolean;
}) {
  return (
    <div
      className={`flex items-center rounded-xl bg-naki-frost/60 py-2.5 ${collapsed ? "flex-col gap-2 px-1" : "gap-3 px-2.5"}`}
    >
      <div
        title={collapsed ? adminUsername : undefined}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-naki-primary text-xs font-semibold text-white shadow-sm"
      >
        {adminUsername.charAt(0).toUpperCase()}
      </div>
      <div className={collapsed ? "sr-only" : "min-w-0 flex-1"}>
        <p className="truncate text-[13px] font-semibold text-naki-primary">
          {adminUsername}
        </p>
        <p className="text-[11px] text-naki-smoke">Administrator</p>
      </div>
      <button
        onClick={onLogout}
        className="grid size-11 shrink-0 place-items-center rounded-lg text-naki-smoke transition hover:bg-red-50 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-red-400"
        title="Logout"
        aria-label="Logout admin"
        type="button"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}

export function AdminSidebar({
  activeView,
  onNavigate,
  adminUsername,
  onLogout,
  collapsed,
  onToggle,
}: AdminDesktopSidebarProps) {
  const toggleLabel = collapsed ? "Perluas sidebar" : "Ciutkan sidebar";
  return (
    <aside
      aria-label="Navigasi admin"
      id="admin-desktop-navigation"
      className={`fixed left-0 top-[73px] z-40 hidden h-[calc(100dvh-73px)] flex-col border-r border-naki-steel bg-white transition-[width] duration-200 motion-reduce:transition-none lg:flex ${collapsed ? "w-20" : "w-56 xl:w-60"}`}
    >
      <div
        className={`flex shrink-0 items-center border-b border-naki-steel p-2.5 ${collapsed ? "justify-center" : "justify-between gap-2"}`}
      >
        {!collapsed && (
          <p className="pl-2 text-xs font-semibold text-naki-smoke">
            Menu admin
          </p>
        )}
        <button
          aria-controls="admin-desktop-navigation"
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-naki-steel text-naki-primary transition hover:bg-naki-frost focus-visible:ring-2 focus-visible:ring-naki-secondary"
          onClick={onToggle}
          type="button"
        >
          {collapsed ? (
            <PanelLeftOpen size={19} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={19} aria-hidden="true" />
          )}
        </button>
      </div>
      {/* Navigation */}
      <nav
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 ${collapsed ? "px-2" : "px-2.5 xl:px-3"}`}
      >
        <AdminNavigation
          activeView={activeView}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      </nav>

      {/* User Profile */}
      <div
        className={`shrink-0 border-t border-naki-steel ${collapsed ? "p-2" : "p-2.5 xl:p-3"}`}
      >
        <AdminProfile
          adminUsername={adminUsername}
          onLogout={onLogout}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}

export function AdminMobileSidebar({
  activeView,
  onNavigate,
  adminUsername,
  onLogout,
  isOpen,
  onClose,
}: AdminMobileSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button
        aria-label="Tutup menu admin"
        className="absolute inset-0 bg-naki-primary/55 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Navigasi admin mobile"
        aria-modal="true"
        className="absolute inset-y-0 left-0 flex w-[min(86vw,21rem)] flex-col border-r border-naki-steel bg-white shadow-2xl"
        id="admin-mobile-navigation"
        role="dialog"
      >
        <div className="flex items-center gap-3 border-b border-naki-steel px-4 py-4">
          <span className="grid size-10 place-items-center rounded-xl bg-naki-primary shadow-naki-card">
            <img
              alt=""
              className="naki-logo-image size-7 object-contain brightness-0 invert"
              src="/logo.png"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-[0.08em] text-naki-primary">
              NAKI ADMIN
            </p>
            <p className="text-xs text-naki-smoke">Pusat pengelolaan website</p>
          </div>
          <button
            aria-label="Tutup menu admin"
            autoFocus
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-naki-steel bg-naki-page-bg text-naki-primary transition hover:border-naki-secondary hover:text-naki-secondary focus-visible:ring-2 focus-visible:ring-naki-secondary"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <AdminNavigation
            activeView={activeView}
            mobile
            onNavigate={onNavigate}
          />
        </nav>

        <div className="border-t border-naki-steel bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <AdminProfile adminUsername={adminUsername} onLogout={onLogout} />
        </div>
      </aside>
    </div>
  );
}
