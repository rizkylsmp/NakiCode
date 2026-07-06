import { ArrowRight, Check, Code2, Sparkles } from "lucide-react";

type HeroProps = {
  totalTemplates: number;
  totalDevelopers: number;
  totalTransactions: number;
  averageRating: number;
};

export function Hero({
  totalTemplates,
  totalDevelopers,
  totalTransactions,
  averageRating,
}: HeroProps) {
  return (
    <section className="relative z-0 w-full overflow-hidden">
      {/* Subtle gradient glow at top */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/80 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-8 sm:px-5 md:px-8 md:py-10 lg:py-12 xl:px-12 2xl:px-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
          {/* Left: Text content */}
          <div className="lg:pr-8">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
              <Sparkles size={14} />
              {totalTemplates}+ design website siap disesuaikan
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-naki-primary md:text-5xl lg:text-6xl">
              Wujudkan Website{" "}
              <span className="text-blue-500">Sesuai Brand</span> dari Design
              Pilihanmu
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-naki-smoke md:text-lg lg:mx-0">
              Pilih design sebagai inspirasi, lalu kami sesuaikan tampilan,
              konten, dan fiturnya menjadi website yang benar-benar cocok untuk
              kebutuhanmu.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-naki-primary px-6 text-sm font-semibold text-white transition hover:bg-naki-primary/90"
                href="/template"
              >
                Pilih Design
                <ArrowRight size={17} />
              </a>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-6 text-sm font-semibold text-naki-primary transition hover:bg-naki-frost"
                href="/template"
              >
                Lihat Referensi
              </a>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center gap-2 text-sm text-naki-smoke">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="grid size-8 place-items-center rounded-full border-2 border-white bg-naki-steel text-[10px] font-semibold text-naki-smoke"
                  >
                    {String.fromCharCode(64 + i)}
                  </span>
                ))}
              </div>
              <span className="font-medium">
                Dipercaya{" "}
                <strong className="text-naki-primary">
                  {totalDevelopers}+
                </strong>{" "}
                pelanggan dan developer
              </span>
            </div>

            {/* Feature checks */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                "Design siap edit",
                "Revisi terarah",
                "Website responsif",
                "Source code opsional",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 text-sm font-medium text-naki-smoke"
                >
                  <Check size={16} className="text-blue-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Character visual */}
          <div className="relative order-first min-h-[320px] sm:min-h-[390px] md:order-none md:min-h-[400px] lg:pl-4">
            <div className="absolute inset-x-0 bottom-0 top-0 overflow-visible sm:top-8 lg:left-8 lg:right-0">
              <img
                className="absolute bottom-0 left-1/2 h-[370px] max-w-none -translate-x-1/2 object-contain object-bottom sm:h-[420px] md:bottom-auto md:-top-8 md:h-[470px] lg:-top-12 lg:h-[500px]"
                src="/images/hero-naki-character.png"
                alt="Karakter Naki Code sebagai visual hero"
                width="1080"
                height="1440"
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="absolute left-0 top-8 rounded-xl border border-naki-steel/70 bg-white px-5 py-3 shadow-lg sm:left-2">
              <p className="text-[11px] font-semibold uppercase text-naki-smoke">
                Design Bulan Ini
              </p>
              <p className="mt-1 text-lg font-bold text-naki-primary">
                {totalTemplates}+ Referensi
              </p>
            </div>

            <div className="absolute right-0 top-20 hidden rounded-2xl border border-blue-100 bg-white px-5 py-4 text-center shadow-lg sm:block sm:right-2">
              <span className="mx-auto grid size-10 place-items-center rounded-full bg-blue-100 text-blue-600">
                <Code2 size={18} />
              </span>
              <p className="mt-2 text-2xl font-extrabold text-naki-primary">
                {totalDevelopers}+
              </p>
              <p className="text-xs font-medium text-naki-smoke">
                <span className="sm:hidden">Project</span>
                <span className="hidden sm:inline">Project dikerjakan</span>
              </p>
            </div>

            <div className="absolute bottom-8 left-2 hidden rounded-xl border border-green-200 bg-white px-5 py-3 shadow-lg sm:flex sm:left-8">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-green-100 text-green-600">
                  <Check size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-naki-primary">
                    Website responsif
                  </p>
                  <p className="text-[10px] text-naki-smoke">
                    Siap disesuaikan brand
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-24 right-2 hidden rounded-xl border border-naki-steel/70 bg-white px-5 py-3 shadow-lg sm:block sm:right-6">
              <p className="text-[11px] font-semibold text-naki-smoke">
                Source code
              </p>
              <p className="mt-1 text-lg font-bold text-naki-primary">
                Opsional
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="border-y border-naki-steel/60 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-naki-primary md:text-3xl">
                {totalTemplates}+
              </div>
              <div className="mt-1 text-sm text-naki-smoke">
                Design Tersedia
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-naki-primary md:text-3xl">
                {totalDevelopers}+
              </div>
              <div className="mt-1 text-sm text-naki-smoke">
                Project Dikerjakan
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-naki-primary md:text-3xl">
                {totalTransactions}+
              </div>
              <div className="mt-1 text-sm text-naki-smoke">
                Transaksi Sukses
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-naki-primary md:text-3xl">
                {averageRating.toFixed(1)}/5
              </div>
              <div className="mt-1 text-sm text-naki-smoke">Rating Puas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
