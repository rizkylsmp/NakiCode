import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { WhatsAppBrandIcon } from "../ui/BrandIcons";

const whatsappUrl = `https://wa.me/6285794801890?text=${encodeURIComponent(
  "Halo Naki Code, saya ingin konsultasi pembuatan website.",
)}`;

export function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { pathname } = useLocation();
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    const updateVisibility = () => setShowScrollTop(window.scrollY > 320);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <div className="fixed bottom-5 right-4 z-[90] flex flex-col items-center gap-3 sm:bottom-6 sm:right-6">
      <button
        aria-label="Kembali ke atas"
        className={`grid size-11 place-items-center rounded-full border border-naki-steel bg-white text-naki-primary shadow-naki-card transition hover:-translate-y-0.5 hover:bg-naki-frost disabled:pointer-events-none sm:size-12 ${
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`}
        disabled={!showScrollTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Kembali ke atas"
        type="button"
      >
        <ArrowUp aria-hidden="true" size={20} strokeWidth={2.25} />
      </button>

      {!isAdminPage ? (
        <a
          aria-label="Hubungi Naki Code melalui WhatsApp"
          className="grid size-13 place-items-center rounded-full bg-green-500 text-white shadow-naki-card transition hover:-translate-y-0.5 hover:bg-green-600 sm:size-14"
          href={whatsappUrl}
          rel="noreferrer"
          target="_blank"
          title="Chat WhatsApp"
        >
          <WhatsAppBrandIcon className="size-8 brightness-0 invert" />
        </a>
      ) : null}
    </div>
  );
}
