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
  LogOut,
  X,
} from "lucide-react";
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
  { key: "finance", label: "Pembukuan", icon: WalletCards },
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
};

function AdminNavigation({
  activeView,
  onNavigate,
  mobile = false,
}: AdminNavigationProps) {
  return NAV_SECTIONS.map((section) => (
    <div key={section.label} className="mb-5 last:mb-0">
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-naki-smoke">
        {section.label}
      </p>
      <ul className="space-y-1">
        {section.items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;

          return (
            <li key={item.key}>
              <button
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate(item.key)}
                type="button"
                className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition focus-visible:ring-2 focus-visible:ring-naki-secondary ${
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
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {isActive && mobile ? (
                  <span className="size-1.5 rounded-full bg-naki-secondary" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  ));
}

function AdminProfile({
  adminUsername,
  onLogout,
}: Pick<AdminSidebarProps, "adminUsername" | "onLogout">) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-naki-frost/60 px-2.5 py-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-naki-primary text-xs font-semibold text-white shadow-sm">
        {adminUsername.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-naki-primary">
          {adminUsername}
        </p>
        <p className="text-[11px] text-naki-smoke">Administrator</p>
      </div>
      <button
        onClick={onLogout}
        className="grid size-10 shrink-0 place-items-center rounded-lg text-naki-smoke transition hover:bg-red-50 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-red-400"
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
}: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-[73px] z-40 hidden h-[calc(100dvh-73px)] w-56 flex-col border-r border-naki-steel bg-white lg:flex xl:w-60">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 xl:px-3">
        <AdminNavigation activeView={activeView} onNavigate={onNavigate} />
      </nav>

      {/* User Profile */}
      <div className="border-t border-naki-steel p-2.5 xl:p-3">
        <AdminProfile adminUsername={adminUsername} onLogout={onLogout} />
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
