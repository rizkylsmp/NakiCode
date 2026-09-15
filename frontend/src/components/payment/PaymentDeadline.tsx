import { Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PaymentDeadlineProps = {
  expiresAt: string | null;
  onExpire?: () => void;
};

export function PaymentDeadline({ expiresAt, onExpire }: PaymentDeadlineProps) {
  const [now, setNow] = useState<number | null>(null);
  const hasReportedExpiry = useRef(false);
  const expiryTime = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const isValid = Number.isFinite(expiryTime);
  const remainingMs =
    isValid && now !== null ? Math.max(0, expiryTime - now) : null;
  const isExpired = isValid && remainingMs === 0;

  useEffect(() => {
    hasReportedExpiry.current = false;
    setNow(Date.now());
  }, [expiresAt]);

  useEffect(() => {
    if (!isValid) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [isValid]);

  useEffect(() => {
    if (isExpired && !hasReportedExpiry.current) {
      hasReportedExpiry.current = true;
      onExpire?.();
    }
  }, [isExpired, onExpire]);

  if (!isValid || !expiresAt) return null;

  return (
    <div
      aria-live="polite"
      className={`mt-3 rounded-xl border px-3 py-2.5 ${
        isExpired
          ? "border-naki-secondary/30 bg-naki-secondary/10"
          : "border-naki-steel bg-white"
      }`}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Clock3
          className={isExpired ? "text-naki-secondary" : "text-naki-primary"}
          size={17}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-naki-primary">
            {isExpired
              ? "Batas pembayaran telah berakhir"
              : remainingMs === null
                ? "Menghitung batas pembayaran..."
                : `Selesaikan dalam ${formatRemainingTime(remainingMs)}`}
          </p>
          <p className="mt-0.5 text-xs text-naki-smoke">
            Batas: {formatPaymentDeadline(expiresAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function formatPaymentDeadline(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  if (minutes > 0) return `${minutes} menit ${seconds} detik`;
  return `${seconds} detik`;
}
