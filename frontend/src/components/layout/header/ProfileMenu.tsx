import {
  ChevronDown,
  ClipboardList,
  Globe2,
  Heart,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import type { HeaderProfile } from "./types";

type ProfileMenuProps = {
  activeProfile: HeaderProfile;
  isOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onLogout: () => void;
  onToggle: () => void;
};

export function ProfileMenu({
  activeProfile,
  isOpen,
  menuRef,
  onClose,
  onLogout,
  onToggle,
}: ProfileMenuProps) {
  const isAdmin = activeProfile.type === "admin";

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-white px-3 text-sm font-medium transition hover:border-naki-steel/80 hover:bg-naki-frost"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
        type="button"
      >
        <span
          className={`grid size-7 place-items-center rounded-md text-xs ${
            isAdmin ? "bg-naki-primary text-white" : "bg-blue-500/10 text-blue-500"
          }`}
        >
          {isAdmin ? <ShieldCheck size={14} /> : <UserRound size={14} />}
        </span>
        <span className="text-naki-primary">{activeProfile.username}</span>
        <ChevronDown size={14} className="text-naki-smoke" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-[90] w-64 pt-2.5">
          <div className="overflow-hidden rounded-xl border border-naki-steel bg-white shadow-lg">
            <ProfileMenuHeader activeProfile={activeProfile} />
            <div className="grid gap-1 p-1.5">
              {isAdmin ? (
                <AdminProfileLinks onClose={onClose} />
              ) : (
                <UserProfileLinks onClose={onClose} />
              )}
            </div>
            <div className="border-t border-naki-steel p-1.5">
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                onClick={onLogout}
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
  );
}

function ProfileMenuHeader({ activeProfile }: { activeProfile: HeaderProfile }) {
  const isAdmin = activeProfile.type === "admin";

  return (
    <div className={`p-3 ${isAdmin ? "bg-naki-primary" : "bg-blue-500"} text-white`}>
      <div className="flex items-start gap-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/20 text-white">
          {isAdmin ? <ShieldCheck size={18} /> : <UserRound size={18} />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium opacity-70">
            {isAdmin ? "Admin session" : "User session"}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold leading-tight">
            {activeProfile.username}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminProfileLinks({ onClose }: { onClose: () => void }) {
  return (
    <>
      <ProfileMenuLink
        icon={<LayoutDashboard size={16} />}
        label="Dashboard admin"
        to="/admin/dashboard"
        onClose={onClose}
      />
      <ProfileMenuLink
        icon={<ShoppingBag size={16} />}
        label="Kelola design"
        to="/admin/templates"
        onClose={onClose}
      />
      <ProfileMenuLink
        icon={<ClipboardList size={16} />}
        label="Order masuk"
        to="/admin/orders"
        onClose={onClose}
      />
      <ProfileMenuLink
        icon={<Globe2 size={16} />}
        label="Portofolio"
        to="/admin/portfolio"
        onClose={onClose}
      />
    </>
  );
}

function UserProfileLinks({ onClose }: { onClose: () => void }) {
  return (
    <>
      <ProfileMenuLink
        icon={<UserRound size={16} />}
        label="Profil saya"
        to="/akun-saya"
        onClose={onClose}
      />
      <ProfileMenuLink
        icon={<ClipboardList size={16} />}
        label="Pesanan saya"
        to="/pesanan-saya"
        onClose={onClose}
      />
      <ProfileMenuLink
        icon={<Heart size={16} />}
        label="Wishlist"
        to="/wishlist"
        onClose={onClose}
      />
    </>
  );
}

function ProfileMenuLink({
  icon,
  label,
  to,
  onClose,
}: {
  icon: ReactNode;
  label: string;
  to: string;
  onClose: () => void;
}) {
  return (
    <Link
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-naki-primary transition hover:bg-naki-frost"
      onClick={onClose}
      role="menuitem"
      to={to}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-naki-frost text-naki-smoke">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block">{label}</span>
      </span>
    </Link>
  );
}
