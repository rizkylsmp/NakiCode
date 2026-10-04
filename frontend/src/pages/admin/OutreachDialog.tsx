import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function OutreachDialog({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(<div className="naki-outreach-dialog fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 sm:p-6" onMouseDown={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="outline-none flex max-h-dvh min-h-dvh w-full flex-col overflow-hidden bg-white text-naki-primary shadow-naki-card sm:max-h-[90dvh] sm:min-h-0 sm:max-w-3xl sm:rounded-2xl" onKeyDown={event => {
      if (event.key === "Escape" && !busy) { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]') ?? []);
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    }}>
      <header className="flex items-start justify-between gap-3 border-b border-naki-steel p-4"><h2 className="min-w-0 flex-1 break-words text-lg font-bold">{title}</h2><button type="button" aria-label="Tutup dialog" title="Tutup dialog" disabled={busy} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-naki-steel bg-naki-frost p-0 text-naki-smoke hover:text-naki-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naki-secondary focus-visible:ring-offset-2 disabled:opacity-50" onClick={onClose}><X size={18} aria-hidden="true" /></button></header>
      <div className="min-h-0 overflow-y-auto p-4 sm:p-5">{children}</div>
    </div>
  </div>, document.body);
}
