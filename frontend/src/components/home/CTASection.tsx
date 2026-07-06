import { ArrowRight, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

export function CTASection() {
  return (
    <section className="w-full">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          {/* Professional gradient card with glow effects */}
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 lg:p-14">
            {/* Multi-layer gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-naki-primary via-slate-900 to-slate-950" />
            {/* Top-right blue glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
            {/* Bottom-left blue glow */}
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
            {/* Subtle grid pattern overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(255,255,255) 1px, transparent 1px), linear-gradient(90deg, rgb(255,255,255) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            {/* Border glow */}
            <div className="absolute inset-0 rounded-3xl border border-white/10" />

            {/* Content */}
            <div className="relative z-10 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.74fr)] md:gap-8">
              <div className="text-center md:text-left">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-500/15 text-blue-400 md:mx-0">
                  <MessageCircle size={26} />
                </span>
                <h2 className="mt-6 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                  Siap mewujudkan website pilihanmu?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-400 md:mx-0 md:text-base">
                  Pilih design yang kamu suka sebagai referensi. Kami bantu menyesuaikan
                  identitas brand, konten, dan fitur hingga siap digunakan.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
                  <a
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-naki-primary transition hover:bg-naki-frost"
                    href="/template"
                  >
                    Jelajahi Design
                    <ArrowRight size={16} />
                  </a>
                  <a
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
                    href={
                      WHATSAPP_NUMBER
                        ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo Naki Code, saya ingin konsultasi pembuatan website dari design yang tersedia.")}`
                        : "#template"
                    }
                    rel="noreferrer"
                    target="_blank"
                  >
                    Konsultasi Gratis
                  </a>
                </div>
              </div>

              <div className="pointer-events-none relative order-first mx-auto h-56 w-full max-w-xs self-end md:order-none md:h-80 md:max-w-none lg:h-96">
                <img
                  className="absolute bottom-[-34%] left-1/2 h-[142%] max-w-none -translate-x-1/2 object-contain object-bottom drop-shadow-2xl md:bottom-[-30%] md:h-[140%]"
                  src="/images/cta-naki-character-closeup.png"
                  alt="Karakter Naki Code mengajak konsultasi"
                  width="1080"
                  height="1440"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
