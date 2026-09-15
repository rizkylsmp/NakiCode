import { Gift, LogIn, Menu, Search, Sparkles, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api-client";
import { useAuth } from "../../contexts/auth-context";
import { headerNavItems } from "./header/header-data";
import { applyTheme, resolveInitialTheme } from "../../utils/theme";
import { MobileMenu } from "./header/MobileMenu";
import { NotificationMenu } from "./header/NotificationMenu";
import { ProfileMenu } from "./header/ProfileMenu";
import { SiteLogo } from "./header/SiteLogo";
import { SearchDialog } from "./header/SearchDialog";
import { ThemeToggle } from "./header/ThemeToggle";
import type { HeaderProfile, NotificationsResponse } from "./header/types";
import { requestCouponBannerReopen } from "../promotions/coupon-banner-events";

type CouponBannersResponse = {
  banners: Array<{ id: number }>;
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasMainContent, setHasMainContent] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => resolveInitialTheme() === "dark",
  );
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const isAdminPage = location.pathname.startsWith("/admin");

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
  const couponBannersQuery = useQuery({
    queryKey: ["coupon-banners"],
    queryFn: () =>
      apiGet<CouponBannersResponse>("/api/business/coupons/banners"),
    enabled: !isAdminPage,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const activeProfile: HeaderProfile | null = userToken
    ? {
        type: userRole === "admin" ? "admin" : "user",
        username: userUsername || (userRole === "admin" ? "Admin" : "User"),
      }
    : null;
  const loginNext = buildNextTarget(location);
  const hasCouponBanner = Boolean(couponBannersQuery.data?.banners?.length);

  function isActiveNav(href: string): boolean {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  }

  function closeProfileMenu() {
    setIsProfileMenuOpen(false);
  }

  function closeNotificationMenu() {
    setIsNotificationMenuOpen(false);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeProfileMenu();
    closeNotificationMenu();
    closeMobileMenu();
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        closeProfileMenu();
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        closeNotificationMenu();
      }
    }
    window.addEventListener("mousedown", handleDocumentClick);
    return () => {
      window.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    applyTheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    setHasMainContent(Boolean(document.getElementById("main-content")));
  }, [location.pathname]);

  return (
    <header className="naki-site-header sticky top-0 z-[60] border-b border-naki-steel/60 bg-white">
      {hasMainContent ? (
        <a
          className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-lg bg-naki-primary px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0"
          href="#main-content"
        >
          Lewati ke konten utama
        </a>
      ) : null}
      <div className="flex w-full items-center justify-between gap-2 px-3 py-3.5 sm:gap-3 sm:px-5 md:px-8 xl:px-12 2xl:px-16">
        <SiteLogo />

        <nav className="hidden items-center gap-1 lg:flex">
          {headerNavItems.map((item) => (
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

        <div className="hidden items-center gap-2 lg:flex">
          <button
            className="grid size-10 place-items-center rounded-lg text-naki-smoke transition hover:text-naki-secondary"
            type="button"
            aria-label="Cari design"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search size={18} />
          </button>

          <ThemeToggle
            isDarkMode={isDarkMode}
            onToggle={() => setIsDarkMode((current) => !current)}
          />

          {hasCouponBanner ? (
            <PrizeButton onClick={requestCouponBannerReopen} />
          ) : null}

          {activeProfile ? (
            <>
              <NotificationMenu
                isOpen={isNotificationMenuOpen}
                isMarkingRead={markAllReadMutation.isPending}
                menuRef={notificationMenuRef}
                notifications={notifications}
                unreadCount={unreadCount}
                onClose={closeNotificationMenu}
                onMarkAllRead={() => markAllReadMutation.mutate()}
                onToggle={() =>
                  setIsNotificationMenuOpen((current) => !current)
                }
              />
              <ProfileMenu
                activeProfile={activeProfile}
                isOpen={isProfileMenuOpen}
                menuRef={profileMenuRef}
                onClose={closeProfileMenu}
                onLogout={handleLogout}
                onToggle={() => setIsProfileMenuOpen((current) => !current)}
              />
            </>
          ) : (
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-sm font-medium text-naki-primary transition hover:border-naki-steel/80 hover:bg-naki-frost"
              to={loginNext}
            >
              <span className="grid size-7 place-items-center rounded-md bg-blue-500/10 text-blue-500">
                <LogIn size={14} />
              </span>
              <span>Login</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button
            className="grid size-11 place-items-center rounded-lg text-naki-primary transition hover:text-naki-secondary"
            aria-label="Cari design"
            onClick={() => setIsSearchOpen(true)}
            type="button"
          >
            <Search size={19} />
          </button>
          {hasCouponBanner ? (
            <PrizeButton mobile onClick={requestCouponBannerReopen} />
          ) : null}
          <button
            className="grid size-11 place-items-center rounded-lg text-naki-primary transition hover:text-naki-secondary"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <MobileMenu
          activeProfile={activeProfile}
          isDarkMode={isDarkMode}
          isActiveNav={isActiveNav}
          loginNext={loginNext}
          navItems={headerNavItems}
          onClose={closeMobileMenu}
          onLogout={handleLogout}
          onToggleTheme={() => setIsDarkMode((current) => !current)}
        />
      ) : null}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}

function PrizeButton({
  mobile = false,
  onClick,
}: {
  mobile?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label="Tampilkan promo coupon"
      className={`group relative isolate grid shrink-0 place-items-center overflow-visible rounded-xl bg-linear-to-br from-naki-secondary via-naki-primary to-naki-secondary text-white shadow-naki-soft ring-2 ring-naki-secondary/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-naki-card focus-visible:ring-2 focus-visible:ring-naki-secondary ${mobile ? "size-11" : "size-10"}`}
      onClick={onClick}
      title="Lihat promo spesial"
      type="button"
    >
      <span className="absolute inset-1 -z-10 rounded-lg bg-white/10" />
      <Gift
        className="transition duration-300 group-hover:-rotate-12 group-hover:scale-110 motion-reduce:transition-none"
        size={mobile ? 20 : 18}
      />
      <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-white text-naki-secondary shadow-sm motion-safe:animate-pulse">
        <Sparkles size={9} strokeWidth={3} />
      </span>
    </button>
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
