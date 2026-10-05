import { LogIn } from "lucide-react";
import { PreferencesControls } from "./PreferencesMenu";
import type { ThemePreference } from "../../../utils/theme";
import { Link } from "react-router-dom";
import type { HeaderNavItem, HeaderProfile } from "./types";

type MobileMenuProps = {
  activeProfile: HeaderProfile | null;
  theme: ThemePreference;
  isActiveNav: (href: string) => boolean;
  loginNext: string;
  navItems: HeaderNavItem[];
  onClose: () => void;
  onLogout: () => void;
  onThemeChange: (theme: ThemePreference) => void;
};

export function MobileMenu({
  activeProfile,
  theme,
  isActiveNav,
  loginNext,
  navItems,
  onClose,
  onLogout,
  onThemeChange,
}: MobileMenuProps) {
  return (
    <div className="max-h-[calc(100dvh-8.5rem)] overflow-y-auto overscroll-contain border-t border-naki-steel bg-white px-4 py-4 sm:px-5 lg:hidden">
      <nav className="grid gap-1 text-sm font-medium text-naki-primary">
        {navItems.map((item) => (
          <Link
            key={item.label}
            className={`rounded-lg px-3 py-3 transition ${
              isActiveNav(item.href)
                ? "bg-naki-frost text-naki-primary"
                : "text-naki-smoke hover:bg-naki-frost hover:text-naki-primary"
            }`}
            onClick={onClose}
            to={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-naki-steel pt-4">
        <section
          aria-label="Preferensi"
          className="mb-4 rounded-xl bg-naki-frost/60 p-3"
        >
          <PreferencesControls theme={theme} onThemeChange={onThemeChange} />
        </section>

        {activeProfile ? (
          <AuthenticatedMobileMenu
            activeProfile={activeProfile}
            onClose={onClose}
            onLogout={onLogout}
          />
        ) : (
          <Link
            className="inline-flex h-11 w-full items-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
            onClick={onClose}
            to={loginNext}
          >
            <span className="grid size-7 place-items-center rounded-md bg-blue-500/10 text-blue-500">
              <LogIn size={14} />
            </span>
            <span>Login</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function AuthenticatedMobileMenu({
  activeProfile,
  onClose,
  onLogout,
}: {
  activeProfile: HeaderProfile;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
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
        <AdminMobileLinks onClose={onClose} />
      ) : (
        <UserMobileLinks onClose={onClose} />
      )}
      <button
        className="rounded-lg px-3 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
        onClick={onLogout}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}

function AdminMobileLinks({ onClose }: { onClose: () => void }) {
  return (
    <>
      <MobileMenuLink label="Profil saya" to="/akun-saya" onClose={onClose} />
      <MobileMenuLink
        label="Dashboard admin"
        to="/admin/dashboard"
        onClose={onClose}
      />
      <MobileMenuLink label="Kantor Digital" to="/admin/digital-office" onClose={onClose} />
    </>
  );
}

function UserMobileLinks({ onClose }: { onClose: () => void }) {
  return (
    <>
      <MobileMenuLink label="Profil saya" to="/akun-saya" onClose={onClose} />
      <MobileMenuLink
        label="Pesanan saya"
        to="/pesanan-saya"
        onClose={onClose}
      />
      <MobileMenuLink label="Wishlist" to="/wishlist" onClose={onClose} />
    </>
  );
}

function MobileMenuLink({
  label,
  to,
  onClose,
}: {
  label: string;
  to: string;
  onClose: () => void;
}) {
  return (
    <Link
      className="rounded-lg px-3 py-3 text-sm text-naki-primary transition hover:bg-naki-frost"
      onClick={onClose}
      role="menuitem"
      to={to}
    >
      {label}
    </Link>
  );
}
