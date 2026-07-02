import { Loader2, Check, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type LoadingOverlayProps = {
  isLoading: boolean;
  message?: string;
  variant?: "spinner" | "progress";
  progress?: number;
};

export function LoadingOverlay({
  isLoading,
  message = "Memproses...",
  variant = "spinner",
  progress = 0
}: LoadingOverlayProps) {
  if (!isLoading || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-10001 flex items-center justify-center bg-naki-primary/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl max-w-sm mx-4 animate-in zoom-in-95 duration-200">
        {variant === "spinner" ? (
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-naki-primary" />
            <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-naki-primary/20" />
          </div>
        ) : (
          <div className="w-full space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-naki-frost">
              <div
                className="h-full bg-linear-to-r from-naki-primary to-naki-secondary transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-center text-xs text-naki-smoke">{Math.round(progress)}%</p>
          </div>
        )}
        <p className="text-sm font-medium text-naki-primary text-center">{message}</p>
      </div>
    </div>,
    document.body,
  );
}

type LoadingButtonProps = {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

export function LoadingButton({
  isLoading,
  loadingText = "Memproses...",
  children,
  className = "",
  disabled = false,
  type = "button",
  onClick,
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed ${
        isLoading || disabled
          ? "bg-naki-smoke text-white cursor-not-allowed"
          : "bg-naki-primary text-white hover:opacity-90"
      } ${className}`}
      disabled={isLoading || disabled}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

type StatusMessageProps = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  className?: string;
};

export function StatusMessage({ status, message, className = "" }: StatusMessageProps) {
  if (status === "idle" || !message) return null;

  const icons = {
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    success: <Check className="h-4 w-4" />,
    error: <X className="h-4 w-4" />,
  };

  const colors = {
    loading: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-green-50 text-green-700 border-green-200",
    error: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${colors[status]} ${className}`}>
      {icons[status]}
      <span>{message}</span>
    </div>
  );
}
