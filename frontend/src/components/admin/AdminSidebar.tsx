import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Briefcase,
  MessageSquareQuote,
  Tag,
  TicketPercent,
  BookOpen,
  LogOut,
} from "lucide-react";
import { type DashboardView } from "../../pages/admin/AdminTemplateWorkspace.shared";

type AdminSidebarProps = {
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  adminUsername: string;
  onLogout: () => void;
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
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "blog", label: "Blog", icon: BookOpen },
  { key: "testimonials", label: "Testimoni", icon: MessageSquareQuote },
  { key: "categories", label: "Categories", icon: Tag },
  { key: "coupons", label: "Coupon", icon: TicketPercent },
];

type NavSection = {
  label: string;
  items: MenuItem[];
};

const NAV_SECTIONS: NavSection[] = [
  { label: "Main", items: MAIN_MENU },
  { label: "App", items: APP_MENU },
];

export function AdminSidebar({
  activeView,
  onNavigate,
  adminUsername,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-56 flex-col border-r border-naki-steel bg-white xl:w-60">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 xl:px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-naki-smoke">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.key;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => onNavigate(item.key)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                        isActive
                          ? "bg-naki-frost text-naki-primary"
                          : "text-naki-smoke hover:bg-naki-frost/60 hover:text-naki-primary"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={isActive ? "text-naki-primary" : "text-naki-smoke"}
                      />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-naki-steel p-2.5 xl:p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-naki-primary text-xs font-semibold text-white">
            {adminUsername.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-naki-primary truncate">
              {adminUsername}
            </p>
            <p className="text-[11px] text-naki-smoke">Administrator</p>
          </div>
          <button
            onClick={onLogout}
            className="grid size-7 shrink-0 place-items-center rounded-md text-naki-smoke transition hover:bg-red-50 hover:text-red-500"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
