import { Bell, CheckCheck } from "lucide-react";
import type { RefObject } from "react";
import { Link } from "react-router-dom";
import type { NotificationItem } from "./types";

type NotificationMenuProps = {
  isOpen: boolean;
  isMarkingRead: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  notifications: NotificationItem[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onToggle: () => void;
};

export function NotificationMenu({
  isOpen,
  isMarkingRead,
  menuRef,
  notifications,
  unreadCount,
  onClose,
  onMarkAllRead,
  onToggle,
}: NotificationMenuProps) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        className="relative grid size-10 place-items-center rounded-lg text-naki-smoke transition hover:bg-naki-frost hover:text-naki-primary"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
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

      {isOpen ? (
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
                disabled={unreadCount === 0 || isMarkingRead}
                onClick={onMarkAllRead}
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
                    onClick={onClose}
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
  );
}
