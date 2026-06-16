import {
  Bell,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Globe2,
  Heart,
  LogIn,
  LogOut,
  LayoutDashboard,
  Menu,
  ShoppingBag,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getApiUrl } from "../api-client";
import { useAuth } from "../auth-context";
import { LogoMark } from "./LogoMark";

const navItems = [
  { label: "Cari Template", href: "/#template" },
  {
    label: "Layanan",
    href: "/template?category=Semua#template",
    hasDropdown: true,
  },
  { label: "Portofolio", href: "/#portofolio" },
  { label: "Komunitas", href: "/#komunitas" },
  { label: "Tutorial", href: "/#tutorial" },
  { label: "Pertanyaan", href: "/#pertanyaan" },
  { label: "Blog", href: "/blog" },
];

const serviceItems = [
  { label: "Template Website", href: "/template?category=Semua#template" },
  { label: "Website Portfolio", href: "/template?category=Portfolio#template" },
  {
    label: "Website E-commerce",
    href: "/template?category=E-commerce#template",
  },
  {
    label: "Website Top Up Games",
    href: "/template?category=Top%20up%20games#template",
  },
  { label: "Website Bucin", href: "/template?category=Web%20Bucin#template" },
  { label: "CRUD Admin", href: "/template?category=CRUD#template" },
  { label: "Company Profile", href: "/template?category=Company#template" },
  { label: "Pesanan Custom", href: "/template?q=custom#template" },
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
    queryFn: async () => {
      const response = await fetch(getApiUrl("/api/notifications/my"), {
        headers: userToken
          ? {
              Authorization: `Bearer ${userToken}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil notifikasi");
      }

      return (await response.json()) as NotificationsResponse;
    },
  });
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(getApiUrl("/api/notifications/read-all"), {
        method: "PATCH",
        headers: userToken
          ? {
              Authorization: `Bearer ${userToken}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error("Gagal membaca notifikasi");
      }

      return (await response.json()) as NotificationsResponse;
    },
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
    <header className="naki-site-header sticky top-0 z-50 border-b border-naki-steel/80 bg-naki-frost/95 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-5 py-4 md:px-8 xl:px-12 2xl:px-16">
        <a
          className="flex shrink-0 items-center gap-3"
          href="/"
          aria-label="Naki Code home"
        >
          <LogoMark />
          <span className="text-lg font-black text-naki-primary">
            Naki Code
          </span>
        </a>

        <nav className="hidden items-center gap-5 text-sm font-bold text-naki-smoke lg:flex">
          {navItems.map((item) => (
            <div key={item.label} className="group relative">
              <a
                className="inline-flex items-center gap-1.5 transition hover:text-naki-primary"
                href={item.href}
              >
                {item.label}
                {item.hasDropdown ? <ChevronDown size={15} /> : null}
              </a>
              {item.hasDropdown ? (
                <div className="pointer-events-none absolute left-0 top-full w-64 pt-4 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="rounded-lg border border-naki-steel bg-naki-frost p-2 shadow-naki-card">
                    {serviceItems.map((service) => (
                      <Link
                        key={service.label}
                        className="block rounded-md px-3 py-2 text-sm font-bold text-naki-smoke transition hover:bg-naki-steel hover:text-naki-primary"
                        to={service.href}
                      >
                        {service.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {activeProfile ? (
            <>
              <div className="relative" ref={notificationMenuRef}>
                <button
                  className="relative grid size-10 place-items-center rounded-lg border border-naki-steel bg-naki-frost text-naki-secondary transition hover:border-naki-smoke"
                  aria-expanded={isNotificationMenuOpen}
                  aria-haspopup="menu"
                  onClick={() =>
                    setIsNotificationMenuOpen((current) => !current)
                  }
                  type="button"
                  aria-label="Buka notifikasi"
                >
                  <Bell size={17} />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-naki-primary px-1.5 text-[10px] font-black text-naki-frost">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
                {isNotificationMenuOpen ? (
                  <div className="absolute right-0 top-full z-[95] w-80 pt-3">
                    <div
                      className="overflow-hidden rounded-xl border border-naki-steel bg-naki-frost shadow-naki-soft"
                      role="menu"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-naki-steel p-4">
                        <div>
                          <p className="text-sm font-black text-naki-primary">
                            Notifikasi
                          </p>
                          <p className="text-xs font-semibold text-naki-smoke">
                            {unreadCount} belum dibaca
                          </p>
                        </div>
                        <button
                          className="grid size-9 place-items-center rounded-lg bg-naki-steel text-naki-secondary transition hover:bg-naki-frost"
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
                          <p className="rounded-lg bg-naki-steel p-4 text-sm font-semibold text-naki-smoke">
                            Belum ada notifikasi.
                          </p>
                        ) : (
                          notifications.slice(0, 8).map((notification) => (
                            <Link
                              key={notification.id}
                              className={`block rounded-lg p-3 transition hover:bg-naki-steel ${
                                notification.readAt ? "" : "bg-naki-steel/70"
                              }`}
                              onClick={() => setIsNotificationMenuOpen(false)}
                              role="menuitem"
                              to={
                                notification.relatedOrderId
                                  ? "/pesanan-saya"
                                  : "/akun-saya"
                              }
                            >
                              <p className="text-sm font-black text-naki-primary">
                                {notification.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-naki-smoke">
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
              <div className="relative" ref={profileMenuRef}>
                <button
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-black transition ${
                    activeProfile.type === "admin"
                      ? "border-naki-primary bg-naki-frost text-naki-primary shadow-sm"
                      : "border-naki-steel bg-naki-frost text-naki-secondary hover:border-naki-smoke"
                  }`}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  type="button"
                >
                  <span
                    className={`grid size-6 place-items-center rounded-md ${
                      activeProfile.type === "admin"
                        ? "bg-naki-primary text-naki-frost"
                        : "bg-naki-steel text-naki-primary"
                    }`}
                  >
                    {activeProfile.type === "admin" ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <UserRound size={14} />
                    )}
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-naki-smoke">
                      {activeProfile.type === "admin" ? "Admin" : "Akun"}
                    </span>
                    <span className="text-sm font-black text-naki-secondary">
                      {activeProfile.username}
                    </span>
                  </span>
                  <ChevronDown size={14} />
                </button>
                {isProfileMenuOpen ? (
                  <div className="absolute right-0 top-full z-[90] w-64 pt-2.5">
                    <div
                      className="overflow-hidden rounded-xl border border-naki-steel bg-naki-frost shadow-naki-soft"
                      role="menu"
                    >
                      <div
                        className={`p-3 ${
                          activeProfile.type === "admin"
                            ? "bg-naki-primary text-naki-frost"
                            : "bg-naki-steel text-naki-primary"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                              activeProfile.type === "admin"
                                ? "bg-naki-secondary text-naki-frost"
                                : "bg-naki-frost text-naki-secondary"
                            }`}
                          >
                            {activeProfile.type === "admin" ? (
                              <ShieldCheck size={18} />
                            ) : (
                              <UserRound size={18} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-black uppercase ${
                                activeProfile.type === "admin"
                                  ? "text-naki-frost/70"
                                  : "text-naki-smoke"
                              }`}
                            >
                              {activeProfile.type === "admin"
                                ? "Admin session"
                                : "User session"}
                            </p>
                            <p className="mt-0.5 truncate text-base font-black leading-tight">
                              {activeProfile.username}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-1 p-1.5">
                        {activeProfile.type === "admin" ? (
                          <>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/admin/templates"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
                                <LayoutDashboard size={16} />
                              </span>
                              <span className="min-w-0">
                                <span className="block">Dashboard admin</span>
                              </span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/admin/templates#orders"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
                                <ClipboardList size={16} />
                              </span>
                              <span className="min-w-0">
                                <span className="block">Order masuk</span>
                              </span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/admin/templates#portfolio"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
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
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/akun-saya"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
                                <UserRound size={16} />
                              </span>
                              <span>Profil saya</span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/pesanan-saya"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
                                <ClipboardList size={16} />
                              </span>
                              <span>Pesanan saya</span>
                            </Link>
                            <Link
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                              onClick={() => setIsProfileMenuOpen(false)}
                              role="menuitem"
                              to="/wishlist"
                            >
                              <span className="grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
                                <Heart size={16} />
                              </span>
                              <span>Wishlist</span>
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="border-t border-naki-steel p-1.5">
                        <button
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-black text-naki-secondary transition hover:bg-naki-steel"
                          onClick={handleLogout}
                          role="menuitem"
                          type="button"
                        >
                          <span className="grid size-8 place-items-center rounded-lg bg-naki-steel text-naki-secondary">
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
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm font-black text-naki-secondary transition hover:border-naki-smoke"
              href={loginNext}
            >
              <LogIn size={16} />
              Login
            </a>
          )}
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost shadow-sm transition hover:bg-naki-primary"
            href="/#template"
          >
            <ShoppingBag size={17} />
            Belanja
          </a>
        </div>

        <button
          className="grid size-10 place-items-center rounded-lg border border-naki-steel text-naki-primary lg:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-label="Buka menu"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          type="button"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-naki-steel bg-naki-frost px-5 py-4 shadow-naki-card lg:hidden">
          <nav className="grid gap-2 text-sm font-black text-naki-primary">
            {navItems.map((item) => (
              <a
                key={item.label}
                className="rounded-lg px-3 py-3 transition hover:bg-naki-steel"
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid gap-1 rounded-lg border border-naki-steel bg-naki-steel p-2 text-sm font-black lg:hidden">
            <p className="px-3 py-2 text-xs uppercase text-naki-smoke">
              Layanan
            </p>
            {serviceItems.map((service) => (
              <Link
                key={service.label}
                className="rounded-lg px-3 py-2 text-naki-primary transition hover:bg-naki-frost"
                onClick={() => setIsMobileMenuOpen(false)}
                to={service.href}
              >
                {service.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-naki-steel pt-4">
            {activeProfile ? (
              <div className="grid gap-2">
                <div className="rounded-lg bg-naki-steel px-3 py-3">
                  <p className="text-xs font-black uppercase text-naki-smoke">
                    {activeProfile.type === "admin" ? "Admin" : "Akun"}
                  </p>
                  <p className="mt-1 text-sm font-black text-naki-secondary">
                    {activeProfile.username}
                  </p>
                </div>
                {activeProfile.type === "admin" ? (
                  <>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/templates"
                    >
                      Dashboard admin
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/templates#orders"
                    >
                      Order masuk
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/admin/templates#portfolio"
                    >
                      Portofolio
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/akun-saya"
                    >
                      Profil saya
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/pesanan-saya"
                    >
                      Pesanan saya
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-3 text-sm font-black text-naki-primary transition hover:bg-naki-steel"
                      onClick={() => setIsMobileMenuOpen(false)}
                      to="/wishlist"
                    >
                      Wishlist
                    </Link>
                  </>
                )}
                <button
                  className="rounded-lg px-3 py-3 text-left text-sm font-black text-naki-secondary transition hover:bg-naki-steel"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-naki-secondary px-4 text-sm font-black text-naki-frost"
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
