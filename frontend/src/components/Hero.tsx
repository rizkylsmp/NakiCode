import { ArrowRight, Check, Code2, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative z-0 w-full overflow-hidden">
      {/* Subtle gradient glow at top */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/80 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-5 md:px-8 xl:px-12 2xl:px-16 py-16 md:py-20 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left: Text content */}
          <div className="lg:pr-8">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
              <Sparkles size={14} />
              120+ template berkualitas untuk developer
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-naki-primary md:text-5xl lg:text-6xl xl:text-7xl">
              Bangun Project{" "}
              <span className="text-blue-500">Lebih Cepat</span> dengan
              Kode Siap Pakai
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-naki-smoke md:text-lg lg:mx-0">
              Temukan template premium, komponen UI, dan starter kit yang dirancang
              untuk skala profesional. Mulai dari landing page hingga dashboard lengkap.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-naki-primary px-6 text-sm font-semibold text-white transition hover:bg-naki-primary/90"
                href="/template"
              >
                Jelajahi Template
                <ArrowRight size={17} />
              </a>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-6 text-sm font-semibold text-naki-primary transition hover:bg-naki-frost"
                href="/template"
              >
                Lihat Demo
              </a>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex items-center gap-2 text-sm text-naki-smoke">
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
                Dipercaya <strong className="text-naki-primary">3.500+</strong>{" "}
                developer
              </span>
            </div>

            {/* Feature checks */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {["Source code bersih", "Dokumentasi lengkap", "Update berkala", "Support komunitas"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 text-sm font-medium text-naki-smoke">
                  <Check size={16} className="text-blue-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Preview card */}
          <div className="relative lg:pl-4">
            {/* Main card */}
            <div className="overflow-hidden rounded-2xl border border-naki-steel/60 bg-white shadow-lg">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-naki-steel/60 bg-naki-frost px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-red-400/80" />
                  <span className="size-3 rounded-full bg-amber-400/80" />
                  <span className="size-3 rounded-full bg-green-400/80" />
                </div>
                <div className="mx-auto flex-1 rounded-lg bg-white px-3 py-1 text-center text-xs text-naki-smoke">
                  localhost:3000
                </div>
              </div>

              {/* Code preview */}
              <div className="bg-naki-primary p-6 text-sm font-mono leading-relaxed text-slate-300">
                <p>
                  <span className="text-purple-400">import</span>{" "}
                  <span className="text-green-400">{"{ Hero }"}</span>{" "}
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-amber-300">'@nakicode/ui'</span>;
                </p>
                <p className="mt-3">
                  <span className="text-purple-400">export default</span>{" "}
                  <span className="text-purple-400">function</span>{" "}
                  <span className="text-blue-400">App</span>() {"{"}
                </p>
                <p className="ml-6">
                  <span className="text-purple-400">return</span> (
                </p>
                <p className="ml-10">
                  <span className="text-blue-400">&lt;Hero</span>
                </p>
                <p className="ml-14">
                  <span className="text-green-400">title</span>=
                  <span className="text-amber-300">"Launch Faster"</span>
                </p>
                <p className="ml-14">
                  <span className="text-green-400">cta</span>=
                  <span className="text-amber-300">"Get Started"</span>
                </p>
                <p className="ml-10">
                  <span className="text-blue-400">/&gt;</span>
                </p>
                <p className="ml-6">);</p>
                <p>{"}"}</p>
              </div>
            </div>

            {/* Floating badge: Build Success */}
            <div className="absolute -bottom-6 -left-6 rounded-xl border border-green-200 bg-white px-5 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-green-100 text-green-600">
                  <Check size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-naki-primary">Build sukses</p>
                  <p className="text-[10px] text-naki-smoke">Deploy dalam 5 menit</p>
                </div>
              </div>
            </div>

            {/* Floating badge: Template count */}
            <div className="absolute -right-4 -top-4 rounded-xl border border-blue-200 bg-white px-5 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-blue-100 text-blue-600">
                  <Code2 size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-naki-primary">120+ Template</p>
                  <p className="text-[10px] text-naki-smoke">Siap digunakan</p>
                </div>
              </div>
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
                120+
              </div>
              <div className="mt-1 text-sm text-naki-smoke">Template Tersedia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-naki-primary md:text-3xl">
                3.500+
              </div>
              <div className="mt-1 text-sm text-naki-smoke">Developer Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-naki-primary md:text-3xl">
                12.000+
              </div>
              <div className="mt-1 text-sm text-naki-smoke">Transaksi Sukses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-naki-primary md:text-3xl">
                4.9/5
              </div>
              <div className="mt-1 text-sm text-naki-smoke">Rating Puas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
