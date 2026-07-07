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

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-5 md:px-8 md:py-10 lg:py-12 xl:px-12 2xl:px-16">
        <div className="grid gap-7 md:grid-cols-2 md:items-center md:gap-12">
          {/* Left: Text content */}
          <div className="text-center md:text-left lg:pr-8">
            {/* Badge */}
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 sm:px-4 sm:text-sm">
              <Sparkles size={14} />
              <span className="truncate">
                {totalTemplates}+ design website siap disesuaikan
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-extrabold leading-[1.08] tracking-tight text-naki-primary sm:text-4xl md:text-5xl lg:text-6xl">
              Wujudkan Website{" "}
              <span className="text-blue-500">Sesuai Brand</span> dari Design
              Pilihanmu
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-naki-smoke sm:text-base md:text-lg lg:mx-0">
              Pilih design sebagai inspirasi, lalu kami sesuaikan tampilan,
              konten, dan fiturnya menjadi website yang benar-benar cocok untuk
              kebutuhanmu.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center md:justify-start">
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
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-sm text-naki-smoke md:justify-start">
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
              <span className="max-w-[260px] font-medium sm:max-w-none">
                Dipercaya{" "}
                <strong className="text-naki-primary">
                  {totalDevelopers}+
                </strong>{" "}
                pelanggan dan developer
              </span>
            </div>

            {/* Feature checks */}
            <div className="mx-auto mt-7 grid max-w-sm gap-3 text-left sm:max-w-none sm:grid-cols-3 md:mx-0">
              {[
                "Design siap edit",
                "Revisi terarah",
                "Website responsif",
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
          <div className="relative min-h-[300px] sm:min-h-[360px] md:min-h-[400px] lg:pl-4">
            <div className="absolute inset-x-0 bottom-0 top-0 overflow-visible sm:top-8 lg:left-8 lg:right-0">
              <img
                className="absolute bottom-0 left-1/2 h-[330px] max-w-none -translate-x-1/2 object-contain object-bottom sm:h-[400px] md:bottom-auto md:-top-8 md:h-[470px] lg:-top-12 lg:h-[500px]"
                src="/images/hero-naki-character.png"
                alt="Karakter Naki Code sebagai visual hero"
                width="1080"
                height="1440"
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="absolute left-0 top-5 rounded-xl border border-naki-steel/70 bg-white px-4 py-2.5 shadow-lg sm:left-2 sm:top-8 sm:px-5 sm:py-3">
              <p className="text-[11px] font-semibold uppercase text-naki-smoke">
                Design Bulan Ini
              </p>
              <p className="mt-1 text-base font-bold text-naki-primary sm:text-lg">
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

          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="border-y border-naki-steel/60 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 md:px-8 md:py-12 xl:px-12 2xl:px-16">
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-4 md:gap-10">
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
