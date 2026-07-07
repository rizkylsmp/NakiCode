import { LogIn, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api-client";
import { useAuth } from "../../contexts/auth-context";
import { headerNavItems, themeStorageKey } from "./header/header-data";
import { MobileMenu } from "./header/MobileMenu";
import { NotificationMenu } from "./header/NotificationMenu";
import { ProfileMenu } from "./header/ProfileMenu";
import { SiteLogo } from "./header/SiteLogo";
import { ThemeToggle } from "./header/ThemeToggle";
import type { HeaderProfile, NotificationsResponse } from "./header/types";

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
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
  const activeProfile: HeaderProfile | null = userToken
    ? {
        type: userRole === "admin" ? "admin" : "user",
        username: userUsername || (userRole === "admin" ? "Admin" : "User"),
      }
    : null;
  const loginNext = buildNextTarget(location);

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
    const theme = isDarkMode ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [isDarkMode]);

  return (
    <header className="sticky top-0 z-[60] border-b border-naki-steel/60 bg-white">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-8 xl:px-12 2xl:px-16">
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
            className="grid size-10 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
            type="button"
            aria-label="Cari design"
            onClick={() => {
              window.location.href = "/template";
            }}
          >
            <Search size={18} />
          </button>

          <ThemeToggle
            isDarkMode={isDarkMode}
            onToggle={() => setIsDarkMode((current) => !current)}
          />

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
