import { ArrowRight, BadgeCheck, Code2, Search, Sparkles } from "lucide-react";
import type { TemplateItem } from "../content";

type HeroProps = {
  query: string;
  onQueryChange: (value: string) => void;
  featuredTemplates: TemplateItem[];
};

export function Hero({ query, onQueryChange, featuredTemplates }: HeroProps) {
  return (
    <section className="relative z-0 grid w-full gap-9 px-5 pb-10 pt-8 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-14 lg:pt-12 xl:px-12 2xl:px-16">
      <div className="min-w-0">
        <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-naki-primary md:text-6xl xl:text-7xl">
          Template website siap pakai dari Naki Code.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-naki-smoke">
          Cari source code untuk portfolio, toko online, top up games, web
          bucin, CRUD, sampai company profile. Pilih template, lihat demo, lalu
          beli atau request custom.
        </p>

        <div className="mt-7 flex max-w-2xl flex-col gap-3 rounded-lg border border-naki-steel bg-naki-frost p-2 shadow-sm sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Cari template</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-naki-smoke"
              size={18}
            />
            <input
              className="h-11 w-full rounded-md bg-naki-frost pl-10 pr-3 text-sm font-semibold outline-none placeholder:text-naki-smoke"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Cari portfolio, e-commerce, top up..."
              type="search"
            />
          </label>
          <a
            className="inline-flex h-11 items-center justify-center rounded-md bg-naki-secondary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
            href="#template"
          >
            Cari
          </a>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-5 text-sm font-bold text-naki-frost shadow-sm transition hover:bg-naki-primary"
            href="#template"
          >
            Lihat template
            <ArrowRight size={17} />
          </a>
          <a
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-naki-steel bg-naki-frost px-5 text-sm font-bold text-naki-secondary transition hover:border-naki-smoke"
            href="#layanan"
          >
            Request custom
            <Sparkles size={17} />
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-naki-smoke">
          {["Kode bersih", "Mudah dicustom", "Tanpa domain/hosting"].map(
            (item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <BadgeCheck size={17} className="text-naki-secondary" />
                {item}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="relative z-0 w-full min-w-0 rounded-xl border border-naki-steel bg-naki-frost p-4 shadow-naki-soft">
        <div className="overflow-hidden rounded-lg bg-naki-primary p-4 text-naki-frost">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-naki-frost" />
              <span className="size-3 rounded-full bg-naki-steel" />
              <span className="size-3 rounded-full bg-naki-secondary" />
            </div>
            <span className="rounded-md bg-naki-frost/10 px-2.5 py-1 text-xs font-bold text-naki-frost">
              Template Store
            </span>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-lg bg-naki-secondary p-4">
              <p className="text-xs font-bold uppercase text-naki-frost">
                Checkout Preview
              </p>
              <h2 className="mt-3 text-2xl font-black leading-tight">
                Naki Storefront
              </h2>
              <p className="mt-3 text-sm leading-6 text-naki-frost">
                E-commerce React + Express dengan product grid, cart drawer, dan
                order summary.
              </p>
              <div className="mt-5 flex min-w-0 items-end justify-between gap-3">
                <span className="min-w-0 text-2xl font-black text-naki-frost">
                  Rp249K
                </span>
                <button className="shrink-0 rounded-lg bg-naki-frost px-3 py-2 text-xs font-black text-naki-primary">
                  Pilih
                </button>
              </div>
            </div>
            <div className="grid min-w-0 gap-3">
              {featuredTemplates.slice(0, 3).map((template) => (
                <div
                  key={template.title}
                  className="flex min-w-0 items-center gap-3 overflow-hidden rounded-lg bg-naki-frost p-3 text-naki-primary"
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-lg ${template.accentClass}`}
                  >
                    <Code2 className="text-naki-frost" size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-black leading-5">
                      {template.title}
                    </p>
                    <p className="text-xs font-semibold text-naki-smoke">
                      {template.category}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-black text-naki-secondary">
                    {template.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-naki-frost/10 bg-naki-secondary p-3 font-mono text-xs leading-6 text-naki-frost">
            <p>$ naki-code add template</p>
            <p>category: portfolio | ecommerce | topup | bucin</p>
            <p>domain: not included | source: ready</p>
          </div>
        </div>
      </div>
    </section>
  );
}
