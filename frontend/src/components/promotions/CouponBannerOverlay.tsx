import { ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiGet } from "../../services/api-client";
import { couponBannerReopenEvent } from "./coupon-banner-events";

type CouponBanner = {
  id: number;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  imageUrl: string;
};

type CouponBannersResponse = {
  banners: CouponBanner[];
};

const SEEN_BANNERS_KEY = "naki-coupon-banners-seen-v1";
const SLIDE_INTERVAL_MS = 5_000;
const EMPTY_BANNERS: CouponBanner[] = [];

export function CouponBannerOverlay() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleSignature, setVisibleSignature] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const bannersQuery = useQuery({
    queryKey: ["coupon-banners"],
    queryFn: () =>
      apiGet<CouponBannersResponse>("/api/business/coupons/banners"),
    enabled: !isAdminPage,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const banners = bannersQuery.data?.banners ?? EMPTY_BANNERS;
  const signature = useMemo(
    () =>
      banners
        .map((banner) => `${banner.id}:${banner.imageUrl}`)
        .sort()
        .join("|"),
    [banners],
  );
  const isVisible =
    !isAdminPage && Boolean(signature) && visibleSignature === signature;

  useEffect(() => {
    if (isAdminPage || !signature) return;
    try {
      if (window.localStorage.getItem(SEEN_BANNERS_KEY) === signature) return;
      window.localStorage.setItem(SEEN_BANNERS_KEY, signature);
    } catch {
      // Privacy modes may block storage; the banner can still be dismissed for this page view.
    }
    setActiveIndex(0);
    setVisibleSignature(signature);
  }, [isAdminPage, signature]);

  useEffect(() => {
    if (!isVisible) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisibleSignature(null);
      if (event.key === "ArrowLeft" && banners.length > 1)
        setActiveIndex(
          (index) => (index - 1 + banners.length) % banners.length,
        );
      if (event.key === "ArrowRight" && banners.length > 1)
        setActiveIndex((index) => (index + 1) % banners.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [banners.length, isVisible]);

  useEffect(() => {
    if (
      !isVisible ||
      isPaused ||
      banners.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [banners.length, isPaused, isVisible]);

  useEffect(() => {
    if (activeIndex >= banners.length) setActiveIndex(0);
  }, [activeIndex, banners.length]);

  useEffect(() => {
    function reopenBanner() {
      if (isAdminPage || !signature || banners.length === 0) return;
      setActiveIndex(0);
      setVisibleSignature(signature);
    }

    window.addEventListener(couponBannerReopenEvent, reopenBanner);
    return () =>
      window.removeEventListener(couponBannerReopenEvent, reopenBanner);
  }, [banners.length, isAdminPage, signature]);

  if (!isVisible || banners.length === 0) return null;

  const activeBanner = banners[activeIndex];

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(activeBanner.code);
      setCopiedCode(activeBanner.code);
      window.setTimeout(() => setCopiedCode(null), 1_800);
    } catch {
      setCopiedCode(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-80 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setVisibleSignature(null);
      }}
    >
      <section
        aria-label="Promo coupon Naki Code"
        aria-modal="true"
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-naki-primary shadow-2xl"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setIsPaused(false);
        }}
        onFocusCapture={() => setIsPaused(true)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="dialog"
      >
        <button
          ref={closeButtonRef}
          aria-label="Tutup banner promo"
          className="absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
          onClick={() => setVisibleSignature(null)}
          type="button"
        >
          <X size={20} />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <article
                aria-hidden={index !== activeIndex}
                className="relative min-w-full"
                key={banner.id}
              >
                <img
                  alt={`Banner promo ${banner.code}`}
                  className="aspect-4/5 w-full object-cover sm:aspect-16/9"
                  src={banner.imageUrl}
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/75 to-transparent px-5 pb-6 pt-20 text-white sm:px-8 sm:pb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                    Promo Naki Code
                  </p>
                  <h2 className="mt-2 text-2xl font-bold sm:text-4xl">
                    {banner.description}
                  </h2>
                  <p className="mt-2 text-sm text-white/85 sm:text-base">
                    Hemat{" "}
                    {banner.discountType === "percent"
                      ? `${banner.discountValue}%`
                      : `Rp${banner.discountValue.toLocaleString("id-ID")}`}{" "}
                    dengan kode <strong>{banner.code}</strong>.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      aria-label={`Salin kode coupon ${banner.code}`}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-naki-primary hover:bg-naki-frost"
                      onClick={() => void copyCode()}
                      type="button"
                    >
                      <Copy size={17} />
                      {copiedCode === banner.code
                        ? "Kode tersalin"
                        : `Salin ${banner.code}`}
                    </button>
                    <Link
                      className="inline-flex h-11 items-center rounded-lg border border-white/50 px-4 text-sm font-semibold text-white hover:bg-white/10"
                      onClick={() => setVisibleSignature(null)}
                      to="/design"
                    >
                      Jelajahi design
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {banners.length > 1 ? (
          <>
            <button
              aria-label="Banner sebelumnya"
              className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
              onClick={() =>
                setActiveIndex(
                  (index) => (index - 1 + banners.length) % banners.length,
                )
              }
              type="button"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              aria-label="Banner berikutnya"
              className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
              onClick={() =>
                setActiveIndex((index) => (index + 1) % banners.length)
              }
              type="button"
            >
              <ChevronRight size={22} />
            </button>
            <div
              aria-label={`Banner ${activeIndex + 1} dari ${banners.length}`}
              className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2"
            >
              {banners.map((banner, index) => (
                <button
                  aria-label={`Tampilkan banner ${index + 1}`}
                  className={`size-2.5 rounded-full ring-1 ring-white/70 transition ${index === activeIndex ? "bg-white" : "bg-white/35"}`}
                  key={banner.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
