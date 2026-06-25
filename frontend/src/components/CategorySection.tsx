import { ArrowRight, Layout, BarChart3, ShoppingCart, Smartphone, Server, FileText, Code2, Globe, Database, Gamepad2, Heart, Package } from "lucide-react";
import type { TemplateCategory } from "../content";

type CategorySectionProps = {
  categories: TemplateCategory[];
};

// Icon mapping untuk setiap kategori
const iconMap: Record<string, React.ComponentType<{ size: number }>> = {
  "Semua": Package,
  "Landing Page": Layout,
  "Dashboard": BarChart3,
  "E-commerce": ShoppingCart,
  "Mobile App": Smartphone,
  "API": Server,
  "Blog": FileText,
  "Portfolio": Globe,
  "Top up games": Gamepad2,
  "Web Bucin": Heart,
  "CRUD": Database,
  "Company": Code2,
};

const descriptions: Record<string, string> = {
  "Semua": "Semua template tersedia",
  "Landing Page": "Halaman pemasaran yang konversi tinggi",
  "Dashboard": "Panel admin & analytics",
  "E-commerce": "Toko online lengkap",
  "Mobile App": "Landing & UI kit aplikasi",
  "API": "Backend & starter kit",
  "Blog": "Tema blog & konten",
  "Portfolio": "Website portofolio personal",
  "Top up games": "Top up voucher game online",
  "Web Bucin": "Website romantis untuk pasangan",
  "CRUD": "Admin panel dengan CRUD lengkap",
  "Company": "Company profile profesional",
};

export function CategorySection({ categories }: CategorySectionProps) {
  // Filter out "Semua" karena bukan kategori sebenarnya
  const realCategories = categories.filter((c) => c !== "Semua");

  if (realCategories.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-naki-primary">
      <div className="px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Kategori
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Temukan Sesuai Kebutuhanmu
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
              Dari frontend hingga backend, kami menyediakan template untuk berbagai jenis project digital.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {realCategories.map((title) => {
              const Icon = iconMap[title] ?? Code2;
              const description = descriptions[title] ?? `Template kategori ${title}`;
              const href = `/template?category=${encodeURIComponent(title)}`;

              return (
                <a
                  key={title}
                  href={href}
                  className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10"
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-blue-500/20 text-blue-400">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-blue-400 transition group-hover:gap-2">
                    Jelajahi <ArrowRight size={14} />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
