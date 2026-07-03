import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Briefcase,
  MessageSquareQuote,
  Tag,
  BookOpen,
  Settings,
  LogOut,
  User,
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
  { key: "templates", label: "Templates", icon: FileText },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "blog", label: "Blog", icon: BookOpen },
  { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { key: "categories", label: "Categories", icon: Tag },
];

export function AdminSidebar({
  activeView,
  onNavigate,
  adminUsername,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600 text-white">
          <LayoutDashboard size={18} />
        </div>
        <span className="text-lg font-bold text-gray-900">Naki Code</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {/* Main */}
        <div className="mb-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Main
          </p>
          <ul className="space-y-1">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => onNavigate(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* App */}
        <div className="mb-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            App
          </p>
          <ul className="space-y-1">
            {APP_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => onNavigate(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
            {adminUsername.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {adminUsername}
            </p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <button
            onClick={onLogout}
            className="grid size-8 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
