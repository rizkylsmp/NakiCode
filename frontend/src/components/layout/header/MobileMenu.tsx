import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import type { HeaderNavItem, HeaderProfile } from "./types";

type MobileMenuProps = {
  activeProfile: HeaderProfile | null;
  isActiveNav: (href: string) => boolean;
  loginNext: string;
  navItems: HeaderNavItem[];
  onClose: () => void;
  onLogout: () => void;
};

export function MobileMenu({
  activeProfile,
  isActiveNav,
  loginNext,
  navItems,
  onClose,
  onLogout,
}: MobileMenuProps) {
  return (
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
            onClick={onClose}
            to={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-naki-steel pt-4">
        {activeProfile ? (
          <AuthenticatedMobileMenu
            activeProfile={activeProfile}
            onClose={onClose}
            onLogout={onLogout}
          />
        ) : (
          <Link
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-naki-primary px-4 text-sm font-medium text-white"
            onClick={onClose}
            to={loginNext}
          >
            <LogIn size={16} />
            Login
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
      <MobileMenuLink label="Dashboard admin" to="/admin/dashboard" onClose={onClose} />
      <MobileMenuLink label="Kelola design" to="/admin/templates" onClose={onClose} />
      <MobileMenuLink label="Order masuk" to="/admin/orders" onClose={onClose} />
      <MobileMenuLink label="Portofolio" to="/admin/portfolio" onClose={onClose} />
    </>
  );
}

function UserMobileLinks({ onClose }: { onClose: () => void }) {
  return (
    <>
      <MobileMenuLink label="Profil saya" to="/akun-saya" onClose={onClose} />
      <MobileMenuLink label="Pesanan saya" to="/pesanan-saya" onClose={onClose} />
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
      to={to}
    >
      {label}
    </Link>
  );
}
