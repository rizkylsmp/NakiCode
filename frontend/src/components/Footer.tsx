export function Footer() {
  return (
    <footer
      id="login"
      className="relative z-0 w-full bg-naki-frost px-5 py-10 md:px-8 xl:px-12 2xl:px-16"
    >
      <div className="flex flex-col justify-between gap-6 border-t border-naki-steel pt-8 md:flex-row md:items-center">
        <div>
          <p className="text-lg font-black text-naki-primary">Naki Code</p>
          <p className="text-sm font-semibold text-naki-smoke">
            Template coding, source code, dan custom website.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-bold text-naki-smoke">
          <a className="hover:text-naki-primary" href="#template">
            Cari Template
          </a>
          <a className="hover:text-naki-primary" href="#layanan">
            Layanan
          </a>
          <a className="hover:text-naki-primary" href="#pertanyaan">
            Pertanyaan
          </a>
          <a className="hover:text-naki-primary" href="/admin/templates">
            Login Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
