import {
  Bell,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Code2,
  Globe2,
  Heart,
  LogIn,
  LogOut,
  LayoutDashboard,
  Menu,
  Search,
  ShoppingBag,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiGet, apiPatch } from "../api-client";
import { useAuth } from "../auth-context";

const navItems = [
  { label: "Beranda", href: "/" },
  { label: "Template", href: "/template" },
  { label: "Blog", href: "/blog" },
];

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedOrderId: number | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
};

function Logo() {
  return (
    <a className="flex shrink-0 items-center gap-2.5" href="/" aria-label="NakiCode home">
      <span className="grid size-9 place-items-center rounded-lg bg-blue-500/10">
        <Code2 className="text-blue-500" size={20} />
      </span>
      <span className="text-lg font-bold tracking-tight">
        <span className="text-naki-primary">Naki</span>
        <span className="text-blue-500">Code</span>
      </span>
    </a>
  );
}

export function Header() {
  const location = useLocation();
  const {
    token: userToken,
    username: userUsername,
    role: userRole,
    logout,
  } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", userToken],
    enabled: Boolean(userToken),
    refetchInterval: 30_000,
    queryFn: () => apiGet<NotificationsResponse>("/api/notifications/my"),
  });
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiPatch<NotificationsResponse>("/api/notifications/read-all"),
    onSuccess: (data) => {
      queryClient.setQueryData(["notifications", userToken], data);
    },
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const activeProfile = userToken
    ? {
        type: userRole === "admin" ? "admin" : "user",
        username: userUsername || (userRole === "admin" ? "Admin" : "User"),
      }
    : null;

  // Determine active nav item based on current path
  function isActiveNav(href: string): boolean {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setIsNotificationMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handleDocumentClick);
    return () => {
      window.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  function handleLogout() {
    logout();
    setIsProfileMenuOpen(false);
    setIsNotificationMenuOpen(false);
    setIsMobileMenuOpen(false);
  }

  const loginNext = buildNextTarget(location);

  return (
    <header className="sticky top-0 z-[60] border-b border-naki-steel/60 bg-white">
      <div className="flex w-full items-center justify-between gap-4 px-5 py-3 md:px-8 xl:px-12 2xl:px-16">
        {/* Logo */}
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActiveNav(item.href)
                  ? "bg-naki-frost text-naki-primary"
                  : "text-naki-smoke hover:text-naki-primary"
              }`}
              to={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden items-center gap-2 sm:flex">
          {/* Search */}
          <button
            className="grid size-10 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
            type="button"
            aria-label="Cari template"
            onClick={() => {
              window.location.href = "/template";
            }}
          >
            <Search size={18} />
          </button>

          {/* Cart */}
          <Link
            className="relative grid size-10 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
            to="/template"
            aria-label="Template"
          >
            <ShoppingBag size={18} />
          </Link>

          {activeProfile ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notificationMenuRef}>
                <button
                  className="relative grid size-10 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
                  aria-expanded={isNotificationMenuOpen}
                  aria-haspopup="menu"
                  onClick={() =>
                    setIsNotificationMenuOpen((current) => !current)
                  }
                  type="button"
                  aria-label="Buka notifikasi"
                >
                  <Bell size={18} />
                  {unreadCount > 0 ? (
                    <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
                {isNotificationMenuOpen ? (
                  <div className="absolute right-0 top-full z-[95] w-80 pt-3">
                    <div className="overflow-hidden rounded-xl border border-naki-steel bg-white shadow-lg">
                      <div className="flex items-center justify-between gap-3 border-b border-naki-steel p-4">
                        <div>
                          <p className="text-sm font-semibold text-naki-primary">
                            Notifikasi
                          </p>
                          <p className="text-xs text-naki-smoke">
                            {unreadCount} belum dibaca
                          </p>
                        </div>
                        <button
                          className="grid size-9 place-items-center rounded-lg bg-naki-frost text-naki-smoke transition hover:bg-naki-steel"
                          disabled={
                            unreadCount === 0 || markAllReadMutation.isPending
                          }
                          onClick={() => markAllReadMutation.mutate()}
                          type="button"
                          aria-label="Tandai semua dibaca"
                        >
                          <CheckCheck size={16} />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                          <p className="rounded-lg bg-naki-frost p-4 text-sm text-naki-smoke">
                            Belum ada notifikasi.
                          </p>
                        ) : (
                          notifications.slice(0, 8).map((notification) => (
                            <Link
                              key={notification.id}
                              className={`block rounded-lg p-3 transition hover:bg-naki-frost ${
                                notification.readAt ? "" : "bg-naki-frost"
                              }`}
                              onClick={() => setIsNotificationMenuOpen(false)}
                              role="menuitem"
                              to={
                                notification.relatedOrderId
                                  ? "/pesanan-saya"
                                  : "/akun-saya"
                              }
                            >
                              <p className="text-sm font-semibold text-naki-primary">
                                {notification.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-naki-smoke">
                                {notification.message}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-sm font-medium transition hover:border-naki-steel/80 hover:bg-naki-frost"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  type="button"
                >
                  <span
                    className={`grid size-7 place-items-center rounded-md text-xs ${
                      activeProfile.type === "admin"
                        ? "bg-naki-primary text-white"
                        : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {activeProfile.type === "admin" ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <UserRound size={14} />
                    )}
                  </span>
                  <span className="text-naki-primary">{activeProfile.username}</span>
                  <ChevronDown size={14} className="text-naki-smoke" />
                </button>
                {isProfileMenuOpen ? (
                  <div className="absolute right-0 top-full z-[90] w-64 pt-2.5">
                    <div className="overflow-hidden rounded-xl border border-naki-steel bg-white shadow-lg">
                      <div
                        className={`p-3 ${
                          activeProfile.type === "admin"
                            ? "bg-naki-primary text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                              activeProfile.type === "admin"
                                ? "bg-white/20 text-white"
                                : "bg-white/20 text-white"
                            }`}
                          >
                            {activeProfile.type === "admin" ? (
                              <ShieldCheck size={18} />
                            ) : (
                              <UserRound size={18} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium opacity-70">
                              {activeProfile.type === "admin"
                                ? "Admin session"
                                : "User session"}
                            </p>
                            <p className="mt-0.5 truncate text-base font-semibold leading-tight">
                              {activeProfile.username}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-1 p-1.5">
                        {activeProfile.type === "admin" ? (
                          <>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/admin/dashboard"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                                <LayoutDashboard size={16} />
                              </span>
                              <span className="min-w-0">
                                <span className="block">Dashboard admin</span>
                              </span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/admin/templates"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                                <ShoppingBag size={16} />
                              </span>
                              <span className="min-w-0">
                                <span className="block">Kelola template</span>
                              </span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/admin/orders"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                                <ClipboardList size={16} />
                              </span>
                              <span className="min-w-0">
                                <span className="block">Order masuk</span>
                              </span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/admin/portfolio"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                                <Globe2 size={16} />
                              </span>
                              <span className="min-w-0">
                                <span className="block">Portofolio</span>
                              </span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/akun-saya"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                                <UserRound size={16} />
                              </span>
                              <span>Profil saya</span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/pesanan-saya"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                                <ClipboardList size={16} />
                              </span>
                              <span>Pesanan saya</span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/wishlist"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
                                <Heart size={16} />
                              </span>
                              <span>Wishlist</span>
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="border-t border-naki-steel p-1.5">
                        <button
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                          onClick={handleLogout}
                          role="menuitem"
                          type="button"
                        >
                          <span className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-500">
                            <LogOut size={16} />
                          </span>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
              to={loginNext}
            >
              <LogIn size={16} />
              Login
            </Link>
          )}
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-medium text-white transition hover:bg-naki-primary/90"
            to="/template"
          >
            Jelajahi
            <ShoppingBag size={16} />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="grid size-10 place-items-center rounded-lg text-naki-primary lg:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-label="Buka menu"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          type="button"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen ? (
        <div className="border-t border-naki-steel bg-white px-5 py-4 lg:hidden">
          <nav className="grid gap-1 text-sm font-medium text-naki-primary">
            {navItems.map((item) => (
              <Link
                key={item.label}
                className={`rounded-lg px-3 py-3 transition ${
                  isActiveNav(item.href)
                    ? "bg-naki-frost text-naki-primary"
                    : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                to={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-naki-steel pt-4">
            {activeProfile ? (
              <div className="grid gap-2">
                <div className="rounded-lg bg-naki-frost px-3 py-3">
                  <p className="text-xs font-medium text-naki-smoke">
                    {activeProfile.type === "admin" ? "Admin" : "Akun"}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-naki-primary">
                    {activeProfile.username}
                  </p>
                </div>
                {activeProfile.type === "admin" ? (
                  <>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/dashboard"
                    >
                      Dashboard admin
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/templates"
                    >
                      Kelola template
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/orders"
                    >
                      Order masuk
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/portfolio"
                    >
                      Portofolio
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/akun-saya"
                    >
                      Profil saya
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/pesanan-saya"
                    >
                      Pesanan saya
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/wishlist"
                    >
                      Wishlist
                    </Link>
                  </>
                )}
                <button
                  className="rounded-lg px-3 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-medium text-white"
                onClick={() => setIsMobileMenuOpen(false)}
                to={loginNext}
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function buildNextTarget(location: {
  pathname: string;
  search: string;
  hash: string;
}) {
  const next = `${location.pathname}${location.search}${location.hash}`;
  if (
    !next ||
    next === "/login" ||
    next.startsWith("/verify-email") ||
    next.startsWith("/forgot-password")
  ) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(next)}`;
}
