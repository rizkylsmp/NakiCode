import { Link } from "react-router-dom";
import { getTemplateCategoryPath } from "../../utils/template-url";

const productLinks = [
  { label: "Semua Design", href: "/design" },
  { label: "Company Profile", href: getTemplateCategoryPath("Company Profile") },
  { label: "Toko Online", href: getTemplateCategoryPath("E-commerce") },
  { label: "Website Portofolio", href: getTemplateCategoryPath("Portfolio") },
  { label: "Admin Panel", href: getTemplateCategoryPath("CRUD") },
];

const resourceLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Cara Kerja", href: "/#cara-kerja" },
];

const companyLinks = [
  { label: "Portofolio", href: "/portofolio" },
  { label: "Katalog Design", href: "/design" },
  { label: "Artikel Terbaru", href: "/blog" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-naki-primary text-white">
      <div className="px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand + Socials */}
            <div className="sm:col-span-2 lg:col-span-1">
              <a className="inline-flex items-center" href="/" aria-label="NakiCode home">
                <img
                  className="naki-logo-image naki-logo-image-on-dark h-12 w-auto object-contain"
                  src="/logo.png"
                  alt="Naki Code"
                  width="1024"
                  height="1024"
                />
              </a>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Jasa pembuatan website dengan design referensi yang siap disesuaikan.
                Pilih inspirasi visualnya, lalu kami wujudkan sesuai kebutuhanmu.
              </p>
            </div>

            {/* Produk */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                Produk
              </h4>
              <ul className="mt-4 grid gap-2.5">
                {productLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      className="text-sm text-slate-400 transition hover:text-blue-400"
                      to={href}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sumber */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                Sumber
              </h4>
              <ul className="mt-4 grid gap-2.5">
                {resourceLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      className="text-sm text-slate-400 transition hover:text-blue-400"
                      to={href}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Perusahaan */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                Perusahaan
              </h4>
              <ul className="mt-4 grid gap-2.5">
                {companyLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      className="text-sm text-slate-400 transition hover:text-blue-400"
                      to={href}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              &copy; {currentYear} Naki Code. Seluruh hak cipta dilindungi.
            </p>
            <div className="flex gap-6">
              <Link
                className="text-sm text-slate-500 transition hover:text-blue-400"
                to="/kebijakan-privasi"
              >
                Kebijakan Privasi
              </Link>
              <Link
                className="text-sm text-slate-500 transition hover:text-blue-400"
                to="/syarat-ketentuan"
              >
                Syarat &amp; Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
