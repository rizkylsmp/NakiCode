import { Mail } from "lucide-react";

// Simple inline SVG icons for social links since lucide-react doesn't export brand icons
function GitHubIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

const productLinks = [
  { label: "Semua Design", href: "/template" },
  { label: "Landing Page", href: "/template?category=Landing%20Page" },
  { label: "Dashboard", href: "/template?category=Dashboard" },
  { label: "E-commerce", href: "/template?category=E-commerce" },
];

const resourceLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Dokumentasi", href: "#" },
  { label: "Lisensi", href: "#" },
  { label: "Changelog", href: "#" },
];

const companyLinks = [
  { label: "Tentang Kami", href: "#" },
  { label: "Karir", href: "#" },
  { label: "Kontak", href: "#" },
  { label: "Partner", href: "#" },
];

const socialLinks = [
  { icon: GitHubIcon, label: "GitHub", href: "#" },
  { icon: TwitterIcon, label: "Twitter", href: "#" },
  { icon: InstagramIcon, label: "Instagram", href: "#" },
  { icon: Mail, label: "Email", href: "#" },
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
              <div className="mt-6 flex gap-3">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="grid size-10 place-items-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label={label}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Produk */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                Produk
              </h4>
              <ul className="mt-4 grid gap-2.5">
                {productLinks.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      className="text-sm text-slate-400 transition hover:text-blue-400"
                      href={href}
                    >
                      {label}
                    </a>
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
                    <a
                      className="text-sm text-slate-400 transition hover:text-blue-400"
                      href={href}
                    >
                      {label}
                    </a>
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
                    <a
                      className="text-sm text-slate-400 transition hover:text-blue-400"
                      href={href}
                    >
                      {label}
                    </a>
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
              <a
                className="text-sm text-slate-500 transition hover:text-blue-400"
                href="#"
              >
                Kebijakan Privasi
              </a>
              <a
                className="text-sm text-slate-500 transition hover:text-blue-400"
                href="#"
              >
                Syarat &amp; Ketentuan
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
